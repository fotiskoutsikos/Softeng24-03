import React, { useState } from 'react';
import axios from 'axios';
import '../../components/AdminComponents/ResetPasses.css'; // Optional CSS for styling
import { useNavigate, Link } from 'react-router-dom';
import SessionExpiredBanner from '../../components/AdminComponents/SessionExpiredBanner';


function ResetPasses() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [confirmationVisible, setConfirmationVisible] = useState(false); // State for confirmation dialog
    const navigate = useNavigate();

    const handleResetPasses = async () => {
        setConfirmationVisible(true); // Show confirmation dialog
    };

    const confirmReset = async () => {
        setConfirmationVisible(false); // Hide confirmation dialog after confirmation

        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        const token = sessionStorage.getItem("token");

        try {
            const response = await axios.post('/api/admin/resetpasses', {}, { // Empty body for POST request
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.status === 'OK') {
                setSuccessMessage("Passes and related data reset successfully!");
            } else {
                setError(response.data.message || "Failed to reset passes. (Status not OK)"); // Handle non-OK status
            }
        } catch (error) {
            console.error("Reset passes error:", error);
            setError(error.response?.data?.message || "Failed to reset passes.");
        } finally {
            setLoading(false);
        }
    };

    const cancelReset = () => {
        setConfirmationVisible(false); // Hide confirmation dialog on cancel
    };

    return (
        <div className="reset-passes-container">
            <SessionExpiredBanner />
            <h2>Reset All Passes and Data</h2>
            <p>
                This action will delete all pass records, tags, user accounts (except admin), and refresh tokens from the system.
                This operation is irreversible.
            </p>

            <div className="action-buttons">
                <button onClick={handleResetPasses} disabled={loading} className="reset-button">
                    {loading ? 'Resetting Passes...' : 'Reset Passes'}
                </button>
            </div>

            {confirmationVisible && (
                <div className="confirmation-dialog">
                    <p>Are you sure you want to reset ALL passes and related data?</p>
                    <div className="confirmation-buttons">
                        <button onClick={confirmReset} className="confirm-button" disabled={loading}>
                            {loading ? 'Resetting...' : 'Yes, Reset Passes'}
                        </button>
                        <button onClick={cancelReset} className="cancel-button" disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ ADD BACK TO ADMIN HOMEPAGE BUTTON */}
            <div className="back-to-admin-button-container">
                <Link to="/adminpage" className="back-to-admin-button">Back to Admin Dashboard</Link>
            </div>

            {successMessage && <div className="success-message">{successMessage}</div>}
            {error && <div className="error-message">Error: {error}</div>}
        </div>
    );
}

export default ResetPasses;
