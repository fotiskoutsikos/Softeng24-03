import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../components/CommonForm.css';
import { useNavigate, Link } from "react-router-dom";
import SessionExpiredBanner from '../../components/AdminComponents/SessionExpiredBanner';

function OperatorFinancials() {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [financials, setFinancials] = useState(null);
    const [error, setError] = useState(null);
    const [operatorID, setOperatorID] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const opID = sessionStorage.getItem("opID");
        const token = sessionStorage.getItem("token");
        const role = sessionStorage.getItem("role");
        if (!token || role !== "operator") {
            navigate("/");
            return;
        }
        setOperatorID(opID);
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = `/api/operatorFinancials/${operatorID}/${fromDate}/${toDate}`;
            const token = sessionStorage.getItem("token");
            if (!token) {
                throw new Error("Authentication token missing. Please log in.");
            }
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Response data:", response.data);

            const data = Array.isArray(response.data)
                ? response.data
                : response.data.financials; // Adjust this if the array is wrapped

            if (!Array.isArray(data)) {
                throw new Error("Expected financial data to be an array.");
            }


            // Calculate the difference and determine the color
            const dataWithDifference = data.map(item => {
                const difference = (item.received - item.paid).toFixed(2);
                let color = 'black'; // Default color
                if (difference > 0) {
                    color = 'green';
                } else if (difference < 0) {
                    color = 'red';
                }
                return {
                    ...item,
                    difference: difference,
                    color: color,
                };
            });
            setFinancials(dataWithDifference);
            setError(null);
        } catch (err) {
            setFinancials(null);
            setError(err.response?.data?.error || err.message || 'Error fetching financials');
        }
    };

    return (
        <div className="operator-financials-container">
            <SessionExpiredBanner />
            <h2>Operator Financials</h2>
            <form onSubmit={handleSubmit} className="form-container">
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
                <div className="button-group">
                    <button type="submit">Submit</button>
                </div>
            </form>
            <div className="back-button">
                <Link to="/operatorpage">
                    <button type="button">Back to Dashboard</button>
                </Link>
            </div>

            {error && (
                <div className="error-message">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {financials && (
                <div className="result-container">
                    <h3>Financial Results:</h3>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Operator ID</th>
                                <th>Paid</th>
                                <th>Received</th>
                                <th>Difference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financials.map((item) => (
                                <tr key={item.otherOpID}>
                                    <td>{item.otherOpID}</td>
                                    <td>{item.paid}</td>
                                    <td>{item.received}</td>
                                    <td style={{ color: item.color }}>{item.difference}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default OperatorFinancials;
