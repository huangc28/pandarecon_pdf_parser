#!/usr/bin/env node

'use strict'


const { Command } = require('commander')
const  fs = require('fs')
const { resolve } = require('path')

const parsePdf = require('./pdf2json')

const pkgJson = JSON.parse(
  fs.readFileSync(resolve(__dirname, 'package.json'), { encoding: 'utf8' })
)

const program = new Command()
program
  .version(pkgJson.version)
  .addCommand(parsePdf())
  //.addCommand()

program.parse(process.argv)




