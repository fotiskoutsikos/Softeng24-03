const { login, refreshToken, logout } = require('../services/authService');

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        console.log(req.body);
        const result = await login(username, password);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Refresh token required' });

        const result = await refreshToken(token);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 403).json({ error: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const result = await logout(token);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
    /*
    console.log("Request Headers:", req.headers); // Log request headers
    console.log("Request Body:", req.body);
    try {
        console.log(req.body);
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Refresh token required' });

        const result = await logout(token);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
    */
};
