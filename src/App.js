import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

function App() {
  const [transactions, setTransactions] = useState([]);
  const [reallocationSuggestion, setReallocationSuggestion] = useState(null);

  // Fetch transactions from CSV
  useEffect(() => {
    Papa.parse("/Savings-Optimized_Dataset.csv", {
      download: true,
      header: true,
      complete: (result) => {
        const cleaned = result.data.filter(
          (t) => t.AmountAED && !isNaN(t.AmountAED)
        );
        setTransactions(cleaned);
      },
    });

    // Fetch reallocation suggestions from the backend API
    fetch('/api/suggest-reallocation')
      .then(response => response.json())
      .then(data => setReallocationSuggestion(data))
      .catch(error => console.error("Error fetching reallocation:", error));
  }, []);

  const isSameMonthYear = (dateStr, month, year) => {
    const [day, txnMonth, txnYear] = dateStr.split(/[\/\-.]/);
    return parseInt(txnMonth) === month + 1 && parseInt(txnYear) === year;
  };

  const generateMonthlySavings = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlySavings = [];
    for (let i = 0; i < 4; i++) {
      const month = currentMonth - i < 0 ? currentMonth - i + 12 : currentMonth - i;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;

      const monthlyTransactions = transactions.filter((t) =>
        t.TxnDate && isSameMonthYear(t.TxnDate, month, year)
      );

      const totalDebit = monthlyTransactions.reduce(
        (sum, t) =>
          t.FlowType.toLowerCase() === "debit"
            ? sum + parseFloat(t.AmountAED || 0)
            : sum,
        0
      );

      const totalCredit = monthlyTransactions.reduce(
        (sum, t) =>
          t.FlowType.toLowerCase() === "credit"
            ? sum + parseFloat(t.AmountAED || 0)
            : sum,
        0
      );

      const savings = totalCredit - totalDebit;
      monthlySavings.push({
        month: new Date(year, month).toLocaleString("default", { month: "short" }),
        savings: parseFloat(savings.toFixed(2)),
      });
    }

    return monthlySavings.reverse();
  };

  const lineData = generateMonthlySavings();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((t) =>
    t.TxnDate && isSameMonthYear(t.TxnDate, currentMonth, currentYear)
  );

  const categoryTotals = monthlyTransactions.reduce((acc, t) => {
    const cat = t.SpendType || "Uncategorized";
    if (t.FlowType.toLowerCase() === "debit") {
      acc[cat] = ((acc[cat] ? parseFloat(acc[cat]) : 0) + parseFloat(t.AmountAED || 0));
    }
    return acc;
  }, {});

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: parseFloat(value),
  }));

  const barData = reallocationSuggestion
    ? reallocationSuggestion.map(({ from, to, amount }) => ({
        category: `${from} → ${to}`,
        amount: parseFloat(amount.toFixed(2)),
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-center mb-10">ZenBudget</h1>

      {/* Line Chart */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-10">
        <h2 className="text-2xl font-semibold mb-4">Savings Over Time</h2>
        <LineChart width={600} height={300} data={lineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => parseFloat(value).toFixed(2)} />
          <Legend />
          <ReferenceLine y={0} stroke="red" strokeDasharray="5 5" />
          <Line type="monotone" dataKey="savings" stroke="#8884d8" />
        </LineChart>
      </div>

      {/* Pie Chart */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-10">
        <h2 className="text-2xl font-semibold mb-4">Spending by Category</h2>
        <PieChart width={500} height={450}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={130}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => parseFloat(value).toFixed(2)} />
        </PieChart>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          Budget Reallocation Suggestions
        </h2>
        <BarChart width={700} height={300} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip formatter={(value) => parseFloat(value).toFixed(2)} />
          <Legend />
          <Bar dataKey="amount" fill="#82ca9d" />
        </BarChart>
      </div>

      {/* Reallocation Summary */}
      <div className="bg-blue-100 p-4 rounded-lg shadow-md mt-6">
        <h3 className="text-xl font-semibold">Auto Reallocation Summary</h3>
        {reallocationSuggestion && reallocationSuggestion.length > 0 ? (
          reallocationSuggestion.map(({ from, to, amount }, index) => (
            <p key={index}>
              Reallocated AED {amount.toFixed(2)} from{" "}
              <strong>{from}</strong> to <strong>{to}</strong>.
            </p>
          ))
        ) : (
          <p>No reallocation needed this month. Great job staying on track! 🎯</p>
        )}
      </div>
    </div>
  );
}

export default App;