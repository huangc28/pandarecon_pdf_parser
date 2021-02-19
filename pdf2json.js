const	stream = require('stream');
const nodeUtil = require("util");
const fs = require('fs');
const PDFParser = require('pdf2json');

//const fileName = './source_pdfs/CIS_Apple_macOS_10.15_Benchmark_v1.0.0.pdf'
//const fileName = 'CIS_Apple_macOS_13_23.pdf';
//const fileName = './source_pdfs/CIS_Apple_macOS_risk_only.pdf';
//const fileName = 'CIS_Microsoft_Windows_10_Enterprise_Release_1909_Benchmark_v1.8.1_risk_only.pdf';
//const fileName = './source_pdfs/CIS_Microsoft_Windows_8.1_Workstation_Benchmark_v2.4.0_risk_only.pdf'
//const fileName = './source_pdfs/CIS_Microsoft_Office_Word_2016_Benchmark_v1.1.0_risk_only.pdf'
//const fileName = './source_pdfs/CIS_Microsoft_Windows_Server_2012_R2_Benchmark_v2.4.0_risk_only.pdf'
const fileName = './source_pdfs/CIS_Microsoft_Windows_7_Workstation_Benchmark_v3.2.0 - End of Life.risk_only.pdf'

//const targetFileName = './macOS_master.json'
//const targetFileName = './data_source/macOS_risk_only.json'
//const targetFileName = './CIS_Microsoft_Windows_10_Enterprise_Release_1909_Benchmark_v1.8.1_risk_only.json'
//const targetFileName = './data_source/CIS_Microsoft_Windows_8.1_Workstation_Benchmark_v2.4.0_risk_only.json'
//const targetFileName = './data_source/CIS_Microsoft_Office_Word_2016_Benchmark_v1.1.0_risk_only.json'
//const targetFileName = './data_source/CIS_Microsoft_Windows_Server_2012_R2_Benchmark_v2.4.0_risk_only.json'
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

