const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const db = new sqlite3.Database("baza.db");
const saltRounds = 10;
const heroes = new sqlite3.Database("heroes.db");

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


const choicesMap = {};

const fields = ["ID", "ALIGN", "EYE", "universe", "year", "HAIR"];
const SOURCES = [
  { name: 'wikipedia', base: 'https://en.wikipedia.org' },
  { name: 'marvel', base: 'https://marvel.fandom.com' },
  { name: 'dc', base: 'https://dc.fandom.com' },
];
const https = require("https");
let answersToQuizzes = [];

function cleanLink(link) {
  newLink = link.replace(/\\\//g, '/');
  if (newLink.startsWith('/wiki/')) {
    newLink = newLink.substring(5);
  }
  if (!newLink.startsWith('/')) {
    newLink = '/' + newLink;
  }
  return newLink;
}

function createUrl(sourceBase, relativePath) {
  return `${sourceBase}/wiki${relativePath}`;
}

function urlExists(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

function getValidUrl(link, universe) {
  const relativeLink = cleanLink(link);

  let url;
  if (universe === "DC") {
    url = `${`https://dc.fandom.com`}/wiki${relativeLink}`;
    return url;
  }
  else if (universe == "Marvel") {
    url = `${`https://marvel.fandom.com`}/wiki${relativeLink}`;
    return url;
  }
  if (url == null) return null;

  //console.log(url);
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

function addUser(name, email, callback) {
  console.log("Adding user:", name, email);
  const sql = "INSERT INTO users (name, email) VALUES (?, ?)";
  db.run(sql, [name, email], function (err) {
    if (callback) callback(err);
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

function getQuizzes(n, countRows, callback) {
  // const fields = ["ID", "ALIGN", "EYE", "UNIVERSE", "YEAR", "HAIR"];
  const results = [];

  function next(i) {
    if (i >= n) {
      callback(null, results);
      return;
    }

    const randomIndex = Math.floor(Math.random() * fields.length);
    const chosenField = fields[randomIndex];
    const randomId = Math.floor(Math.random() * countRows) + 1;
    const sqlQuery = `SELECT name, urlslug, universe, ${chosenField} AS value FROM characters LIMIT 1 OFFSET ${randomId}`;

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

module.exports = {
  addUser,
  getUsers,
  getUserByUsername,
  getQuizzes,
  numberOfRows,
  getChoices,
  loadChoices,
  getAnswers,
};
