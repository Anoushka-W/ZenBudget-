import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

const savingsGoal = 1000;
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

function App() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    Papa.parse("/synthetic_budget_dataset_500.csv", {
      download: true,
      header: true,
      complete: (result) => {
        const cleaned = result.data.filter(t => t.amount && !isNaN(t.amount));
        setTransactions(cleaned);
      }
    });
  }, []);

  const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const currentSavings = savingsGoal * 1.5 - totalSpent;

  const categoryData = transactions.reduce((acc, t) => {
    const cat = t.category || "Uncategorized";
    acc[cat] = acc[cat] || { spent: 0, reallocated: 0 };
    acc[cat].spent += parseFloat(t.amount || 0);
    acc[cat].reallocated = parseFloat(t.budget_category_limit || 0);
    return acc;
  }, {});

  const pieData = Object.entries(categoryData).map(([name, val]) => ({ name, value: val.spent }));

  const barData = Object.entries(categoryData).map(([category, data]) => ({
    category,
    Spent: data.spent,
    Reallocated: data.reallocated
  }));

  const lineData = [
    { month: "Jan", savings: 1400 },
    { month: "Feb", savings: 2650 },
    { month: "Mar", savings: 7900 },
    { month: "Apr", savings: 9000 - currentSavings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-center mb-10">ZenBudget</h1>

      <div className="bg-white rounded-lg p-6 shadow-md mb-10">
        <h2 className="text-2xl font-semibold mb-4">Savings Over Time</h2>
        <LineChart width={600} height={300} data={lineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <ReferenceLine y={savingsGoal} label="Goal" stroke="red" strokeDasharray="5 5" />
          <Line type="monotone" dataKey="savings" stroke="#8884d8" />
        </LineChart>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md mb-10">
        <h2 className="text-2xl font-semibold mb-4">Spending by Category</h2>
        <PieChart width={400} height={300}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            dataKey="value"
            label
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md mb-10">
        <h2 className="text-2xl font-semibold mb-4">Actual vs Reallocated Budget (Current Month)</h2>
        <BarChart width={600} height={300} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Spent" fill="#8884d8" />
          <Bar dataKey="Reallocated" fill="#82ca9d" />
        </BarChart>
      </div>

      <div className="bg-green-100 p-4 rounded-lg mb-6 text-lg font-medium text-green-900">
        💰 Current Savings: ${currentSavings.toFixed(2)}
      </div>

      <div className="bg-blue-100 p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold">Auto Reallocation Occurred</h3>
        <p>Reallocate your grocery budget to reduce overspending in Transport 🚗</p>
      </div>
    </div>
  );
}

export default App;