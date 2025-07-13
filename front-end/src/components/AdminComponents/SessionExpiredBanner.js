// src/components/SessionExpiredBanner.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SessionExpiredBanner.css';

function SessionExpiredBanner() {
	const navigate = useNavigate();
	const [isExpired, setIsExpired] = useState(false);
	const token = sessionStorage.getItem("token");

	const checkExpiration = () => {
		const token = sessionStorage.getItem("token");
		if (!token) {
			setIsExpired(true);
			return;
		}

		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			const expTime = payload.exp * 1000; // Convert to milliseconds
			const now = Date.now();
			setIsExpired(now > expTime);
		} catch (e) {
			setIsExpired(true);
		}
	};
	// Check every 30 seconds
	useEffect(() => {
		checkExpiration();
		const interval = setInterval(checkExpiration, 30000);
		return () => clearInterval(interval);
	}, []);

	const handleClick = () => {
		sessionStorage.clear();
		navigate("/");
		window.location.reload(); // Ensure fresh state
	};

	if (!isExpired) return null;

	return (
		<div className="session-expired-banner">
			<p>Your session has expired. Please log in again.</p>
			<button onClick={handleClick}>Go to Login</button>
		</div>
	);
}
// A simple function to decode a JWT and check expiration
// 
export default SessionExpiredBanner;
