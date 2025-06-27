const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath = path.join(__dirname, "baza.db");
const heroesPath = path.join(__dirname, "heroes.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Failed to open baza.db:", err);
});
const heroes = new sqlite3.Database(heroesPath, (err) => {
  if (err) console.error("Failed to open heroes.db:", err);
});

const saltRounds = 10;

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    isAdmin INTEGER DEFAULT 0
  )`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS rankings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    score INTEGER,
    question_id INTEGER NOT NULL
  )`
).run();

function addUser(username, password, callback) {
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return callback(err);
    const sql =
      "INSERT INTO users(username, password, isAdmin) VALUES (?, ?, 0)";
    db.run(sql, [username, hash], function (err) {
      callback(err);
    });
  });
}

const choicesMap = {};

const fields = ["ID", "ALIGN", "EYE", "universe", "year", "HAIR"];

const https = require("https");
let answersToQuizzes = [];

function cleanLink(link) {
  newLink = link.replace(/\\\//g, "/");
  if (newLink.startsWith("/wiki/")) {
    newLink = newLink.substring(5);
  }
  if (!newLink.startsWith("/")) {
    newLink = "/" + newLink;
  }
  return newLink;
}

function getValidUrl(link, universe) {
  const relativeLink = cleanLink(link);

  let url;
  if (universe === "DC") {
    url = `${`https://dc.fandom.com`}/wiki${relativeLink}`;
    return url;
  } else if (universe == "Marvel") {
    url = `${`https://marvel.fandom.com`}/wiki${relativeLink}`;
    return url;
  }
  if (url == null) return null;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadChoices(callback) {
  let loadedCount = 0;

  for (let i = 0; i < fields.length; i++) {
    const searchField = fields[i];

    getChoices(searchField, (err, values) => {
      if (err) {
        console.error(`DB error: couldn;t get values for ${searchField}`, err);
        values = [];
      }

      choicesMap[i] = values;
      console.log(`${searchField}, choicesMap[${i}] =`, values);

      loadedCount++;
      if (loadedCount === fields.length) {
        if (callback) callback(choicesMap);
      }
    });
  }
}

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
function numberOfRows(callback) {
  const sqlQuery = "SELECT COUNT(*) AS count FROM characters";
  heroes.get(sqlQuery, (err, result) => {
    if (err) return callback(err);
    const count = result.count;
    callback(null, count);
  });
}

function getQuizzes(n, countRows, card, callback) {
  const results = [];

  function next(i) {
    if (i >= n) {
      callback(null, results);
      return;
    }

    let randomIndex;
    switch (card) {
      case 1:
        randomIndex = 3;
        break;
      case 2:
        randomIndex = Math.random() < 0.5 ? 2 : 5;
        break;
      case 3:
        randomIndex = 4;
        break;
      case 6:
        randomIndex = Math.floor(Math.random() * fields.length);
        break;
      default:
        do {
          randomIndex = Math.floor(Math.random() * fields.length);
        } while (randomIndex == 3);
    }

    const chosenField = fields[randomIndex];
    const randomId = Math.floor(Math.random() * countRows) + 1;
    let sqlQuery;
    if (card == 4)
      sqlQuery = `SELECT name, urlslug, universe, ${chosenField} AS value FROM characters  WHERE universe='DC' LIMIT 1 OFFSET ${randomId}`;
    else if (card == 5)
      sqlQuery = `SELECT name, urlslug, universe, ${chosenField} AS value FROM characters WHERE universe='Marvel' LIMIT 1 OFFSET ${randomId}`;
    else
      sqlQuery = `SELECT name, urlslug, universe, ${chosenField} AS value FROM characters LIMIT 1 OFFSET ${randomId}`;

    heroes.all(sqlQuery, (err, rows) => {
      if (err) return callback(err);

      const result = rows[0];
      if (!result || result.value == null || result.value == "") {
        return next(i);
      }
      answersToQuizzes[i] = result.value;

      let answersList = [result.value];

      const possibleChoices = choicesMap[randomIndex].filter(
        (choice) => choice !== result.value
      );

      if (possibleChoices.length > 0) {
        let randomChoice;
        if (randomIndex != 3) {
          randomChoice =
            Math.floor(Math.random() * (possibleChoices.length - 1)) + 1;
        } else {
          randomChoice = Math.floor(Math.random() * possibleChoices.length);
        }
        answersList.push(possibleChoices[randomChoice]);
      }

      shuffleArray(answersList);

      let pageLink = getValidUrl(result.urlslug, result.universe);

      results.push({
        name: result.name,
        field: chosenField,
        wiki: pageLink,
        value: answersList,
      });

      next(i + 1);
    });
  }
  next(0);
}

function getAnswers(callback) {
  callback(null, answersToQuizzes);
}

function getChoices(column, callback) {
  const query = `SELECT DISTINCT ${column} FROM characters where ${column} IS NOT NULL and ${column}!=''`;
  heroes.all(query, (err, rows) => {
    if (err) {
      callback(err);
      return;
    }
    const values = rows.map((row) => row[column]);
    callback(null, values);
  });
}

function grantAdmin(id, callback) {
  const sql = "UPDATE users SET isAdmin = 1 WHERE id = ?";
  db.run(sql, [id], function (err) {
    callback(err);
  });
}

function updateRanking(score, username, questionId, callback) {
  const sql = `SELECT * FROM rankings WHERE username = ? AND question_id = ?`;
  db.get(sql, [username, questionId], (err, row) => {
    if (err) return callback(err);
    if (row) {
      db.run(
        `UPDATE rankings SET score = ? WHERE username = ? AND question_id = ?`,
        [score, username, questionId],
        callback
      );
    } else {
      db.run(
        `INSERT INTO rankings (username, score, question_id) VALUES (?, ?, ?)`,
        [username, score, questionId],
        callback
      );
    }
  });
}

function getRanking(questionId, callback) {
  const sql = `
    SELECT username, score, question_id
      FROM rankings
     WHERE question_id = ?
  ORDER BY score DESC
     LIMIT 4
  `;
  db.all(sql, [questionId], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

function getOverallRanking(callback) {
  const sql = `
    SELECT
      username,
      score,
      question_id
    FROM rankings
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

module.exports = {
  addUser,
  getUsers,
  getUserByUsername,
  getQuizzes,
  numberOfRows,
  getChoices,
  loadChoices,
  getAnswers,
  grantAdmin,
  updateRanking,
  getRanking,
  getOverallRanking,
};
