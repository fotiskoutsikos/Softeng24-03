import React, { useState } from 'react';
import axios from 'axios';
import '../../components/AdminComponents/UserManagement.css'; // Optional CSS for styling
import { useNavigate, Link } from 'react-router-dom';

import SessionExpiredBanner from '../../components/AdminComponents/SessionExpiredBanner';
function UserManagement() {
    const [modifyUsername, setModifyUsername] = useState('');
    const [modifyPassword, setModifyPassword] = useState('');
    const [modifyRole, setModifyRole] = useState('operator');
    const [deleteUsername, setDeleteUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const navigate = useNavigate();

    const handleModifyUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        const token = sessionStorage.getItem("token");

        try {
            const response = await axios.post(`/api/admin/usermod/${modifyUsername}/${modifyPassword}?role=${modifyRole}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.status === 'OK') {
                setSuccessMessage(response.data.message || `User '${modifyUsername}' modified successfully!`);
            } else {
                setError(response.data.message || `Failed to modify user '${modifyUsername}'.`);
            }
        } catch (error) {
            console.error("User modification error:", error);
            setError(error.response?.data?.message || `Failed to modify user '${modifyUsername}'.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        const token = sessionStorage.getItem("token");

        try {
            console.log(deleteUsername);
            const response = await axios.post(`/api/admin/userdel/${deleteUsername}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.status === 'OK') {
                setSuccessMessage(response.data.message || `User '${deleteUsername}' deleted successfully!`);
                setDeleteUsername(''); // Clear delete username input on success
            } else {
                setError(response.data.message || `Failed to delete user '${deleteUsername}'.`);
            }
        } catch (error) {
            console.error("User deletion error:", error);
            setError(error.response?.data?.message || `Failed to delete user '${deleteUsername}'.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-management-container">
            <SessionExpiredBanner />
            <h2>User Management</h2>

            <div className="user-management-forms">
                <div className="modify-user-section">
                    <h3>Modify User</h3>
                    <form onSubmit={handleModifyUser} className="user-form">
                        <div className="form-group">
                            <label htmlFor="modify-username">Username:</label>
                            <input
                                type="text"
                                id="modify-username"
                                value={modifyUsername}
                                onChange={(e) => setModifyUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="modify-password">New Password:</label>
                            <input
                                type="password"
                                id="modify-password"
                                value={modifyPassword}
                                onChange={(e) => setModifyPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="modify-role">Role:</label>
                            <select
                                id="modify-role"
                                value={modifyRole}
                                onChange={(e) => setModifyRole(e.target.value)}
                            >
                                <option value="operator">Operator</option>
                                <option value="minister">Minister</option>
                            </select>
                        </div>
                        <div className="form-actions">
                            <button type="submit" disabled={loading} className="modify-button">
                                {loading ? 'Modifying User...' : 'Modify User'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="delete-user-section">
                    <h3>Delete User</h3>
                    <form onSubmit={handleDeleteUser} className="user-form">
                        <div className="form-group">
                            <label htmlFor="delete-username">Username to Delete:</label>
                            <input
                                type="text"
                                id="delete-username"
                                value={deleteUsername}
                                onChange={(e) => setDeleteUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" disabled={loading} className="delete-button">
                                {loading ? 'Deleting User...' : 'Delete User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>


            {successMessage && <div className="success-message">{successMessage}</div>}
            {error && <div className="error-message">Error: {error}</div>}

            <div className="back-to-admin-button-container">
                <Link to="/adminpage" className="back-to-admin-button">Back to Admin Dashboard</Link>
            </div>
        </div>
    );
}

export default UserManagement;
