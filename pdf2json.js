const	stream = require('stream');
const nodeUtil = require("util");
const fs = require('fs');
const PDFParser = require('pdf2json');

//const fileName = './CIS_Apple_macOS_10.15_Benchmark_v1.0.0.pdf'
const fileName = 'CIS_Apple_macOS_13_23.pdf';

function StringifyStream(){
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
let outputStream = fs.createWriteStream('./macOS_partial.json');

inputStream
  .pipe(new PDFParser())
  .pipe(new StringifyStream())
  .pipe(outputStream);

