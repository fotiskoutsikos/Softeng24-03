const { getOperatorFinancialsData } = require('../services/operatorFinancialsService');

exports.getOperatorFinancials = async (req, res, next) => {
    try {
        const { operatorID, date_from, date_to } = req.params;
        const format = req.query.format || 'json';

        // Validate date format
        const dateRegex = /^\d{8}$/;
        if (!dateRegex.test(date_from) || !dateRegex.test(date_to)) {
            return res.status(400).json({ error: "Invalid date format. Use YYYYMMDD." });
        }

        if (date_from > date_to) {
            return res.status(400).json({ error: "Invalid date range. The start date must be before the end date." });
        }

        // Validate format type
        if (format !== 'json' && format !== 'csv') {
            return res.status(400).json({ error: "Invalid format specified. Use 'json' or 'csv'." });
        }

        const result = await getOperatorFinancialsData(operatorID, date_from, date_to, format);

        if (!result || result.length === 0) {
            return res.status(200).json({ message: "No passes for that period", financials: [] });
        }

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            return res.status(200).send(result);
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(result);

    } catch (error) {
        console.error("Error in getOperatorFinancials:", error);
        if (!res.headersSent) {
            if (error.status === 400) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Internal Server Error" });
            }
        }
    }
};
