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
  let pageNumber = 1;
  const pageSize = undefined; //if you want to limit how many elements are downloaded specify a number here. Max allowed value is 1000
  let searchPage = await icsClient.search(start, end, pageNumber, pageSize);
  const allPagesCount = searchPage.meta.pageCount;
  while (pageNumber <= allPagesCount) {
    console.log(`Getting page ${pageNumber} of ${allPagesCount}`);
    await icsClient.downloadPage(searchPage.items);
    pageNumber++;
    if (pageNumber <= allPagesCount) {
      searchPage = await icsClient.search(start, end, pageNumber, pageSize);
    }
  }
  return 'All Done';
})().then(console.log, console.error);
