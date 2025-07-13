import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../components/AdminComponents/ChargesBy.css'; // Adjust the path as needed
import { useNavigate, Link } from "react-router-dom";
import SessionExpiredBanner from '../../components/AdminComponents/SessionExpiredBanner';

function ChargesBy() {
  const [opid, setOpid] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Friendly names mapping: update these keys as needed to match the API response.
  const friendlyNames = {
    opid: "Operator ID",
    fromDate: "From Date",
    toDate: "To Date",
    vOpList: "Visiting Operator List",
    tollOpID: "Toll Operator ID",
    requestTimestamp: "Request Date",
    periodFrom: "From",
    periodTo: "To",
    // Add additional mappings as needed.
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");
    if (!token || !(role === "admin" || role === "operator")) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const url = `/api/chargesBy/${opid}/${fromDate}/${toDate}`;
      const token = sessionStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token missing. Please log in.");
      }
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setResult(response.data);
      setError(null);
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.error || err.message || 'Error during chargesBy request');
    }
  };

  // Helper function to render values nicely.
  const renderValue = (key, value) => {
    if (key === 'vOpList' && Array.isArray(value)) {
      return (
        <table className="inner-table">
          <thead>
            <tr>
              <th>Visiting Operator Tag</th>
              <th>Number of Passes</th>
              <th>Passes Cost</th>
            </tr>
          </thead>
          <tbody>
            {value.map((item, index) => (
              <tr key={index}>
                <td>{item.visitingOpID}</td>
                <td>{item.nPasses}</td>
                <td>{item.passesCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (typeof value === 'object') {
      return <pre className="object-pre">{JSON.stringify(value, null, 2)}</pre>;
    }
    return value.toString();
  };

  return (
    <div className="charges-by-container">
      <SessionExpiredBanner />
      <h2>Charges By</h2>
      <form onSubmit={handleSubmit} className="charges-by-form">
        <div className="form-group">
          <label>Operator ID:</label>
          <input
            type="text"
            placeholder="OpID"
            value={opid}
            onChange={(e) => setOpid(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>From:</label>
          <input
            type="text"
            placeholder="YYYYMMDD"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>To:</label>
          <input
            type="text"
            placeholder="YYYYMMDD"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button type="submit">Submit</button>
      </form>
      <div className="back-button">
        <Link to="/adminpage">
          <button type="button">Back to Dashboard</button>
        </Link>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="result-container">
          <h3>Results:</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result).map(([key, value]) => (
                <tr key={key}>
                  <td>{friendlyNames[key] || key}</td>
                  <td>{renderValue(key, value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Back to Dashboard button */}

        </div>
      )}
    </div>
  );
}

export default ChargesBy;
