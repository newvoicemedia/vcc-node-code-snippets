const fs = require('fs');
const IcsClient = require('./client');
const tools = require('./tools');

tools.validateEnvFile();
const downloadFolder = tools.setupDownloadFolder();

const icsClient = new IcsClient(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REGION, downloadFolder);

// ----------------------------------------------------------
// Here you can setup date range for interactions to download
// ----------------------------------------------------------
const start = '2020-01-01T10:00:00Z';
const end = '2020-04-01T10:00:00Z';

icsClient.search(start, end)
    .then(
        r => {
          [...Array(r.meta.pageCount).keys()].forEach(
              page => icsClient.search(start, end, page + 1)
                  .then(r => icsClient.downloadPage(r.items))
          )
        },
        console.error);
