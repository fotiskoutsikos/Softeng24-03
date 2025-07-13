import React, { useState } from 'react';
import axios from 'axios';
import '../../components/AdminComponents/AddPasses.css'; // Optional CSS for styling
import { useNavigate, Link } from 'react-router-dom';
import Papa from 'papaparse'; // For CSV parsing in browser
import SessionExpiredBanner from '../../components/AdminComponents/SessionExpiredBanner';


function AddPasses() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const navigate = useNavigate();

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

    const handleAddPasses = async () => {
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
            await axios.post('/api/admin/addpasses', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccessMessage("Passes added successfully!");
            setFilePreview([]); // Clear preview on success
            setSelectedFile(null); // Clear selected file on success
        } catch (error) {
            console.error("Add passes error:", error);
            setError(error.response?.data?.message || "Failed to add passes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-passes-container">
            <SessionExpiredBanner />
            <h2>Add Passes</h2>

            <div className="upload-section">
                <label htmlFor="passes-csv-upload" className="upload-label">Upload Passes CSV File:</label>
                <input
                    id="passes-csv-upload"
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
                                    {filePreview[0] && Object.keys(filePreview[0]).map(header => (
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
                <button onClick={handleAddPasses} disabled={loading} className="add-button">
                    {loading ? 'Adding Passes...' : 'Add Passes'}
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

export default AddPasses;
