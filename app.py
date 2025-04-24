from flask import Flask, jsonify, redirect
from flask_cors import CORS
from savings import suggest_reallocation

app = Flask(__name__)
CORS(app)

# Root route (optional)
@app.route('/')
def home():
    return "Welcome to ZenBudget Backend! Visit /api/suggest-reallocation for reallocation suggestions."

# API route
@app.route('/api/suggest-reallocation', methods=['GET'])
def suggest_reallocation_api():
    try:
        suggestions = suggest_reallocation()
        return jsonify(suggestions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)