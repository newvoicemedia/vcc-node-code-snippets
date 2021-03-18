const fs = require("fs");
const csv = require("fast-csv");

class FailuresFileWriter {
  constructor(filename) {
    this._filename = filename;
  }

  append(failures) {
    if (!this._csvStream) {
      this._createCsvStream();
    }
    failures.forEach((f) =>
      this._csvStream.write({
        guid: f.guid,
        statusCode: f.statusCode,
        message: f.message,
      })
    );
  }

  close() {
    if (this._csvStream) {
      this._csvStream.end();
    }
  }

  _createCsvStream() {
    this._csvStream = csv.format({ headers: true });
    this._csvStream.pipe(fs.createWriteStream(this._filename));
  }
}

module.exports = FailuresFileWriter;
