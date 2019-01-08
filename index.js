#!/usr/bin/env node

yaml = require("js-yaml");
fs = require("fs");
execa = require("execa").shellSync;
glob = require("glob");

if (process.argv.slice(2).length === 0) {
  log("You need to specify a yaml file");
}

try {
  var doc = yaml.safeLoad(fs.readFileSync(process.argv[2], "utf8"));
} catch (_) {
  log("Error during parse yaml-file");
}

try {
  var tex = fs.readFileSync("calpla.template", "utf-8");
} catch (_) {
  log("Error while reading calpla.template");
}
try {
  var replace = tex
    .replace(/%%TITLE/, `\\textsc{\\LARGE ${doc.title || "TimeTable"}}\\\\`)
    .replace(/%%DATE/, `\\textsc{\\large ${doc.week.start || ""}}`)
    .replace("\\day{}{}", "")
    .replace(/%%SUN/, getTask(doc.week.sunday))
    .replace(/%%MON/, getTask(doc.week.monday))
    .replace(/%%TUE/, getTask(doc.week.tuesday))
    .replace(/%%WED/, getTask(doc.week.wednesday))
    .replace(/%%THU/, getTask(doc.week.thursday))
    .replace(/%%FRI/, getTask(doc.week.friday))
    .replace(/%%SAT/, getTask(doc.week.saturday));
} catch (_) {
  log("Error during reading values from yaml");
}

fs.writeFileSync("out.tex", replace);

execa("pdflatex out.tex");
console.log("Successfully created out.pdf");
cleanup();

function getTask(date) {
  return date
    ? Array.isArray(date)
      ? `\\day{}{
    ${date
      .map(
        day =>
          `\\textbf{${day.begin || ""} ${
            day.end ? "- " + day.end : ""
          }} \\daysep ${day.task || ""}`
      )
      .join("\\\\")}
  }`
      : `\\day{}{
      \\textbf{${date.begin || ""} ${
          date.end ? "- " + date.end : ""
        }} \\daysep ${date.task || ""}
    }`
    : `\\day{}{}`;
}

function cleanup() {
  ["out.aux", "out.log", "out.tex"].forEach(file => {
    fs.unlink(file, (err, _) => {
      if (err) console.log(err);
    });
  });
}

function log(message) {
  console.log(message);
  process.exit(-1);
}
