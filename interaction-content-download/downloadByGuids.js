const TextFileReader = require("./textFileReader");

const downloadByGuids = async (icsClient, filePath) => {
  const fileReader = new TextFileReader(filePath);
  const batchSize = 1;
  try {
    let guids = fileReader.nextLines(batchSize);
    while (guids.length > 0) {
      const guid = guids[0];
      const interaction = await icsClient.getInteraction(guid);
      await icsClient.downloadAllContent(interaction.guid, interaction.content);
      guids = fileReader.nextLines(batchSize);
    }
  } catch (error) {
    return "Error occurred";
  } finally {
    fileReader.close();
  }
  return "All done";
};

module.exports = downloadByGuids;
