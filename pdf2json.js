#!/usr/bin/env node

'use strict'

// pandarules parse-pdf -f ./source_pdfs/CIS_Apple_macOS_risk_only.pdf -o ./data_source/

const	stream = require('stream');
const nodeUtil = require("util");
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');
const { Command } = require('commander');


const parsePdf = new Command('parse-pdf')

parsePdf
  .requiredOption('-f, --file <filePath>', 'specify pdf path to parse to json')
  .option('-o, --output [outputPath]', 'specify output path of parsed json')
  .parse(process.argv)
  .action(pdf2json)

module.exports = () => parsePdf

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

function pdf2json(cmdOpts) {
  const filename = path.resolve(__dirname, cmdOpts.file)

  // if output path is not provided, we cut the last segment of filename to be the `filename`.
  const { name } = path.parse(filename)
  const outputPath = !cmdOpts.output
    ? path.resolve(__dirname, 'data_source', `${name}.json`)
    : path.resolve(__dirname, cmdOpts.output)

  let inputStream = fs.createReadStream(
      filename,
      {
        bufferSize: 64 * 1024,
      },
    );

  let outputStream = fs.createWriteStream(outputPath);

  inputStream
    .pipe(new PDFParser())
    .pipe(new StringifyStream())
    .pipe(outputStream);
}

