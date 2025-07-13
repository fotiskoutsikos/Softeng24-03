import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import SessionExpiredBanner from "../../components/AdminComponents/SessionExpiredBanner";
import "../../components/OperatorComponents/OperatorMonthly.css";

function OperatorMonthly() {
    const [financials, setFinancials] = useState([]);
    const [expandedMonth, setExpandedMonth] = useState(null);
    const [error, setError] = useState(null);
    const [operatorID, setOperatorID] = useState("");

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

        const fetchFinancials = async () => {
            try {
                const response = await axios.get(`/api/monthlyCharges/${opID}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!Array.isArray(response.data)) {
                    throw new Error("Invalid response format");
                }

                setFinancials(response.data);
            } catch (err) {
                setError(err.response?.data?.error || err.message || "Error fetching financials");
            }
        };

        fetchFinancials();
    }, [navigate]);

    return (
        <div className="operator-financials-container">
            <SessionExpiredBanner />
            <h2>Operator Financials</h2>

            <div className="back-button">
                <Link to="/operatorpage">
                    <button type="button">Back to Dashboard</button>
                </Link>
            </div>

            {error && <div className="error-message"><strong>Error:</strong> {error}</div>}

            {financials.length > 0 ? (
                <div className="financials-list">
                    {financials.map(({ year, month, transactions }) => (
                        <div key={`${year}-${month}`} className="month-container">
                            <button
                                className="month-header"
                                onClick={() => setExpandedMonth(expandedMonth === `${year}-${month}` ? null : `${year}-${month}`)}
                            >
                                {new Date(year, month - 1).toLocaleString("default", { month: "long" })} {year}
                            </button>

                            {expandedMonth === `${year}-${month}` && (
                                <div className="transaction-details">
                                    <table>
                                        <thead><tr><th>Operator ID</th><th>Paid</th><th>Received</th></tr></thead>
                                        <tbody>{transactions.map(({ otherOpID, paid, received }) => (
                                            <tr key={`${year}-${month}-${otherOpID}`}>
                                                <td>{otherOpID}</td><td>€{paid.toFixed(2)}</td><td>€{received.toFixed(2)}</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : <p>Loading financial data...</p>}
        </div>
    );
}


export default OperatorMonthly;
