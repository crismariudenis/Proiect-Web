const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const db = new sqlite3.Database("baza.db");
const saltRounds = 10;

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`
).run();

function addUser(username, password, callback) {
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return callback(err);
    const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.run(sql, [username, hash], function (err) {
      callback(err);
    });
  });
}

function getUsers(callback) {
  db.all("SELECT * FROM users", [], (err, rows) => {
    callback(err, rows);
  });
}

function getUserByUsername(username, callback) {
  const sql = "SELECT * FROM users WHERE username = ?";
  db.get(sql, [username], (err, row) => {
    callback(err, row);
  });
}

module.exports = {
  addUser,
  getUsers,
  getUserByUsername,
};
