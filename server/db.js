const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("baza.db");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )`
).run();

function addUser(nume, email, callback) {
  const sql = "INSERT INTO users (name, email) VALUES (?, ?)";
  db.run(sql, [nume, email], function (err) {
    if (callback) callback(err);
  });
}

function getUsers(callback) {
  db.all("SELECT * FROM users", [], (err, rows) => {
    callback(err, rows);
  });
}

module.exports = {
  addUser,
  getUsers,
};
