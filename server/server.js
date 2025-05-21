const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const db = require("./db");
const port = 3000;
let heroesRowsCount;
const choicesMap = {};
const fields = ["ID", "ALIGN", "EYE", "UNIVERSE", "YEAR", "HAIR"];

db.numberOfRows((err, count) => {
  if (err) {
    console.error("Couldn't find rowcount", err);
    res.writeHead(500);
    res.end("Server error");
    return;
  }
  else {
    console.log("Rows:" + count);
    heroesRowsCount = count;
  }
});

// function loadChoices(i) {
//   let searchField;
//   switch (i) {
//     case 0:
//       searchField = "ID"
//       break;
//     case 1:
//       searchField = "ALIGN"
//       break;
//     case 2:
//       searchField = "EYE"
//       break;
//     case 3:
//       searchField = "universe"
//       break;
//     case 4:
//       searchField = "year"
//       break;
//     case 5:
//       searchField = "HAIR"
//       break;

//   }
//   db.getChoices(searchField, (err, values) => {
//     if (err) {
//       console.error("DB error: couldn;t get field values", err);
//       return;
//     }
//     choicesMap[i] = values;
//     console.log(`${searchField}, map[${i}] =`, choicesMap[i]);

//   });
// }

// for (let i = 0; i <= 5; i++) {
//   loadChoices(i);
// }
db.loadChoices((choicesMap) => {
  // console.log('Choices:', choicesMap);

})

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const pathname = parsedUrl.pathname;

  console.log(pathname);
  if (method === "GET" && pathname === "/quizzes") {

    db.getQuizzes(10, heroesRowsCount, (err, quizzes) => {
      if (err) {
        console.error("Couldn't get quizzes", err);
        res.writeHead(500);
        res.end("Server error");
        return;
      }

      //console.log("Generated Quizzes: ", quizzes);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(quizzes));
    });

    return;
  }

  if (method === "POST" && pathname === "/adauga") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const { name, email } = JSON.parse(body);
        db.addUser(name, email, (err) => {
          if (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ succes: false, eroare: err.message }));
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ succes: true }));
          }
        });
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ succes: false, eroare: err.message }));
      }
    });
    return;
  }

  if (method === "GET" && pathname === "/lista") {
    db.getUsers((err, utilizatori) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ succes: false, eroare: err.message }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(utilizatori));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(port, () => {
  console.log(`Serverul rulează la http://localhost:${port}`);
});
