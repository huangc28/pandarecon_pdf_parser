const	stream = require('stream');
const nodeUtil = require("util");
const fs = require('fs');
const PDFParser = require('pdf2json');

const fileName = './source_pdfs/CIS_Microsoft_Windows_7_Workstation_Benchmark_v3.2.0 - End of Life.risk_only.pdf'

const targetFileName = './data_source/CIS_Microsoft_Windows_7_Workstation_Benchmark_v3.2.0 - End of Life.risk_only.json'

function StringifyStream() {
     stream.Transform.call(this);

     this._readableState.objectMode = false;
     this._writableState.objectMode = true;
 }

 nodeUtil.inherits(StringifyStream, stream.Transform);

 StringifyStream.prototype._transform = function(obj, encoding, callback){
     this.push(JSON.stringify(obj));
     callback();
 };

let inputStream = fs.createReadStream(
    fileName,
    {
      bufferSize: 64 * 1024,
    },
  );

let outputStream = fs.createWriteStream(targetFileName);

inputStream
  .pipe(new PDFParser())
  .pipe(new StringifyStream())
  .pipe(outputStream);

