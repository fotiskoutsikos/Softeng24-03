const { MongoClient } = require('mongodb');
const { mongoUri } = require('../config/dbConfig');
const dbName = 'toll-interop-db';
const passesCollection = 'passes';
const operatorsCollection = "operators";
const { currentTimestamp, timestampFormatter, formatTimestamp } = require('../utils/timestampFormatter');
const { parse } = require('json2csv');

exports.getPassAnalysisData = async (stationOpID, tagOpID, dateFrom, dateTo, format) => {
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

        // Check if  stationOpId and tagOpId are valid
        const stationOp = await db
            .collection(operatorsCollection)
            .findOne({ OpID: stationOpID });

        const tagOp = await db
            .collection(operatorsCollection)
            .findOne({ OpID: tagOpID });

        if (!stationOp) {
            const error = new Error("Invalid  station operator ID");
            error.status = 400;
            throw error;
        }
        if (!tagOp) {
            const error = new Error("Invalid tag operator ID");
            error.status = 400;
            throw error;
        }

        // Query for pass data
        const passData = await collection
            .find({
                tollID: { $regex: `^${stationOpID}` },
                tagHomeID: tagOpID,
                timestamp: {
                    $gte: formattedDateFrom, $lte: formattedDateTo
                },
            })
            .sort({ timestamp: 1 }) // Sort by timestamp ascending
            .toArray();

        // No Content
        if (passData.length === 0) {
            return null;
        }

        const result = {
            stationOpID: stationOpID,
            tagOpID: tagOpID,
            requestTimestamp: currentTimestamp(),
            periodFrom: formatTimestamp(formattedDateFrom),
            periodTo: formatTimestamp(formattedDateTo),
            nPasses: passData.length,
            passList: passData.map((pass, index) => ({
                passIndex: index + 1,
                passID: pass._id,
                stationID: pass.tollID,
                timestamp: formatTimestamp(pass.timestamp),
                tagID: pass.tagRef,
                passCharge: pass.charge,
            }))
        };

        if (format === 'csv') {
            const csvFields = ['stationOpID', 'tagOpID', 'requestTimestamp', 'periodFrom', 'periodTo', 'nPasses', ...['passIndex', 'passID', 'stationID', 'timestamp', 'tagID', 'passCharge']];
            const csvData = result.passList.map(item => ({
                stationOpID: result.stationOpID,
                tagOpID: result.tagOpID,
                requestTimestamp: result.requestTimestamp,
                periodFrom: result.periodFrom,
                periodTo: result.periodTo,
                nPasses: result.nPasses,
                ...item
            }));
            return parse(csvData, { fields: csvFields }); // Convert JSON to CSV
        }
        return result;

    } catch (error) {
        if (error.status === 400) {
            throw error;
        }
        throw new Error("Internal Server Error");
    } finally {
        // Ensure client is closed
        if (client) {
            await client.close();
        }
    }
};
