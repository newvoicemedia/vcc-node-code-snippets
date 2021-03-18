const lineByLine = require("n-readlines");
const fs = require("fs");

/***
 * Helper class. Allows read text file with list of GUIDs. Each GUID should be in separate line.
 */
class TextFileReader {
  /***
   * @param filePath path to file with GUIDs
   */
  constructor(filePath) {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: missing "${filePath}" file.`);
      process.exit(1);
    }
    console.log(`Reading file "${filePath}"...`);
    this._liner = new lineByLine(filePath);
  }

  /***
   * Reads next lines from file.
   * Each line is trimmed.
   * @param limit Maximum number of lines to read
   * @returns {[]} List of lines read
   */
  nextLines(limit) {
    let lineNumber = 0;
    const lines = [];
    let line;
    do {
      line = TextFileReader.trimLine(this._liner.next());
      if (line) {
        lines.push(line);
        lineNumber++;
      }
    } while (line && lineNumber < limit);
    return lines;
  }

  close() {
    if (this._liner.fd) {
      this._liner.close();
    }
  }

  static trimLine(line) {
    return line ? line.toString("ascii").trim() : line;
  }
}

module.exports = TextFileReader;
