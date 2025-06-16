const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("heroes.db");

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS heroes (
       id   INTEGER PRIMARY KEY AUTOINCREMENT,
       data TEXT    NOT NULL
     )`
  );
});

function addHero(row, callback) {
  const stmt = db.prepare("INSERT INTO heroes(data) VALUES(?)");
  stmt.run(JSON.stringify(row), function (err) {
    stmt.finalize();
    callback(err);
  });
}

function getHeroes(callback) {
  db.all("SELECT id, data FROM heroes", (err, rows) => {
    if (err) return callback(err);
    const heroes = rows.map((r) => ({ id: r.id, ...JSON.parse(r.data) }));
    callback(null, heroes);
  });
}

module.exports = { addHero, getHeroes };
