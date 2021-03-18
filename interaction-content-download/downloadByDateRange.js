const downloadByDateRange = async (icsClient, start, end) => {
  console.log(`Searching for interactions between '${start}' - '${end}'\n`);
  try {
    let pageNumber = 1; //counter used for logging not used for paging
    let nextContinuationToken = undefined;
    do {
      console.log(`Getting page ${pageNumber}`);
      const searchPage = await icsClient.search(
        start,
        end,
        nextContinuationToken
      );
      await downloadPage(icsClient, searchPage.items);
      nextContinuationToken = searchPage.meta.nextContinuationToken;
      pageNumber++;
    } while (nextContinuationToken);
  } catch (error) {
    return "Error occurred";
  }
  return "All Done";
};

async function downloadPage(icsClient, items) {
  for (const i of items) {
    await icsClient.downloadAllContent(i.guid, i.content);
  }
}

module.exports = downloadByDateRange;
