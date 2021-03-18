#!/usr/bin/env node
const yargs = require("yargs");
const tools = require("./tools");
const IcsClient = require("./client");
const TextFileReader = require("./textFileReader");
const FailuresFileWriter = require("./failuresFileWriter");

tools.validateEnvFile();
const argv = yargs
  .usage(
    "$0 [-f file-path]",
    "Starts process of deleting interactions and its content with GUIDs provided in file"
  )
  .options({
    "file-path": {
      description: "path to file with GUIDs",
      alias: "f",
      type: "string",
    },
  })
  .check((argv) => {
    if (argv["file-path"]) {
      return true;
    }
    throw new Error("Please provide 'file-path' option");
  })
  .version(false)
  .help()
  .alias("help", "h").argv;

const batchSize = 56;
const failuresFile = "failures.csv";
const icsClient = new IcsClient(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REGION
);
const fileReader = new TextFileReader(argv.filePath);
const failuresWriter = new FailuresFileWriter(failuresFile);
(async () => {
  console.log(`Deleting interactions...`);
  try {
    let guids = fileReader.nextLines(batchSize);
    while (guids.length > 0) {
      console.log(`Deleting batch of ${guids.length} GUIDs...`);
      const failures = await icsClient
        .deleteInteractions(guids)
        .then((r) => r.failures);
      if (failures.length > 0) {
        console.warn(
          `Deletion of some GUIDs failed, check ${failuresFile} file for more details`
        );
        failuresWriter.append(failures);
      }
      guids = fileReader.nextLines(batchSize);
    }
  } finally {
    fileReader.close();
    failuresWriter.close();
  }
})().then(
  () => console.log("All Done"),
  (e) => console.error("Error occurred", e)
);
