const http = require("http");
const url = require("url");
const db = require("./db");
const bcrypt = require("bcrypt");
const port = 3000;
let heroesRowsCount;
const choicesMap = {};
const fields = ["ID", "ALIGN", "EYE", "universe", "year", "HAIR"];
let currentAnswers = [];

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
      db.getAnswers((err, answers) => {
        if (err) {
          console.error("A apărut o eroare:", err);
          return;
        }

        console.log("Current right answers:", answers);
        currentAnswers = answers;
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(quizzes));
    });

    return;
  }

  if (method === "POST" && pathname === "/adauga") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { username, password } = JSON.parse(body);
      const pwd = password;
      let hasUpper = false,
        hasDigit = false;
      if (pwd.length < 9) {
        hasUpper = hasDigit = false;
      } else {
        for (const ch of pwd) {
          if (ch >= "0" && ch <= "9") hasDigit = true;
          if (ch !== ch.toLowerCase() && ch === ch.toUpperCase())
            hasUpper = true;
          if (hasUpper && hasDigit) break;
        }
      }
      if (!hasUpper || !hasDigit || pwd.length < 9) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            succes: false,
            eroare:
              "Password must be at least 9 characters, include an uppercase letter and a digit",
          })
        );
      }
      db.addUser(username, password, (err) => {
        if (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ succes: false, eroare: err.message })
          );
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ succes: true }));
      });
    });
    return;
  }

  if (method === "POST" && pathname === "/login") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { username, password } = JSON.parse(body);
      db.getUserByUsername(username, (err, user) => {
        if (!user) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ succes: false, eroare: "User not found" })
          );
        }
        bcrypt.compare(password, user.password, (err, match) => {
          if (match) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ succes: true }));
          } else {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ succes: false, eroare: "Invalid credentials" })
            );
          }
        });
      });
    });
    return;
  }

  if (method === "POST" && pathname === "/answer") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const parsedData = JSON.parse(body);
        const answer = parsedData.answer;
        const id = parsedData.id;

        let isCorrect = false;
        console.log("Received: " + id + " " + answer);
        if (currentAnswers[id] == answer) {
          console.log("Right.");
          isCorrect = true;
        }
        else
          console.log("Wrong.")

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ correct: isCorrect }));
      } catch (error) {
        console.error("Eroare la parsarea JSON:", error.message);

        if (!res.headersSent) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
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
