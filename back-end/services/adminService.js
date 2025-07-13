const { MongoClient } = require('mongodb');
const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment-timezone');
const { currentTimestamp } = require('../utils/timestampFormatter');
const bcrypt = require('bcrypt');
const { mongoUri } = require('../config/dbConfig');
const { refreshToken } = require('./authService');
const { format } = require('path');

const dbName = 'toll-interop-db';
const collections = {
    passes: 'passes',
    operators: 'operators', // use "operators" everywhere
    tollStations: 'tollstations',
    tags: 'tags',
    users: 'users',
    refreshToken: 'refreshToken'
};

const connectDB = async () => {
    return MongoClient.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
    });
};

module.exports = {
    healthCheck: async () => {
        let client;
        try {
            client = await connectDB();
            const db = client.db(dbName);

            const [n_stations, n_tags, n_passes] = await Promise.all([
                db.collection(collections.tollStations).countDocuments(),
                db.collection(collections.tags).countDocuments(),
                db.collection(collections.passes).countDocuments()
            ]);

            return {
                status: 'OK',
                dbconnection: mongoUri,
                n_stations,
                n_tags,
                n_passes,
                timestamp: currentTimestamp()
            };
        } catch (error) {
            throw new Error(`Health check failed: ${error.message}`);
        } finally {
            if (client) await client.close();
        }
    },

    resetStations: async (filePath) => {
        let client;
        try {
            client = await connectDB();
            const db = client.db(dbName);
            const stations = [];
            // Use a Map keyed on the original field "OpID"
            const operators = new Map(); // Changed to store TollIDs as well
            const requiredStationColumns = [
                'OpID', 'Operator', 'TollID', 'Name', 'PM',
                'Locality', 'Road', 'Lat', 'Long', 'Email',
                'Price1', 'Price2', 'Price3', 'Price4'
            ];
            let headersValidated = false;
            await new Promise((resolve, reject) => {
                const stream = fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('headers', (headers) => {
                        // Check that every expected header exists in the file's headers
                        const cleanHeaders = headers.map(h => h.replace(/^\uFEFF/, '').trim());
                        const missingColumns = requiredStationColumns.filter(col =>
                            !cleanHeaders.includes(col)
                        );

                        if (missingColumns.length > 0) {
                            stream.destroy(); // Stop further processing of the stream.
                            return reject(new Error(`Invalid CSV format. Missing columns: ${missingColumns.join(', ')}`));
                        }
                        headersValidated = true;
                    })
                    .on('data', (row) => {
                        // Trim values and parse numerical fields

                        const trimmedRow = Object.fromEntries(
                            Object.entries(row).map(([key, value]) => {
                                // Remove BOM if present from the key
                                const cleanKey = key.replace(/^\uFEFF/, '');
                                return [cleanKey, (typeof value === 'string') ? value.trim() : value];
                            })
                        );

                        // Check required fields
                        const requiredFields = [
                            'OpID', 'Operator', 'TollID', 'Lat', 'Long',
                            'Price1', 'Price2', 'Price3', 'Price4'
                        ];
                        const missingFields = requiredFields.filter(field => !trimmedRow[field]);
                        if (missingFields.length > 0) {
                            throw new Error(
                                `Missing required fields in row: ${missingFields.join(', ')}`
                            );
                        }
                        const numericFields = ['Lat', 'Long', 'Price1', 'Price2', 'Price3', 'Price4'];
                        for (const field of numericFields) {
                            if (isNaN(parseFloat(row[field]))) {
                                throw new Error(`Invalid numeric value in ${field}: ${row[field]}`);
                            }
                        }

                        const opID = trimmedRow.OpID;
                        const operatorName = trimmedRow.Operator || '';
                        const tollID = trimmedRow.TollID || ''; // Get TollID for operator mapping
                        const name = trimmedRow.Name || '';
                        const pm = trimmedRow.PM || '';
                        const locality = trimmedRow.Locality || '';
                        const road = trimmedRow.Road || '';
                        const lat = parseFloat(trimmedRow.Lat);
                        const long = parseFloat(trimmedRow.Long);
                        const email = trimmedRow.Email || '';
                        const price1 = parseFloat(trimmedRow.Price1);
                        const price2 = parseFloat(trimmedRow.Price2);
                        const price3 = parseFloat(trimmedRow.Price3);
                        const price4 = parseFloat(trimmedRow.Price4);

                        // Store the station with the original "OpID" field
                        stations.push({
                            OpID: opID, // use original field name
                            Operator: operatorName,
                            tollID,
                            Name: name,
                            PM: pm,
                            Locality: locality,
                            Road: road,
                            Lat: lat,
                            Long: long,
                            Email: email,
                            Prices: {
                                Price1: price1,
                                Price2: price2,
                                Price3: price3,
                                Price4: price4
                            }
                        });

                        // Update the operator in the operators map (using "OpID" as key) to include TollIDs
                        if (operators.has(opID)) {
                            // Operator exists, add TollID to the list if it's not already there
                            const operator = operators.get(opID);
                            if (!operator.TollIDs.includes(tollID)) { // Prevent duplicate TollIDs
                                operator.TollIDs.push(tollID);
                            }
                        } else {
                            // Operator doesn't exist, create new entry with TollIDs list
                            operators.set(opID, {
                                OpID: opID,
                                Operator: operatorName,
                                Email: email,
                                TollIDs: [tollID] // Initialize TollIDs with an array containing the TollID
                            });
                        }
                    })
                    .on('end', async () => {
                        try {
                            // Reset toll stations collection
                            await db.collection(collections.tollStations).deleteMany({});
                            if (stations.length > 0) {
                                await db.collection(collections.tollStations).insertMany(stations);
                            }

                            // Reset operators collection
                            await db.collection(collections.operators).deleteMany({});
                            if (operators.size > 0) {
                                // Insert operators from the map, values() returns the operator objects with TollIDs
                                await db.collection(collections.operators).insertMany(Array.from(operators.values()));
                            }
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('error', reject);
            });
        } catch (error) {
            throw new Error(`Reset stations failed: ${error.message}`);
        } finally {
            if (client) await client.close();
        }
    },

    resetPasses: async () => {
        let client;
        try {
            client = await connectDB();
            const db = client.db(dbName);

            await Promise.all([
                db.collection(collections.passes).deleteMany({}),
                db.collection(collections.tags).deleteMany({}),
                db.collection(collections.users).deleteMany({}),
                db.collection(collections.refreshToken).deleteMany({})
            ]);

            // Reset admin account credentials (if authentication is implemented)
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash("freepasses4all", saltRounds);
            await db.collection(collections.users).insertOne(
                { username: 'admin', password: hashedPassword, role: 'admin' }
            );
        } catch (error) {
            throw new Error(`Reset passes failed: ${error.message}`);
        } finally {
            if (client) await client.close();
        }
    },

    addPasses: async (filePath) => {
        let client;
        try {
            client = await connectDB();
            const db = client.db(dbName);
            const bulkPassOps = [];
            const bulkTagOps = [];
            const seenTags = new Set();
            const seenPasses = new Set();

            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv({
                        headers: ['timestamp', 'tollID', 'tagRef', 'tagHomeID', 'charge'],
                        skipLines: 1,
                    }))
                    .on('data', (row) => {
                        try {
                            // Create a unique key for the pass event to avoid duplicates
                            const passKey = `${row.timestamp}-${row.tollID}-${row.tagRef}-${row.tagHomeID}-${row.charge}`;
                            if (seenPasses.has(passKey)) {
                                // Duplicate detected in the CSV file; skip insertion.
                                return;
                            }
                            seenPasses.add(passKey);

                            // Parse timestamp and validate charge
                            const m = moment(row.timestamp, 'YYYY-MM-DD HH:mm', 'EET', true);
                            if (!m.isValid()) {
                                throw new Error(`Invalid timestamp format: ${row.timestamp}`);
                            }

                            timestamp = m.utc().toDate();
                            const tollID = row.tollID;
                            const tagRef = row.tagRef;
                            const tagHomeID = row.tagHomeID;
                            const charge = parseFloat(row.charge);
                            if (isNaN(charge)) {
                                throw new Error(`Invalid charge value: ${row.charge}`);
                            }

                            bulkPassOps.push({
                                updateOne: {
                                    filter: {
                                        timestamp: timestamp,
                                        tollID: tollID,
                                        tagRef: tagRef,
                                        tagHomeID: tagHomeID,
                                        charge: charge
                                    },
                                    update: {
                                        $setOnInsert: {
                                            timestamp: timestamp,
                                            tollID: tollID,
                                            tagRef: tagRef,
                                            tagHomeID: tagHomeID,
                                            charge: charge
                                        }
                                    },
                                    upsert: true
                                }
                            });

                            // Process tags (avoiding duplicates)
                            const tagKey = `${tagRef}-${tagHomeID}`;
                            if (!seenTags.has(tagKey)) {
                                seenTags.add(tagKey);
                                bulkTagOps.push({
                                    updateOne: {
                                        filter: { tagRef },
                                        update: { $setOnInsert: { tagHomeID } },
                                        upsert: true
                                    }
                                });
                            }
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('end', async () => {
                        try {
                            if (bulkPassOps.length > 0) {
                                await db.collection(collections.passes).bulkWrite(bulkPassOps);
                            }
                            if (bulkTagOps.length > 0) {
                                await db.collection(collections.tags).bulkWrite(bulkTagOps);
                            }
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('error', reject);
            });
        } catch (error) {
            throw new Error(`Add passes failed: ${error.message}`);
        } finally {
            if (client) await client.close();
        }
    },

    modifyUser: async (username, newPassword, role = "operator") => {
        let client;
        try {
            client = await connectDB();
            const db = client.db(dbName);
            const users = db.collection(collections.users);

            // Check if the user already exists
            const existingUser = await users.findOne({ username });

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            if (existingUser) {
                //  User exists → Update password & optionally role
                const updateFields = { password: hashedPassword };

                // Only update role if provided
                if (role === 'minister' || role === 'operator') {
                    updateFields.role = role;
                } else {
                    throw new Error(`Invalid role: ${role}`);
                }

                await users.updateOne({ username }, { $set: updateFields });

                return { status: 'OK', message: `User ${username} updated successfully` };
            } else {
                //  User doesn't exist → Create new user
                if (role === 'minister' || role === 'operator') {
                    await users.insertOne({ username, password: hashedPassword, role });
                }
                else {
                    throw new Error(`Invalid role: ${role}`);
                }

                return { status: 'OK', message: `User ${username} created successfully` };
            }
        } catch (error) {
            throw new Error(`User modification failed: ${error.message}`);
        } finally {
            if (client) await client.close();
        }
    },

    getUsers: async () => {
        let client;
        try {
            client = await connectDB();
            const db = client.db(dbName);
            const users = await db.collection(collections.users).find({}, { projection: { password: 0 } }).toArray();
            return { status: 'OK', users };
        } catch (error) {
            throw new Error(`Fetching users failed: ${error.message}`);
        } finally {
            if (client) await client.close();
        }
    },

    deleteUser: async (username) => {
        let client;
        try {
            client = await connectDB();

            const db = client.db(dbName);
            const users = await db.collection(collections.users);

            const user = await users.findOne({ username: `${username}` });
            if (!user) {
                return { status: 'failed', message: `User '${username}' not found` };
            }

            if (user.role === 'admin') {
                return { status: 'failed', message: "Cannot delete an admin user." };
            }

            const result = await users.deleteOne({ username });

            if (result.deletedCount === 0) {
                return { status: 'failed', message: `User '${username}' could not be deleted` };
            }

            return { status: 'OK', message: `User '${username}' deleted successfully` };
        } catch (error) {
            throw new Error(`User deletion failed: ${error.message}`);
        } finally {
            if (client) await client.close();
        }
    },
    // ✅✅✅ Updated getOperators to include TollIDs ✅✅✅
    getOperators: async (operatorCredentials) => { // Added operatorCredentials parameter
        let client;
        try {
            client = await connectDB();
            const db = client.db(dbName);
            let query = {};
            let projection = { _id: 0, OpID: 1, Operator: 1, Email: 1, TollIDs: 1 }; // Default projection

            if (operatorCredentials) {
                query = {
                    $or: [
                        { Operator: { $regex: new RegExp(`^${operatorCredentials}`, 'i') } }, // Case-insensitive search on Operator
                        { Email: { $regex: new RegExp(`^${operatorCredentials}`, 'i') } }    // Case-insensitive search on Email
                    ]
                };
                projection = { _id: 0, OpID: 1 }; // Projection to return only OpID
            }

            // Fetch operators with conditional projection and query
            const operators = await db.collection(collections.operators)
                .find(query)
                .project(projection)
                .toArray();

            return { status: 'OK', operators };
        } catch (error) {
            throw new Error(`Fetching operators failed: ${error.message}`);
        } finally {
            if (client) await client.close();
        }
    },


};
