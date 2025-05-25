const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("baza.db");
const heroes = new sqlite3.Database("heroes.db");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )`
).run();

const choicesMap = {};

const fields = ["ID", "ALIGN", "EYE", "universe", "year", "HAIR"];

let answersToQuizzes = [];

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
    const sqlQuery = `SELECT name, ${chosenField} AS value FROM characters LIMIT 1 OFFSET ${randomId}`;

    heroes.all(sqlQuery, (err, rows) => {
      if (err) return callback(err);

      const result = rows[0];
      if (!result || result.value == null || result.value == '') {
        return next(i);
      }
      answersToQuizzes[i] = result.value;

      let answersList = [result.value];

      const possibleChoices = choicesMap[randomIndex].filter(
        choice => choice !== result.value
      );

      if (possibleChoices.length > 0) {
        let randomChoice;
        if (randomIndex != 3) {
          randomChoice = Math.floor(Math.random() * (possibleChoices.length - 1)) + 1;
        }
        else {
          randomChoice = Math.floor(Math.random() * (possibleChoices.length));
        }
        answersList.push(possibleChoices[randomChoice]);
      }

      shuffleArray(answersList);

      results.push({
        name: result.name,
        field: chosenField,
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
    const values = rows.map(row => row[column]);
    callback(null, values);
  });
}



module.exports = {
  addUser,
  getUsers,
  getQuizzes,
  numberOfRows,
  getChoices,
  loadChoices,
  getAnswers,
};
