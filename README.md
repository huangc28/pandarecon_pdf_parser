# Pandarule

## Why?

Pandarule is a parser made specifically to extract data from control PDF. We have a library of risk control guidelines to  seed to database. It going to take much efford to do it by hand. This can automate the process of extracting the data from the PDFs.

## How does this package work?

This tool uses the package [PDF2JSON](https://github.com/modesty/pdf2json) behind the scene. It parses a given PFD into chunks of text element. Each element has the information of text position, text style, text size, and text value...etc. Pandarule utilizes these information to to filter out the information we would like to seed into the database.

## Where to ask for help?

Please contact the original developer `huangchiheng@gmail.com` if any questions.

## How to use this package?

### Parse the risk control PDF to json format

First, place the control PDF document you want to feed to `pdf2json.js` in `source_pdfs` directory. I suggest to only retain content of risk control rules in the PDF.


After you have placed the PDF, run the following:

```
node pdf2json.js
```

The above command would parse the PDF into json format. The result json file will be placed in `data_source` directory.

## TODOs

- [] Refactor this package to be a command line tool pacakge.

- [x] `18.9.26.1.1` 的 Description extraction 有問題。 Description 區塊中有一個 `Note:`。這個 Note 分開兩部分了。
- [x] MS windows 8.1 的 windows command 需要重新 restructure。
- [x] Remove page text chunk
