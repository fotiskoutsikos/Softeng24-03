// LogoutButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
	const navigate = useNavigate();

	const handleLogout = async () => {
		const accessToken = sessionStorage.getItem("token");

		if (!accessToken) {
			// No refresh token found, just clear session and redirect (already logged out or session expired)
			sessionStorage.removeItem("token");
			sessionStorage.removeItem("refreshToken");
			sessionStorage.removeItem("role");
			navigate("/login"); // Or navigate("/"), whichever is your login route
			return; // Exit early
		}

		try {
			const response = await fetch('/api/auth/logout', { // Call backend logout endpoint
				method: 'POST',
				headers: {
					'Content-Type': 'application/json', // Indicate sending JSON data
					'Authorization': `Bearer ${accessToken}`, // Include token in header
				},
			});

			if (response.ok) {
				// Logout successful on backend, now clear frontend session
				sessionStorage.removeItem("token");
				sessionStorage.removeItem("refreshToken");
				sessionStorage.removeItem("role");
				navigate("/login"); // Redirect to login page
			} else {
				// Handle logout error from backend (e.g., invalid refresh token, server error)
				console.error('Logout failed on backend:', response.status, response.statusText);
				// Optionally handle error more gracefully, e.g., display an alert to the user
				alert("Logout failed. Please try again.");
				// Still clear session storage locally even if backend logout fails (optional, depends on desired behavior)
				sessionStorage.removeItem("token");
				sessionStorage.removeItem("refreshToken");
				sessionStorage.removeItem("role");
				navigate("/login"); // Redirect to login page anyway, as local logout should still happen
			}

		} catch (error) {
			// Network error during logout request
			console.error('Network error during logout:', error);
			alert("Network error during logout. Please check your connection.");
			// Still clear session storage locally even if backend logout fails (optional, depends on desired behavior)
			sessionStorage.removeItem("token");
			sessionStorage.removeItem("refreshToken");
			sessionStorage.removeItem("role");
			navigate("/login"); // Redirect to login page anyway, as local logout should still happen
		}
	};

	return (
		<button onClick={handleLogout} className="logout-button">
			Logout
		</button>
	);
}

export default LogoutButton;
