#!/usr/bin/env node

yaml = require("js-yaml");
fs = require("fs");
execa = require("execa").shellSync;

if (process.argv.slice(2).length === 0) {
  log("You need to specify a yaml file");
} else if (/--tt/.test(process.argv.join())) {
  var cTemplate = process.argv[process.argv.indexOf("--tt") + 1];
}

try {
  var doc = yaml.safeLoad(fs.readFileSync(process.argv[2], "utf8"));
} catch (_) {
  log("Error during parse yaml-file");
}

try {
  var tex = fs.readFileSync(cTemplate || "calpla.template.tex", "utf-8");
} catch (_) {
  log("Error while reading template");
}
try {
  const weekDays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];
  var replace = tex
    .replace(/%%TITLE/, `\\textsc{\\LARGE ${doc.title || "TimeTable"}}\\\\`)
    .replace(/%%DATE/, `\\textsc{\\large ${doc.week.start || ""}}`)
    .replace("\\day{}{}", "");

  weekDays.forEach(_ => {
    replace = replace.replace(
      new RegExp(`%%${_.slice(0, 3).toUpperCase()}`),
      getTask(doc.week[_])
    );
  });

  if (Object.keys(doc.week).some(_ => /day_$/.test(_))) {
    weekDays.forEach(_ => {
      replace = replace.replace(
        new RegExp(`%%${_.slice(0, 3).toUpperCase()}_`),
        getTask(doc.week[`${_}_`])
      );
    });
  }
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
