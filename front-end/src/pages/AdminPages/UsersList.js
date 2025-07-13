import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../components/AdminComponents/UsersList.css'; // Optional CSS for styling
import SessionExpiredBanner from '../../components/AdminComponents/SessionExpiredBanner';
import { useNavigate, Link } from 'react-router-dom';

function UsersList() {
    const [users, setUsers] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const role = sessionStorage.getItem("role");

        if (!token || role !== "admin") {
            navigate("/"); // Redirect to login if not admin or no token
            return;
        }

        setLoading(true);
        setError(null);

        axios.get('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                // ✅ CORRECTED LINE: Access the users array from response.data.users
                setUsers(response.data.users);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching users:', err);
                setError(err.response?.data?.error || 'Failed to fetch user list.');
                setLoading(false);
            });

    }, [navigate]);

    const handleDownloadCsv = () => {
        // Make API call to get CSV data
        axios.get('/api/admin/users?format=csv', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem("token")}`
            },
            responseType: 'blob' // Important: Tell axios to expect a binary blob response (for file download)
        })
            .then(response => {
                // Create a Blob from the CSV data
                const csvBlob = new Blob([response.data], { type: 'text/csv' });

                // Create a URL for the Blob
                const csvUrl = URL.createObjectURL(csvBlob);

                // Create a temporary link element to trigger download
                const downloadLink = document.createElement('a');
                downloadLink.href = csvUrl;
                downloadLink.download = 'users.csv'; // Set the filename for download
                document.body.appendChild(downloadLink); // Append to body (required for Firefox)
                downloadLink.click(); // Programmatically click the link to start download
                document.body.removeChild(downloadLink); // Remove the link
                URL.revokeObjectURL(csvUrl); // Release the URL object
            })
            .catch(error => {
                console.error("Error downloading CSV:", error);
                setError("Failed to download CSV."); // Set error state to display message
            });
    };


    if (loading) {
        return <div className="users-list-container">Loading users...</div>;
    }

    if (error) {
        return (
            <div className="users-list-container error">
                <SessionExpiredBanner />
                <h2>User List</h2>
                <div className="error-message">
                    <strong>Error:</strong> {error}
                    {error === "Failed to download CSV." && <p>Please try again later.</p>} {/* Specific message for CSV download error */}
                </div>
            </div>
        );
    }

    return (
        <div className="users-list-container">
            <h2>User List</h2>
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users && users.map(user => (
                            <tr key={user.username}>
                                <td>{user.username}</td>
                                <td>{user.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="download-button-container">
                <button onClick={handleDownloadCsv} className="download-csv-button">Download CSV</button>
            </div>
            <div className="back-to-admin-button-container">
                <Link to="/adminpage" className="back-to-admin-button">Back to Admin Dashboard</Link>
            </div>
        </div>

    );
}

export default UsersList;
