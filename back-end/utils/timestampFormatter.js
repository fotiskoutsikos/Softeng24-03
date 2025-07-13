//Purpose: Stores utility functions for cross-cutting concerns like logging, formatting, or parsing data.

// Timestamp Formatter functions 

const currentTimestamp = () => {
  // YYYY-MM-DD hh:mm format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function timestampFormatter(dateStr, timeStr) {
  // YYYYMMDD to MongoDB Date format
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const hours = timeStr.substring(0, 2);
  const mins = timeStr.substring(2, 4);

  return new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1, // Months are 0-indexed
    parseInt(day),
    parseInt(hours),
    parseInt(mins)
  )
  );
}
function formatTimestamp(date) {
  // MongoDb Date format to YYYY-MM-DD HH:mm
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

module.exports = {
  currentTimestamp,
  timestampFormatter,
  formatTimestamp
}
