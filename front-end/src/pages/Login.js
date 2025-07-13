import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../components/CommonForm.css'; // Import the common form CSS
import { useNavigate } from 'react-router-dom';

function getTokenExpiration(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return exp;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}


function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = '/api/auth/login';
            const response = await axios.post(url, { username, password });
            const accessToken = response.data.token;

            sessionStorage.setItem("token", accessToken);
            sessionStorage.setItem("refreshToken", response.data.refreshToken);
            sessionStorage.setItem("role", response.data.role);
            sessionStorage.setItem("username", username);

            if (response.data.role === 'admin') {
                navigate('/adminpage');
            } else if (response.data.role === 'operator') {
                const operatorsURL = `/api/admin/operators?operatorcredentials=${username}`;
                const operatorsResponse = await axios.get(operatorsURL, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    }
                });
                const opid = operatorsResponse.data.operators[0].OpID;
                sessionStorage.setItem("opID", opid);
                navigate('/operatorpage');
            } else {
                setError('Unknown role. Contact support.');
            }
            const expTime = getTokenExpiration(accessToken);
            if (expTime) {
                sessionStorage.setItem("expTime", expTime.toString());
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className="form-container">
                <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="button-group">
                    <button type="submit">Login</button>
                </div>
            </form>
            {error && (
                <p className="error-message">
                    <strong>Error:</strong> {error}
                </p>
            )}
        </div>
    );
}

export default Login;
