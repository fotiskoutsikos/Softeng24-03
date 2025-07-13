import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../components/AdminComponents/ResetStations.css'; // Optional CSS for styling
import { useNavigate, Link } from 'react-router-dom';
import Papa from 'papaparse'; // For CSV parsing in browser
import SessionExpiredBanner from '../../components/AdminComponents/SessionExpiredBanner';


function ResetStations() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const role = sessionStorage.getItem("role");

        // Authentication Check: Redirect if no token or unauthorized role
        if (!token || !role === "admin") {
            navigate("/"); // Redirect to login page
            return; // Important: Exit the useEffect to prevent further execution
        }
    });

    const handleFileChange = (event) => {
        setSuccessMessage(null); // Clear success message on new file selection
        setError(null); // Clear any previous errors
        setSelectedFile(event.target.files[0]);
        setFilePreview([]); // Clear previous preview

        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true, // Assumes CSV has headers
                preview: 5, // Preview first 5 rows
                complete: (results) => {
                    setFilePreview(results.data);
                },
                error: (err) => {
                    setError(`Error parsing CSV file: ${err.message}`);
                    setSelectedFile(null);
                }
            });
        }
    };

    const handleResetStations = async () => {
        if (!selectedFile) {
            setError("Please select a CSV file to upload.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        const formData = new FormData();
        formData.append('file', selectedFile);
        const token = sessionStorage.getItem("token");

        try {
            await axios.post('/api/admin/resetstations', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccessMessage("Stations reset successfully!");
            setFilePreview([]); // Clear preview on success
            setSelectedFile(null); // Clear selected file on success
        } catch (error) {
            console.error("Reset stations error:", error);
            setError(error.response?.data?.message || "Failed to reset stations.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-stations-container">
            <SessionExpiredBanner />
            <h2>Reset Toll Stations</h2>

            <div className="upload-section">
                <label htmlFor="station-csv-upload" className="upload-label">Upload Stations CSV File:</label>
                <input
                    id="station-csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="upload-input"
                />
            </div>

            {filePreview.length > 0 && (
                <div className="file-preview">
                    <h3>CSV File Preview (First 5 Rows):</h3>
                    <div className="table-responsive">
                        <table className="preview-table">
                            <thead>
                                <tr>
                                    {Object.keys(filePreview[0]).map(header => (
                                        <th key={header}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filePreview.map((row, index) => (
                                    <tr key={index}>
                                        {Object.values(row).map((cell, cellIndex) => (
                                            <td key={cellIndex}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="action-buttons">
                <button onClick={handleResetStations} disabled={loading} className="reset-button">
                    {loading ? 'Resetting Stations...' : 'Reset Stations'}
                </button>
            </div>

            <div className="back-to-admin-button-container">
                <Link to="/adminpage" className="back-to-admin-button">Back to Admin Dashboard</Link>
            </div>

            {successMessage && <div className="success-message">{successMessage}</div>}
            {error && <div className="error-message">Error: {error}</div>}
        </div>
    );
}

export default ResetStations;
