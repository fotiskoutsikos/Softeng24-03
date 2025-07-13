const { getTollStatsData } = require('../services/tollStatsService');

exports.getTollStats = async (req, res, next) => {
    try {
        const { operator, periodType, year, periodValue } = req.params;

        // Validate year format (YYYY)
        const yearRegex = /^\d{4}$/;
        if (!yearRegex.test(year)) {
            return res
                .status(400)
                .json({ error: "Invalid year format. Use YYYY." });
        }

        // Validate periodType
        const allowedPeriodTypes = ['yearly', 'monthly', 'quarterly'];
        if (!allowedPeriodTypes.includes(periodType)) {
            return res
                .status(400)
                .json({ error: "Invalid period type. Use 'yearly', 'monthly', or 'quarterly'." });
        }

        // Validate periodValue for monthly and quarterly
        if ((periodType === 'monthly' || periodType === 'quarterly') && !periodValue) {
            return res.status(400).json({ error: `Period value (month or quarter) is required for '${periodType}' period type.` });
        } else if (periodType === 'monthly') {
            const month = parseInt(periodValue, 10);
            if (isNaN(month) || month < 1 || month > 12) {
                return res.status(400).json({ error: "Invalid month value. Use a number between 1 and 12." });
            }
        } else if (periodType === 'quarterly') {
            const quarter = parseInt(periodValue, 10);
            if (isNaN(quarter) || quarter < 1 || quarter > 4) {
                return res.status(400).json({ error: "Invalid quarter value. Use a number between 1 and 4." });
            }
        }

        // Fetch the toll stats data
        const result = await getTollStatsData(operator, periodType, year, periodValue);

        if (!result) {
            return res.status(204).send(); // No content if no data found
        }

        res.status(200).json(result);

    } catch (error) {
        if (!res.headersSent) {
            if (error.status === 400) {
                res.status(400).json({ error: error.message });
            } else {
                console.error("Error in getTollStats:", error); // Log full error for debugging
                res.status(500).json({ error: "Internal Server Error" });
            }
        }
    }
};