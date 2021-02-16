#!/usr/bin/env node
const fs = require('fs');
const IcsClient = require('./client');
const tools = require('./tools');
const yargs = require('yargs');

tools.validateEnvFile();
const argv = yargs
    .usage('$0 [-s start-date] [-e end-date]', 'Starts process of downloading content for all interactions found between specified dates')
    .options({
      'start': {
        description: 'Search from date in ISO8601 format',
        alias: 's',
        type: 'string',
      },
      'end': {
        alias: 'e',
        description: 'Search until date in ISO8601 format',
        type: 'string',
      }
    })
    .check((argv, options) => {
      if ((!argv.start && !argv.end) || (argv.start && argv.end)) {
        return true;
      }
      throw new Error("Please provide both 'start' and 'end' options or neither")
    })
    .version(false)
    .help()
    .alias('help', 'h')
    .argv;

let {start, end} = tools.getValidDates(argv.start, argv.end);
const downloadFolder = tools.setupDownloadFolder();
const icsClient = new IcsClient(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REGION, downloadFolder);

(async () => {
  console.log(`Searching for interactions between '${start}' - '${end}'\n`);
  try {
    let pageNumber = 1; //counter used for logging not used for paging
    let nextContinuationToken = undefined;
    do {
      console.log(`Getting page ${pageNumber}`);
      const searchPage = await icsClient.search(start, end, nextContinuationToken);
      await icsClient.downloadPage(searchPage.items);
      nextContinuationToken = searchPage.meta.nextContinuationToken;
      pageNumber++;
    } while (nextContinuationToken)
  } catch (error) {
    return 'Error occurred';
  }
  return 'All Done';
})().then(console.log, console.error);
