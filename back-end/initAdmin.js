const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const { mongoUri } = require('./config/dbConfig');

const dbName = 'toll-interop-db';
const usersCollection = 'users';

async function ensureAdminUser() {
    const client = new MongoClient(mongoUri, { useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db(dbName);

        // Check if admin user exists
        const adminUser = await db.collection(usersCollection).findOne({ username: 'admin' });
        if (!adminUser) {
            console.log("Admin user not found. Creating admin user...");
            const password = 'freepasses4all';
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            await db.collection(usersCollection).insertOne({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            console.log("Admin user created successfully.");
        } else {
            console.log("Admin user already exists.");
        }
    } catch (error) {
        console.error("Error ensuring admin user:", error);
    } finally {
        await client.close();
    }
}

module.exports = ensureAdminUser;
