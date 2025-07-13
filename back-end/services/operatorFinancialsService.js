const { MongoClient } = require('mongodb');
const { mongoUri } = require('../config/dbConfig');
const dbName = "toll-interop-db";
const passesCollection = "passes";
const operatorsCollection = "operators";
const { parse } = require('json2csv');
const { timestampFormatter, formatTimestamp } = require('../utils/timestampFormatter');

exports.getOperatorFinancialsData = async (operatorID, dateFrom, dateTo, format = 'json') => {
    let client;

    try {
        // Validate Date Format
        const dateRegex = /^\d{8}$/;
        if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
            const error = new Error("Invalid date format. Use YYYYMMDD");
            error.status = 400;
            throw error;
        }

        const formattedDateFrom = timestampFormatter(dateFrom, "0000");
        const formattedDateTo = timestampFormatter(dateTo, "2359");

        console.log("dateFrom:", dateFrom, "formattedDateFrom:", formattedDateFrom);
        console.log("dateTo:", dateTo, "formattedDateTo:", formattedDateTo);

        client = new MongoClient(mongoUri);
        await client.connect();

        const db = client.db(dbName);

        // Validate Operator ID
        const operator = await db.collection(operatorsCollection).findOne({ OpID: operatorID });
        if (!operator) {
            const error = new Error("Invalid operator ID");
            error.status = 400;
            throw error;
        }

        // Fetch all operators
        const allOperators = await db.collection(operatorsCollection).find({}).toArray();

        const financials = [];

        for (const otherOperator of allOperators) {
            if (otherOperator.OpID === operatorID) continue; // Skip self

            let paid = 0;
            let received = 0;

            const paidPassesQuery = {
                tollID: { $regex: `^${operatorID}` },
                tagHomeID: otherOperator.OpID,
                timestamp: { $gte: formattedDateFrom, $lte: formattedDateTo }
            };

            const receivedPassesQuery = {
                tollID: { $regex: `^${otherOperator.OpID}` },
                tagHomeID: operatorID,
                timestamp: { $gte: formattedDateFrom, $lte: formattedDateTo }
            };

            // Paid Passes Calculation
            const paidPasses = await db.collection(passesCollection).find(paidPassesQuery).toArray();
            paid = paidPasses.reduce((sum, pass) => sum + (pass.charge || 0), 0);

            // Received Passes Calculation
            const receivedPasses = await db.collection(passesCollection).find(receivedPassesQuery).toArray();
            received = receivedPasses.reduce((sum, pass) => sum + (pass.charge || 0), 0);

            if (paid > 0 || received > 0) {
                financials.push({
                    otherOpID: otherOperator.OpID,
                    paid: parseFloat(paid.toFixed(2)),
                    received: parseFloat(received.toFixed(2))
                });
            }
        }

        if (financials.length === 0) {
            return []; // No content
        }

        if (format === 'csv') {
            const csvFields = ['otherOpID', 'paid', 'received'];
            const csvData = financials.map(f => ({
                otherOpID: f.otherOpID,
                paid: f.paid,
                received: f.received,
            }));
            return parse(csvData, { fields: csvFields });
        }

        return financials;

    } catch (error) {
        if (error.status === 400) {
            throw error;
        }
        throw new Error("Internal Server Error");
    } finally {
        if (client) {
            await client.close();
        }
    }
};
