#!/usr/bin/env node
const fs = require("fs");
const IcsClient = require("./client");
const tools = require("./tools");
const yargs = require("yargs");
const downloadByDateRange = require("./downloadByDateRange");
const downloadByGuids = require("./downloadByGuids");
const OidcClient = require("./oidcClient");

tools.validateEnvFile();
const argv = yargs
  .usage(
    "$0 [-s start-date] [-e end-date] [-f file-path]",
    "Starts process of downloading content for all interactions found between specified dates or listed in file"
  )
  .options({
    start: {
      description: "Search from date in ISO8601 format",
      alias: "s",
      type: "string",
    },
    end: {
      alias: "e",
      description: "Search until date in ISO8601 format",
      type: "string",
    },
    "file-path": {
      description: "path to a file with GUIDs",
      alias: "f",
      type: "string",
    },
  })
  .check((argv) => {
    if (
      (argv["file-path"] && (argv.start || argv.end)) ||
      (argv.start && !argv.end) ||
      (argv.end && !argv.start)
    ) {
      throw new Error(
        "Please provide 'file-path' or both 'start' and 'end' dates"
      );
    }
    return true;
  })
  .version(false)
  .help()
  .alias("help", "h").argv;

let { start, end } = tools.getValidDates(argv.start, argv.end);
const downloadFolder = tools.setupDownloadFolder();
const oidcClient = new OidcClient(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REGION)
const icsClient = new IcsClient(
  oidcClient,
  process.env.REGION,
  downloadFolder
);

(async () => {
  const filePath = argv["file-path"];
  if (filePath) {
    return await downloadByGuids(icsClient, filePath);
  }
  return await downloadByDateRange(icsClient, start, end);
})().then(console.log, console.error);
