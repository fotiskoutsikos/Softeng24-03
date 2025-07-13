#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data'); // For file uploads
const readline = require('readline');
const { program } = require('commander');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '/.token');
//console.log(TOKEN_PATH);

const saveToken = (token) => {
  if (typeof token !== 'string' || !token) {
    console.error("Error: Cannot save token because the token value is undefined or empty.");
    process.exit(1);
  }
  fs.writeFileSync(TOKEN_PATH, token, 'utf8');
};

const loadToken = () => fs.existsSync(TOKEN_PATH) ? fs.readFileSync(TOKEN_PATH, 'utf8') : null;
const clearToken = () => fs.existsSync(TOKEN_PATH) && fs.unlinkSync(TOKEN_PATH);

// Base URL of the API
const BASE_URL = 'http://localhost:9115/api';

// Helper function for HTTP requests using fetch
async function makeRequest(method, endpoint, data = {}, format = 'json') {
  try {
    const token = loadToken();
    if (!token) {
      console.error("Error: You must log in first (`node cli.js login`)");
      return;
    }
    if (!endpoint.includes('format=')) {
      endpoint += (endpoint.includes('?') ? '&' : '?') + `format=${format}`;
    }

    let options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    if (data instanceof FormData) {
      // Set the body to the FormData instance.
      options.body = data;
      // Get FormData headers (this includes the correct Content-Type with boundary)
      const formHeaders = data.getHeaders();
      // Instead of setting Content-Length manually, merge the FormData headers.
      options.headers = { ...options.headers, ...formHeaders };

      // Optional: If you really need the content-length, you can try to compute it.
      // But if it fails, you may omit it.
      /*
      try {
        const getLength = () =>
          new Promise((resolve, reject) => {
            data.getLength((err, length) => {
              if (err) reject(err);
              else resolve(length);
            });
          });
        const length = await getLength();
        options.headers['Content-Length'] = length;
      } catch (err) {
        console.warn("Could not compute Content-Length, proceeding without it.");
      }
      */
    } else {
      // For JSON requests:
      options.headers['Content-Type'] = 'application/json';
      options.body =
        (method.toLowerCase() !== 'get' && data && Object.keys(data).length > 0)
          ? JSON.stringify(data)
          : undefined;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const contentType = response.headers.get("Content-Type");
    const rawText = await response.text();

    if (contentType.includes("text/csv")) {
      console.log(rawText);
    } else if (contentType.includes("application/json")) {
      let result;
      try {
        result = JSON.parse(rawText);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.error("Error parsing JSON:", e.message);
        process.exit(1);
      }
    } else {
      console.error("Unexpected response format:", contentType);
      console.log(rawText);
    }
  } catch (error) {
    if (error.response) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Request Failed:', error.message);
    }
    process.exit(1);
  }
}

// Helper function for confirmation
async function confirmAction(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// Helper function to resolve file paths
function resolveFilePath(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found at path: ${resolvedPath}`);
  }
  return resolvedPath;
}

// Helper function for file uploads
async function handleFileUpload(endpoint, filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }
    const stats = fs.statSync(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${absolutePath}`);
    }

    // Create a FormData instance using the 'form-data' package.
    const form = new FormData();
    form.append('file', fs.createReadStream(absolutePath), {
      filename: path.basename(absolutePath),
      contentType: 'text/csv'
    });

    const token = loadToken();
    if (!token) {
      throw new Error("You must log in first (`node cli.js login`)");
    }

    // Use Axios for the POST request.
    const response = await axios.post(`${BASE_URL}${endpoint}`, form, {
      headers: {
        ...form.getHeaders(), // this sets the proper Content-Type with boundary
        'Authorization': `Bearer ${token}`
      },
      // These options allow large files to be uploaded without Axios complaining.
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('File upload failed:');
    console.error(`- Path attempted: ${filePath}`);
    console.error(`- Absolute path: ${path.resolve(filePath)}`);
    console.error(`- Error details: ${error.message}`);
    throw error;
  }
}

program
  .version('1.0.0')
  .name('se3403');

// Top-Level Command: login
program
  .command('login')
  .description('Login as a user')
  .requiredOption('--username <username>', 'Username')
  .requiredOption('--passw <passw>', 'Password')
  .action(async (options) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: options.username, password: options.passw })
      });

      const result = await response.json();
      console.log("Login response:", result);

      if (response.ok) {
        if (!result.token) {
          console.error("Error: login success but no accessToken.");
          process.exit(1);
        }
        saveToken(result.token);  // Save token locally
        console.log(`Logged in as ${options.username}`);
      } else {
        console.error(`Login failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Login request failed:", error.message);
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Logout the current user')
  .action(() => {
    clearToken();
    console.log("Logged out successfully.");
  });

// ------------------------
// ADMIN COMMANDS SCOPE
// ------------------------
const admin = program.command('admin').description('Admin commands');

// Admin: healthcheck

program
  .command('healthcheck')
  .description('Check the health of the API')
  .action(async () => {
    await makeRequest('get', '/admin/healthcheck');
  });

// Admin: resetstations
program
  .command('resetstations')
  .description('Reset toll station data with a CSV file')
  .requiredOption('--file <file>', 'Path to the CSV file with station data')
  .option('--dry-run', 'Preview the action without executing it')
  .action(async (options) => {
    if (options.dryRun) {
      console.log(`This will reset toll station data using file: ${resolveFilePath(options.file)}. No changes will be made.`);
      process.exit(0);
    }

    const confirmed = await confirmAction('Are you sure you want to reset all toll station data?');
    if (!confirmed) {
      console.log('Action cancelled.');
      process.exit(0);
    }

    try {
      await handleFileUpload('/admin/resetstations', options.file);
    } catch (error) {
      console.error('Failed to reset stations:', error.message);
      process.exit(1);
    }
  });

// Admin: resetpasses
program
  .command('resetpasses')
  .description('Reset all pass data')
  .option('--dry-run', 'Preview the action without executing it')
  .action(async (options) => {
    if (options.dryRun) {
      console.log('This will reset all pass data. No changes will be made.');
      process.exit(0);
    }

    const confirmed = await confirmAction('Are you sure you want to reset all pass data?');
    if (!confirmed) {
      console.log('Action cancelled.');
      process.exit(0);
    }

    await makeRequest('post', '/admin/resetpasses');
  });

// Admin: addpasses
admin
  .command('addpasses')
  .description('Add pass data from a CSV file')
  .requiredOption('--file <file>', 'Path to the CSV file with pass data')
  .action(async (options) => {
    try {
      await handleFileUpload('/admin/addpasses', options.file);
    } catch (error) {
      console.error('Failed to add passes:', error.message);
      process.exit(1);
    }
  });

// Admin: usermod (Modify or Create User)
admin
  .command('usermod')
  .description('Modify a user password or create a new user if not found')
  .requiredOption('--username <username>', 'Username of the user')
  .requiredOption('--passw <passw>', 'New password for the user')
  .option('--role <role>', 'User role (operator or minister, default: operator)', 'operator')
  .action(async (options) => {
    const endpoint = `/admin/usermod/${options.username}/${options.passw}/${options.role}`;
    await makeRequest('post', endpoint);
  });

// Admin: users (List all users)
admin
  .command('users')
  .description('List all users in the system')
  .option('--format <format>', 'Output format (csv/json)', 'csv')
  .action(async (options) => {
    const endpoint = '/admin/users';
    const params = `?format=${options.format}`;
    await makeRequest('get', endpoint + params);
  });

// Admin: userdel (Delete a user)
admin
  .command('userdel')
  .description('Delete a user (Admins cannot be deleted)')
  .requiredOption('--username <username>', 'Username of the user to delete')
  .action(async (options) => {
    const confirmed = await confirmAction(`Are you sure you want to delete user '${options.username}'?`);
    if (!confirmed) {
      console.log('Action cancelled.');
      process.exit(0);
    }

    const endpoint = `/admin/userdel/${options.username}`;
    await makeRequest('delete', endpoint);
  });



// ------------------------
// OTHER (Non-admin) COMMANDS
// ------------------------

// Get toll station passes
program
  .command('tollstationpasses')
  .description('Get passes data for a specific toll station and date range')
  .requiredOption('--station <station>', 'Toll Station ID')
  .requiredOption('--from <from>', 'Start date (YYYYMMDD)')
  .requiredOption('--to <to>', 'End date (YYYYMMDD)')
  .option('--format <format>', 'Output format (csv/json)', 'csv')
  .action(async (options) => {
    const endpoint = `/tollStationPasses/${options.station}/${options.from}/${options.to}`;
    const params = `?format=${options.format}`;
    await makeRequest('get', endpoint + params, {}, options.format);
  });

// Pass analysis
program
  .command('passanalysis')
  .description('Analyze passes between operators')
  .requiredOption('--stationop <stationop>', 'Station Operator ID')
  .requiredOption('--tagop <tagop>', 'Tag Operator ID')
  .requiredOption('--from <from>', 'Start date (YYYYMMDD)')
  .requiredOption('--to <to>', 'End date (YYYYMMDD)')
  .option('--format <format>', 'Output format (csv/json)', 'csv')
  .action(async (options) => {
    const endpoint = `/passAnalysis/${options.stationop}/${options.tagop}/${options.from}/${options.to}`;
    const params = `?format=${options.format}`;
    await makeRequest('get', endpoint + params, {}, options.format);
  });

// Passes cost
program
  .command('passescost')
  .description('Calculate the cost of passes for a specific operator and date range')
  .requiredOption('--stationop <stationop>', 'Toll Operator ID')
  .requiredOption('--tagop <tagop>', 'Tag Operator ID')
  .requiredOption('--from <from>', 'Start date (YYYYMMDD)')
  .requiredOption('--to <to>', 'End date (YYYYMMDD)')
  .option('--format <format>', 'Output format (csv/json)', 'csv')
  .action(async (options) => {
    const endpoint = `/passesCost/${options.stationop}/${options.tagop}/${options.from}/${options.to}`;
    const params = `?format=${options.format}`;
    await makeRequest('get', endpoint + params, {}, options.format);
  });

// Charges by operator
program
  .command('chargesby')
  .description('Get charges by a specific operator for a date range')
  .requiredOption('--opid <opid>', 'Toll Operator ID')
  .requiredOption('--from <from>', 'Start date (YYYYMMDD)')
  .requiredOption('--to <to>', 'End date (YYYYMMDD)')
  .option('--format <format>', 'Output format (csv/json)', 'csv')
  .action(async (options) => {
    const endpoint = `/chargesBy/${options.opid}/${options.from}/${options.to}`;
    const params = `?format=${options.format}`;
    await makeRequest('get', endpoint + params, {}, options.format);
  });

program.parse(process.argv);
