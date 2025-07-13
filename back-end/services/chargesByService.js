const { MongoClient } = require('mongodb');
const { mongoUri } = require('../config/dbConfig');
const dbName = 'toll-interop-db';
const passesCollection = 'passes';
const operatorsCollection = 'operators';
const { currentTimestamp, timestampFormatter, formatTimestamp } = require('../utils/timestampFormatter');
const { parse } = require('json2csv');



exports.getChargesByData = async (tollOpID, dateFrom, dateTo, format) => {
    let client;

    try {

        // Convert dateFrom and dateTo to YYYY-MM-DD HH:MM format
        const formattedDateFrom = timestampFormatter(dateFrom, "0000");
        const formattedDateTo = timestampFormatter(dateTo, "2359");
        // Connect to MongoDB
        client = new MongoClient(mongoUri);
        await client.connect();

        const db = client.db(dbName);
        const collection = db.collection(passesCollection);

        // Check if  tollnOpId and tagOpId are valid
        const tollOp = await db.collection(operatorsCollection)
            .findOne({ OpID: tollOpID });

        if (!tollOp) {
            const error = new Error("Invalid toll operator ID");
            error.status = 400;
            throw error;
        }

        // Query for passes data by tollOpID and date range
        const passData = await collection
            .aggregate([
                {
                    $match: {
                        tollID: { $regex: `^${tollOpID}` },
                        timestamp: {
                            $gte: formattedDateFrom, $lte: formattedDateTo
                        }
                    }
                },
                {
                    $group: {
                        _id: "$tagHomeID", // Group by visiting operator
                        nPasses: { $sum: 1 }, // Count total passes
                        passesCost: { $sum: "$charge" } // Sum total charges
                    }
                },
                { $sort: { _id: 1 } } // Sort by visiting operator
            ])
            .toArray();

        if (passData.length === 0) {
            return null;
        }

        // TODO: Ask if we need to return the result of the same Operator

        const result = {
            tollOpID: tollOpID,
            requestTimestamp: currentTimestamp(),
            periodFrom: formatTimestamp(formattedDateFrom),
            periodTo: formatTimestamp(formattedDateTo),
            vOpList: passData.map(op => ({
                visitingOpID: op._id,
                nPasses: op.nPasses,
                passesCost: parseFloat(op.passesCost.toFixed(2))
            }))
        };


        if (format === 'csv') {
            const csvFields = ['tollOpID', 'requestTimestamp', 'periodFrom', 'periodTo', ...['visitingOpID', 'nPasses', 'passesCost']];
            const csvData = result.vOpList.map(op => ({
                tollOpID: result.tollOpID,
                requestTimestamp: result.requestTimestamp,
                periodFrom: result.periodFrom,
                periodTo: result.periodTo,
                ...op
            }));
            return parse(csvData, { fields: csvFields });
        }

        return result;
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
