const { MongoClient } = require("mongodb");
const { mongoUri } = require('../config/dbConfig');
const dbName = "toll-interop-db";
const passesCollection = "passes";
const operatorsCollection = "operators";
const tollStationsCollection = "tollstations";
const { currentTimestamp, timestampFormatter } = require('../utils/timestampFormatter');
const { parse } = require('json2csv');
const moment = require('moment-timezone');

const formatTimestampEET = (date) => { // New function to format to EET
  return moment.utc(date).tz('EET').format('YYYY-MM-DD HH:mm'); // Convert UTC to EET and format
};

// Fetch passes from the database
exports.getTollStationPasses = async (tollStationID, dateFrom, dateTo, format = 'json') => {
  let client;

  try {

    const dateRegex = /^\d{8}$/;
    if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
      const error = new Error("Invalid date format. Use YYYYMMDD");
      error.status = 400;
      throw error;
    }

    // Convert dateFrom and dateTo to YYYY-MM-DD HH:MM format
    const formattedDateFromEET = timestampFormatter(dateFrom, "0000");
    const formattedDateToEET = timestampFormatter(dateTo, "2359");

    const startDateUTC = moment.utc(formattedDateFromEET).subtract(2, 'hours').toDate(); // Subtract 2 hours from start UTC date
    const endDateUTC = moment.utc(formattedDateToEET).subtract(2, 'hours').toDate();

    // Connect to MongoDB
    client = new MongoClient(mongoUri);
    await client.connect();

    // Get the collection
    const db = client.db(dbName);
    const collection = db.collection(passesCollection);

    // Check if tollStationID is valid
    const tollStation = await db.collection(tollStationsCollection)
      .findOne({ tollID: tollStationID.trim() });
    if (!tollStation) {
      const error = new Error("Invalid toll station ID");
      error.status = 400;
      throw error;
    }

    const operator = await db.collection(operatorsCollection)
      .findOne({ OpID: tollStation.OpID });

    const operatorName = operator.OpID;

    // Query for passes in the date range for the specified toll station
    const passes = await collection
      .find({
        tollID: tollStationID.trim(),
        timestamp: {
          $gte: startDateUTC, $lte: endDateUTC
        },
      })
      .sort({ timestamp: 1 }) // Sort by timestamp ascending
      .toArray();


    // No Content
    if (passes.length === 0) {
      return null;
    }

    // Construct the result
    const result = {
      stationID: tollStationID,
      stationOperator: operatorName,
      requestTimestamp: currentTimestamp(),
      periodFrom: formatTimestampEET(startDateUTC),
      periodTo: formatTimestampEET(endDateUTC),
      nPasses: passes.length,
      passList: passes.map((pass, index) => ({
        passIndex: index + 1,
        passID: pass._id,
        timestamp: formatTimestampEET(pass.timestamp),
        tagID: pass.tagRef,
        tagProvider: pass.tagHomeID,
        passType: pass.tagHomeID === operatorName ? "home" : "away",
        passCharge: pass.charge,
      })),
    };

    // Convert to the requested format
    if (format === 'csv') {
      const csvFields = ['stationID', 'stationOperator', 'requestTimestamp', 'periodFrom', 'periodTo', 'nPasses', ...['passIndex', 'passID', 'timestamp', 'tagID', 'passCharge']];
      const csvData = result.passList.map(item => ({
        stationID: result.stationID,
        stationOperator: result.stationOperator,
        requestTimestamp: result.requestTimestamp,
        periodFrom: result.periodFrom,
        periodTo: result.periodTo,
        nPasses: passes.length,
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
