import pandas as pd

# Static predefined budgets per category (in AED)
PREDEFINED_BUDGETS = {
    "groceries": 200,
    "transport": 150,
    "subscriptions": 50,
    "coffee": 30,
    "entertainment": 100
}

def suggest_reallocation():
    """
    Analyze spending patterns and suggest budget reallocations.
    """
    # Load dataset
    df = pd.read_csv('Savings-Optimized_Dataset.csv')

    # Convert columns to appropriate types
    df['AmountAED'] = pd.to_numeric(df['AmountAED'], errors='coerce')
    df['TxnDate'] = pd.to_datetime(df['TxnDate'], errors='coerce', dayfirst=True)
    df = df.dropna(subset=['AmountAED', 'TxnDate', 'FlowType'])

    # Filter for debit transactions
    df = df[df['FlowType'].str.lower() == 'debit']
    df['Week'] = df['TxnDate'].dt.to_period('W')

    current_week = pd.Timestamp.now().to_period('W')
    current = df[df['Week'] == current_week]
    past = df[df['Week'] != current_week]

    avg = past.groupby('SpendType')['AmountAED'].mean().reset_index()
    curr = current.groupby('SpendType')['AmountAED'].sum().reset_index()

    merged = pd.merge(curr, avg, on='SpendType', how='outer').fillna(0)
    merged.columns = ['SpendType', 'Current', 'Average']
    merged['Difference'] = merged['Current'] - merged['Average']

    # Identify overspent and underspent categories
    overspent = merged[merged['Difference'] > 0].sort_values(by='Difference', ascending=False)
    underspent = merged[merged['Difference'] < 0].sort_values(by='Difference')

    suggestions = []

    for _, over in overspent.iterrows():
        for _, under in underspent.iterrows():
            amount = min(abs(under['Difference']), over['Difference'])
            if amount > 0:
                suggestions.append({
                    "from": under['SpendType'],
                    "to": over['SpendType'],
                    "amount": round(amount, 2)
                })
                # Update values to avoid double counting
                under['Difference'] += amount
                over['Difference'] -= amount
                if over['Difference'] <= 0:
                    break

    return suggestions if suggestions else [{"message": "No reallocation needed"}]