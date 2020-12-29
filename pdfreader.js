const PdfReader = require('pdfreader')

(async function() {
  new PdfReader().parseFileItems("CIS_Apple_macOS_10.15_Benchmark_v1.0.0.pdf", function (err, item) {
    if (err) callback(err);
    else if (!item) callback();
    else if (item.text) console.log(item.text);
  });
}())
