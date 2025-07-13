import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Or your apiClient.js if you implemented refresh tokens
import '../../components/AdminComponents/HealthCheck.css'; // Optional: CSS for styling
import { useNavigate, Link } from 'react-router-dom';
import SessionExpiredBanner from '../../components/AdminComponents/SessionExpiredBanner';

function HealthCheck() {
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");

    // Authentication Check: Redirect if no token or unauthorized role
    if (!token || !role === "admin") {
      navigate("/"); // Redirect to login page
      return; // Important: Exit the useEffect to prevent further execution
    }

    setLoading(true); // Start loading
    setError(null); // Clear any previous errors

    console.log(token);
    axios.get('/api/admin/healthcheck', { // Use axios (or apiClient if you have refresh token setup)
      headers: {
        'Authorization': `Bearer ${token}` // Include token in Authorization header
      }
    })
      .then(response => {
        setHealthData(response.data);
        setLoading(false); // Loading finished
      })
      .catch(err => {
        console.error('Health check error:', err);
        setError(err.response?.data?.error || 'Failed to fetch health check data.');
        setLoading(false); // Loading finished even with error
      });

  }, [navigate]); // Dependency array includes navigate

  if (loading) {
    return <div className="health-check-container">Loading health data...</div>; // Or a spinner
  }

  if (error) {
    return (
      <div className="health-check-container error">
        <SessionExpiredBanner />
        <h2>System Health Check</h2>
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="health-check-container">
      <SessionExpiredBanner />
      <h2>System Health Check</h2>
      <div className="health-check-card">
        {healthData && ( // Conditionally render health data to avoid errors if it's null
          <>
            <div className="health-check-row">
              <span className="health-check-label">Status:</span>
              <span className="health-check-value">{healthData.status}</span>
            </div>
            <div className="health-check-row">
              <span className="health-check-label">Database Connection:</span>
              <span className="health-check-value">{healthData.dbconnection}</span>
            </div>
            <div className="health-check-row">
              <span className="health-check-label">Toll Stations:</span>
              <span className="health-check-value">{healthData.n_stations}</span>
            </div>
            <div className="health-check-row">
              <span className="health-check-label">Tags:</span>
              <span className="health-check-value">{healthData.n_tags}</span>
            </div>
            <div className="health-check-row">
              <span className="health-check-label">Passes:</span>
              <span className="health-check-value">{healthData.n_passes}</span>
            </div>
            <div className="health-check-row">
              <span className="health-check-label">Timestamp:</span>
              <span className="health-check-value">{healthData.timestamp}</span>
            </div>
          </>
        )}
      </div>
      <div className="back-to-admin-button-container">
        <Link to="/adminpage" className="back-to-admin-button">Back to Admin Dashboard</Link>
      </div>
    </div>
  );
}

export default HealthCheck;
