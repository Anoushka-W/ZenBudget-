from flask import Flask, redirect, request, session, url_for, jsonify
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import datetime
import os

app = Flask(__name__)
app.secret_key = 'your_super_secret_key_here'
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

CLIENT_SECRETS_FILE = "client_secret.json"
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
REDIRECT_URI = 'http://localhost:5000/oauth2callback'

analyzer = SentimentIntensityAnalyzer()

@app.route('/')
def home():
    return '<a href="/authorize">Connect Google Calendar</a>'

@app.route('/authorize')
def authorize():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    auth_url, state = flow.authorization_url(prompt='consent')
    session['state'] = state
    return redirect(auth_url)

@app.route('/oauth2callback')
def oauth2callback():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials

    service = build('calendar', 'v3', credentials=credentials)

    # 3 days before and after today
    start_time = (datetime.datetime.utcnow() - datetime.timedelta(days=3)).isoformat() + 'Z'
    end_time = (datetime.datetime.utcnow() + datetime.timedelta(days=3)).isoformat() + 'Z'

    events_result = service.events().list(
        calendarId='primary',
        timeMin=start_time,
        timeMax=end_time,
        singleEvents=True,
        orderBy='startTime'
    ).execute()

    events = events_result.get('items', [])

    mood_counts = {"happy": 0, "neutral": 0, "sad": 0}

    for event in events:
        title = event.get('summary', '')
        if not title:
            continue
        score = analyzer.polarity_scores(title)['compound']
        if score >= 0.3:
            mood_counts['happy'] += 1
        elif score <= -0.3:
            mood_counts['sad'] += 1
        else:
            mood_counts['neutral'] += 1

    return jsonify({
        "events_analyzed": len(events),
        "mood_summary": mood_counts,
        "date_range": {
            "from": start_time,
            "to": end_time
        }
    })

if __name__ == '__main__':
    app.run(debug=True)
