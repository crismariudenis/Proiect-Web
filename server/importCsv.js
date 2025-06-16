const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { addHero } = require("./heroesDb");

function importCsv(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (r) => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

(async () => {
  const folder = path.join(__dirname, "csv");
  const files = ["dc-wikia-data.csv", "marvel-wikia-data.csv"].map((f) =>
    path.join(folder, f)
  );
  for (const file of files) {
    const rows = await importCsv(file);
    for (const row of rows) {
      await new Promise((res) => addHero(row, () => res()));
    }
    console.log(`Imported ${rows.length} records from ${path.basename(file)}`);
  }
  process.exit(0);
})();
