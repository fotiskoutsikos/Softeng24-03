const app = require('./app');
const ensureAdminUser = require('./initAdmin');
require('dotenv').config();

const PORT = process.env.PORT || 9115;
ensureAdminUser().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to ensure admin user:", error);
});

/*
app.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}/api`);
});
*/
