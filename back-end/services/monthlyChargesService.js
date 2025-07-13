const { MongoClient } = require("mongodb");
const { mongoUri } = require("../config/dbConfig");
const dbName = "toll-interop-db";
const passesCollection = "passes";
const operatorsCollection = "operators";
const { parse } = require("json2csv");

exports.getMonthlyCharges = async (operatorID, format = "json") => {
    let client;

    try {
        client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db(dbName);

        // Validate Operator ID
        const operator = await db.collection(operatorsCollection).findOne({ OpID: operatorID });
        if (!operator) {
            throw { status: 400, message: "Invalid operator ID" };
        }

        // Aggregate financial data
        const aggregationPipeline = [
            {
                $match: {
                    $or: [
                        { tollID: { $regex: `^${operatorID}` } },
                        { tagHomeID: operatorID }
                    ]
                }
            },
            {
                $project: {
                    adjustedTimestamp: {
                        $dateAdd: {
                            startDate: { $toDate: "$timestamp" },
                            unit: "hour",
                            amount: 2
                        }
                    },
                    tollID: 1,
                    tagHomeID: 1,
                    passCharge: "$charge"
                }
            },
            {
                $project: {
                    year: { $toInt: { $dateToString: { format: "%Y", date: "$adjustedTimestamp" } } },
                    month: { $toInt: { $dateToString: { format: "%m", date: "$adjustedTimestamp" } } },
                    tollID: 1,
                    tagHomeID: 1,
                    passCharge: 1
                }
            },
            {
                $group: {
                    _id: {
                        year: "$year",
                        month: "$month",
                        otherOpID: {
                            $cond: [
                                { $regexMatch: { input: "$tollID", regex: `^${operatorID}` } },
                                "$tagHomeID",
                                { $substr: ["$tollID", 0, 2] }
                            ]
                        }
                    },
                    paid: {
                        $sum: {
                            $cond: [
                                { $regexMatch: { input: "$tollID", regex: `^${operatorID}` } },
                                "$passCharge",
                                0
                            ]
                        }
                    },
                    received: {
                        $sum: {
                            $cond: [
                                { $regexMatch: { input: "$tagHomeID", regex: `^${operatorID}` } },
                                "$passCharge",
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    year: "$_id.year",
                    month: "$_id.month",
                    otherOpID: "$_id.otherOpID",
                    paid: { $round: ["$paid", 2] },
                    received: { $round: ["$received", 2] },
                    _id: 0
                }
            },
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    transactions: {
                        $push: { otherOpID: "$otherOpID", paid: "$paid", received: "$received" }
                    }
                }
            },
            {
                $project: {
                    year: "$_id.year",
                    month: "$_id.month",
                    transactions: 1,
                    _id: 0
                }
            },
            { $sort: { year: -1, month: -1 } }
        ];

        const financials = await db.collection(passesCollection).aggregate(aggregationPipeline).toArray();

        if (financials.length === 0) {
            return [];
        }

        if (format === "csv") {
            const csvFields = ["year", "month", "otherOpID", "paid", "received"];
            const csvData = [];
            financials.forEach((record) => {
                record.transactions.forEach((t) => {
                    csvData.push({
                        year: record.year,
                        month: record.month,
                        otherOpID: t.otherOpID,
                        paid: t.paid,
                        received: t.received
                    });
                });
            });
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
