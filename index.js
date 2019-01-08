yaml = require("js-yaml");
fs = require("fs");
execa = require("execa").shellSync;
glob = require("glob");

try {
  var doc = yaml.safeLoad(
    fs.readFileSync(process.argv[2] || "./example/timetable.yml", "utf8")
  );
} catch (e) {
  console.log("Error during parse yaml-file");
  process.exit(-1);
}

try {
  var tex = fs.readFileSync("calpla.template", "utf-8");
} catch (_) {
  console.log("Error while reading calpla.template");
  process.exit(-1);
}
try {
  var replace = tex
    .replace(/%%TITLE/, `${doc.title || "TimeTable"}\\\\`)
    .replace(/%%DATE/, doc.week.start)
    .replace("\\day{}{}", "")
    .replace(/%%SUN/g, getTask(doc.week.sunday))
    .replace(/%%MON/g, getTask(doc.week.monday))
    .replace(/%%TUE/g, getTask(doc.week.tuesday))
    .replace(/%%WED/g, getTask(doc.week.wednesday))
    .replace(/%%THU/g, getTask(doc.week.thursday))
    .replace(/%%FRI/g, getTask(doc.week.friday))
    .replace(/%%SAT/g, getTask(doc.week.saturday));
} catch (_) {
  console.log("Error during reading values from yaml");
  process.exit(-1);
}

fs.writeFileSync("out.tex", replace);

execa("pdflatex out.tex");
console.log("Successfully created out.pdf");
cleanup();

function getTask(date) {
  return date
    ? Array.isArray(date)
      ? `\\day{}{
    ${date.map(
      day => `\\textbf{${day.begin} - ${day.end}} \\daysep ${day.task}\\\\`
    )}
  }`
      : `\\day{}{
      \\textbf{${date.begin} - ${date.end}} \\daysep ${date.task}
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
