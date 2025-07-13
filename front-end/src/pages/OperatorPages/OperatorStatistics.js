import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Or your apiClient
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { useNavigate, Link } from 'react-router-dom';

import '../../components/AdminComponents/TollStatsChartPage.css'; // Optional CSS

function OperatorStatistics() {
  const [year, setYear] = useState('');
  const [periodType, setPeriodType] = useState('yearly');
  const [periodValue, setPeriodValue] = useState('');
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [operatorId, setOperatorId] = useState(sessionStorage.getItem("opID")); // Get OpID from sessionStorage

  useEffect(() => {
    // ✅ Add token and role check here
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");
    if (!token || role !== "operator") { // Only allow 'operator' role
      // Redirect to login if unauthorized or not operator
      navigate("/");
      return; // Important to stop further execution
    }

    // Get OpID from sessionStorage and set it in state if not already set
    if (!operatorId) {
      const storedOpId = sessionStorage.getItem("opID");
      if (storedOpId) {
        setOperatorId(storedOpId);
      } else {
        setError("Operator ID not found in session."); // Handle case where opID is missing
        return; // Stop further execution if OpID is missing
      }
    }
  }, [navigate, operatorId]); // Added operatorId to dependency array

  const handleYearChange = (event) => {
    setYear(event.target.value);
  };

  const handlePeriodTypeChange = (event) => {
    setPeriodType(event.target.value);
    setPeriodValue(''); // Reset period value when type changes
  };

  const handlePeriodValueChange = (event) => {
    setPeriodValue(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setChartData([]); // Clear previous chart data

    if (!operatorId || !year || !periodType) {
      setError('Operator ID missing or required fields are empty.');
      setLoading(false);
      return;
    }

    let apiUrl = `/api/tollStats/${operatorId}/${periodType}/${year}`; // Use operatorId from state
    if (periodType === 'monthly' || periodType === 'quarterly') {
      if (!periodValue) {
        setError(`Period value (month or quarter) is required for '${periodType}' period type.`);
        setLoading(false);
        return;
      }
      apiUrl += `/${periodValue}`;
    }

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token missing. Please log in.");
      }
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (response.status === 200 && response.data && response.data.tolls) {
        const formattedData = response.data.tolls.map(toll => ({
          name: toll.tollID,
          value: toll.totalCharges,
        }));
        setChartData(formattedData);
      } else if (response.status === 204) {
        setError('No data found for the selected criteria.');
        setChartData([]); // Ensure chart data is empty
      } else {
        setError('Failed to fetch toll statistics.');
        setChartData([]); // Ensure chart data is empty
      }
    } catch (error) {
      console.error('Error fetching toll stats:', error);
      setError(error.response?.data?.error || 'Error fetching toll statistics.');
      setChartData([]); // Ensure chart data is empty
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57', '#ff7300', '#3366cc', '#dc3912'];

  return (
    <div className="operator-stats-chart-page-container">
      <h2>My Toll Statistics Chart</h2> {/* Changed heading */}
      <form onSubmit={handleSubmit} className="operator-stats-form"> {/* Changed form class */}

        <div className="form-group">
          <label htmlFor="year">Year:</label>
          <input type="text" id="year" placeholder="YYYY" value={year} onChange={handleYearChange} />
        </div>
        <div className="form-group">
          <label htmlFor="periodType">Period Type:</label>
          <select id="periodType" value={periodType} onChange={handlePeriodTypeChange}>
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        {(periodType === 'monthly' || periodType === 'quarterly') && (
          <div className="form-group">
            <label htmlFor="periodValue">
              {periodType === 'monthly' ? 'Month (1-12):' : 'Quarter (1-4):'}
            </label>
            <input
              type="text"
              id="periodValue"
              placeholder={periodType === 'monthly' ? 'MM' : 'Q'}
              value={periodValue}
              onChange={handlePeriodValueChange}
            />
          </div>
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Generate Chart'}
        </button>
      </form>
      <div className="back-button">
        <Link to="/operatorpage"> {/* Changed link destination */}
          <button type="button">Back to Dashboard</button>
        </Link>
      </div>


      {error && <p className="error-message">Error: {error}</p>}

      {chartData.length > 0 && (
        <div className="chart-container">
          <PieChart width={800} height={400}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(2)}%`}
              outerRadius={160}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip formatter={(value) => [`€${value.toFixed(2)}`, 'Total Charges']} />
          </PieChart>
        </div>
      )}
      {loading && !error && <p>Loading chart data...</p>}
    </div>
  );
}

export default OperatorStatistics;
