import axios from "axios";

const BASE_URL = "/";

export async function login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, { username, password });


    if (!response.data.token) {
        throw new Error("Login failed: No token received.");
    }

    sessionStorage.setItem("token", response.data.token);
    sessionStorage.setItem("role", response.data.role);


    return response.data.role;
}

export function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
}
