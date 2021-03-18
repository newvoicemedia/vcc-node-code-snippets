const fs = require("fs");
const moment = require("moment");

function setupDownloadFolder() {
  require("dotenv").config();
  const downloadFolder = process.env.DOWNLOAD_FOLDER || "download";
  if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder, { recursive: true });
  }
  console.log(`Downloading files to '${downloadFolder}'`);
  return downloadFolder;
}

function validateEnvEntry(entryName) {
  if (!process.env[entryName]) {
    console.error(
      `Error: missing "${entryName}" in ".env" file. Please check README.md on how ".env" file must be created.`
    );
    process.exit(1);
  }
}

function validateEnvFile() {
  if (!fs.existsSync(".env")) {
    console.error(
      'Error: missing ".env" file. Please check README.md on how to create one.'
    );
    process.exit(1);
  }

  require("dotenv").config();

  validateEnvEntry("CLIENT_ID");
  validateEnvEntry("CLIENT_SECRET");
  validateEnvEntry("REGION");
}

function getValidDates(args_start, args_end) {
  let start = moment().utc().subtract(1, "day").startOf("day").toISOString();
  let end = moment().utc().subtract(1, "day").endOf("day").toISOString();

  if (args_start && args_end) {
    let check_start = moment.parseZone(args_start, moment.ISO_8601, true);
    let check_end = moment.parseZone(args_end, moment.ISO_8601, true);
    if (check_start.isValid() && check_end.isValid()) {
      start = args_start;
      end = args_end;
    }
    if (!check_start.isValid()) {
      console.error(
        `Could not parse start date '${args_start}' as ISO8601 date`
      );
      process.exit();
    }
    if (!check_end.isValid()) {
      console.error(`Could not parse end date '${args_end}' as ISO8601 date`);
      process.exit();
    }
  }
  return { start, end };
}

module.exports.setupDownloadFolder = setupDownloadFolder;
module.exports.validateEnvFile = validateEnvFile;
module.exports.getValidDates = getValidDates;
