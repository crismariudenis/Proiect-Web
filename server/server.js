const http = require("http");
const url = require("url");
const db = require("./db");
const bcrypt = require("bcrypt");
const port = 3000;
const userAnswersMap = {};
const userScoreMap = {};
let heroesRowsCount;
const choicesMap = {};
const fields = ["ID", "ALIGN", "EYE", "universe", "year", "HAIR"];
let currentCard;
let usersUpdatingScores = {};

db.numberOfRows((err, count) => {
  if (err) {
    console.error("Couldn't find rowcount", err);
    res.writeHead(500);
    res.end("Server error");
    return;
  } else {
    console.log("Rows:" + count);
    heroesRowsCount = count;
  }
});

db.loadChoices((choicesMap) => { });

// modify authenticate to attach username
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Unauthorized" }));
  }
  let creds;
  try {
    creds = Buffer.from(token, "base64").toString().split(":");
  } catch {
    res.writeHead(400);
    return res.end();
  }
  const [username, password] = creds;
  db.getUserByUsername(username, (err, user) => {
    if (err || !user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }
    bcrypt.compare(password, user.password, (err, match) => {
      if (match) {
        req.authUser = username; // store for downstream
        return next();
      }
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
    });
  });
}

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
  // /selectedCard: just record card selection doesn't need answers
  if (method === "POST" && pathname === "/selectedCard") {
    return authenticate(req, res, () => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const parsedData = JSON.parse(body);
          const id = parsedData.cardId;
          console.log("Id: " + id);
          currentCard = id;
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Card received" }));
        } catch (error) {
          console.error("Eroare la parsarea JSON:", error.message);

          if (!res.headersSent) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
          }
        }
      });

      return;
    });
  }

  if (method === "GET" && pathname === "/score") {
    return authenticate(req, res, () => {
      const username = req.authUser;
      const score = userScoreMap[username];
      console.log("Score from server: " + score);

      db.updateRanking(score, username, (err) => {
        if (err) {
          console.error("Couldn't update ranking", err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          return res.end("Server error");
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ score }));

      });

    });
  }


  if (method === "GET" && pathname === "/rankings") {
    return authenticate(req, res, () => {
      userScoreMap[req.authUser] = 0;
      usersUpdatingScores[req.authUser] = 20;
      db.getRanking((err, result) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Database error-rank" }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(result));
      });

    });
  }


  // /quizzes: generate and store answers per user
  if (method === "GET" && pathname === "/quizzes") {
    return authenticate(req, res, () => {
      db.getQuizzes(10, heroesRowsCount, currentCard, (err, quizzes) => {
        if (err) {
          console.error("Couldn't get quizzes", err);
          res.writeHead(500);
          res.end("Server error");
          return;
        }

        console.log("Generated Quizzes: ", quizzes);

        // load correct answers and store in map
        db.getAnswers((err, answers) => {
          userAnswersMap[req.authUser] = answers;
          console.log(answers);
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(quizzes));
      });
    });
  }

  if (method === "POST" && pathname === "/adauga") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { username, password } = JSON.parse(body);

      // === new: reject if username already exists ===
      db.getUserByUsername(username, (err, user) => {
        if (user) {
          res.writeHead(409, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              succes: false,
              eroare: "Username already taken",
            })
          );
        }

        // ...existing password‐strength checks...
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

        // ...existing insertion...
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

  // /answer: check against this user’s answers
  if (method === "POST" && pathname === "/answer") {
    return authenticate(req, res, () => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const { id, answer } = JSON.parse(body);
          const answers = userAnswersMap[req.authUser] || [];
          const correct = answers[id] === answer;
          if (correct) {
            username = req.authUser;
            userScoreMap[username] += 10 * usersUpdatingScores[username];
            usersUpdatingScores[username] += 30;
          }
          console.log("Current score " + req.authUser + " " + userScoreMap[req.authUser]);
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ correct }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
    });
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(port, () => {
  console.log(`Serverul rulează la http://localhost:${port}`);
});
