const fs = require('fs');

function validateEnvEntry(entryName) {
  if (!process.env[entryName]) {
    console.error(`Error: missing "${entryName}" in ".env" file. Please check README.md on how ".env" file must be created.`);
    process.exit(1);
  }
}

function validateEnvFile() {
  if (!fs.existsSync('.env')) {
    console.error('Error: missing ".env" file. Please check README.md on how to create one.');
    process.exit(1);
  }

  require('dotenv').config();

  validateEnvEntry("CLIENT_ID");
  validateEnvEntry("CLIENT_SECRET");
  validateEnvEntry("REGION");
}

module.exports.validateEnvFile = validateEnvFile;
