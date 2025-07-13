const adminService = require('../services/adminService');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { parse } = require('json2csv');


module.exports = {
    healthCheck: async (req, res) => {
        try {
            const result = await adminService.healthCheck();
            res.status(200).json(result);
        } catch (error) {
            if (!res.headersSent) {
                if (error.status === 400) {
                    res.status(400).json({ error: error.message });
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            }
        }
    },

    resetStations: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "Missing CSV file",
                    status: 'failed'
                });
            }
            await adminService.resetStations(req.file.path);
            res.status(200).json({ status: 'OK' });
        } catch (error) {
            if (!res.headersSent) {
                if (error.status === 400) {
                    res.status(400).json({ error: error.message });
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            }
        }
    },

    resetPasses: async (req, res) => {
        try {
            await adminService.resetPasses();
            res.status(200).json({ status: 'OK' });
        } catch (error) {
            if (!res.headersSent) {
                if (error.status === 400) {
                    res.status(400).json({ error: error.message });
                } else {
                    res.status(500).json({ error: error.message || "Internal Server Error" });
                }
            }
        }
    },

    addPasses: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "Missing CSV file",
                    status: 'failed'
                });
            }
            await adminService.addPasses(req.file.path);
            res.status(200).json({ status: 'OK' });
        } catch (error) {
            if (!res.headersSent) {
                if (error.status === 400) {
                    res.status(400).json({ error: error.message });
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            }
        }
    },

    modifyUser: async (req, res) => {
        try {
            const { username, password, role } = req.params;
            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }

            // Default role to "operator" if not provided
            const result = await adminService.modifyUser(username, password, role || 'operator');
            res.status(200).json(result);
        } catch (error) {
            if (!res.headersSent) {
                if (error.status === 400) {
                    res.status(400).json({ error: error.message });
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            }
        }
    },

    getUsers: async (req, res) => {
        try {
            const format = req.query.format || 'json'; // Query parameter to define response format
            if (format !== 'json' && format !== 'csv') {
                return res.status(400).json({ error: "Invalid format specified. Use 'json' or 'csv'." });
            }
            const result = await adminService.getUsers();
            // Respond with the appropriate format
            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                const csv = parse(result.users, { fields: ['username', 'role'] });
                return res.status(200).send(csv);
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json(result);
        } catch (error) {
            if (!res.headersSent) {
                if (error.status === 400) {
                    res.status(400).json({ error: error.message });
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            }
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { username } = req.params;

            if (!username) {
                return res.status(400).json({ error: "Username is required" });
            }

            const result = await adminService.deleteUser(username);
            res.status(200).json(result);
        } catch (error) {
            if (!res.headersSent) {
                if (error.status === 400) {
                    res.status(400).json({ error: error.message });
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            }
        }
    },

    getOperators: async (req, res) => {
        try {
            const operatorCredentials = req.query.operatorcredentials; // Get optional query parameter
            const result = await adminService.getOperators(operatorCredentials); // Pass parameter to service
            res.status(200).json(result);
        } catch (error) {
            console.error("Error in adminController.getOperators:", error); // Log error for debugging
            if (!res.headersSent) {
                res.status(500).json({ error: "Failed to load operators", message: error.message }); // Send error response
            }
        }
    },

    // Middleware for handling file uploads
    upload: upload.single('file')
};
