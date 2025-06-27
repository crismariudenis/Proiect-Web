const http = require("http");
const url = require("url");
const db = require("./db");
const bcrypt = require("bcrypt");
const express = require("express");
const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Replace * with your frontend URL in production
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Handle OPTIONS requests (preflight)
app.options("*", (req, res) => res.sendStatus(200));

const port = 3000;
const userAnswersMap = {};
const userScoreMap = {};
let heroesRowsCount;
let currentCard;
let usersUpdatingScores = {};

function setCORSHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}



db.numberOfRows((err, count) => {
  if (err) {
    console.error("Couldn't find rowcount", err);
    // if res isn’t in scope here, just exit process
    process.exit(1);
  } else {
    console.log("Rows:" + count);
    heroesRowsCount = count;
  }
});

db.loadChoices((choicesMap) => {});

function authenticate(req, res, next) {
  setCORSHeaders(res);
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
        req.authUser = username;
        return next();
      }
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
    });
  });
}

const server = http.createServer((req, res) => {
  setCORSHeaders(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const pathname = parsedUrl.pathname;

  console.log(pathname);
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
      console.log("Final score: " + score);
      if (score === undefined) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "No score." }));
      }
      db.updateRanking(score, username, currentCard, (err) => {
        if (err) {
          res.writeHead(500);
          return res.end("Server error");
        }
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ score }));
    });
  }

  if (method === "GET" && pathname === "/rankings") {
    return authenticate(req, res, () => {
      const parsed = new URL(req.url, `http://${req.headers.host}`);
      const q = parsed.searchParams.get("question");
      if (q) {
        db.getRanking(q, (err, rows) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "DB error" }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(rows));
        });
      } else {
        db.getOverallRanking((err, rows) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "DB error" }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(rows));
        });
      }
    });
  }

  if (method === "GET" && pathname === "/rankings/rss") {
    db.getOverallRanking((err, rows) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        return res.end("Server error");
      }
      res.writeHead(200, { "Content-Type": "application/xml" });
      let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>HEROQuizz Rankings</title>
  <link>https://proiect-web-server.vercel.app/rankings/rss</link>
  <description>Latest HEROQuizz overall rankings</description>`;

      rows.forEach((e, i) => {
        rss += `
  <item>
    <title>${e.username}</title>
    <description>Score: ${e.score} (Question ${e.question_id})</description>
    <guid isPermaLink="false">${i + 1}-${e.username}-${e.question_id}</guid>
  </item>`;
      });

      rss += `
</channel>
</rss>`;
      res.end(rss);
    });
    return;
  }

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

        db.getAnswers((err, answers) => {
          userAnswersMap[req.authUser] = answers;
          console.log(answers);
          if (!(req.authUser in userScoreMap)) {
            userScoreMap[req.authUser] = 0;
            usersUpdatingScores[req.authUser] = 1;
          }
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
    return authenticate(req, res, () => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const { id, answer } = JSON.parse(body);
          const answers = userAnswersMap[req.authUser] || [];
          console.log(req.authUser, answers);
          const correct = answers[id] === answer;
          if (correct) {
            username = req.authUser;
            userScoreMap[username] += 10 * usersUpdatingScores[username];
            usersUpdatingScores[username] += 30;
          }
          console.log(
            "Current score " + req.authUser + " " + userScoreMap[req.authUser]
          );
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ correct }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
    });
  }

  if (method === "GET" && pathname === "/dashboard") {
    return authenticate(req, res, () => {
      db.getUserByUsername(req.authUser, (err, user) => {
        if (err || !user) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Unauthorized" }));
        }
        if (user.isAdmin) {
          db.getUsers((err, users) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Server error" }));
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ users }));
          });
        } else {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Forbidden" }));
        }
      });
    });
  }

  if (method === "POST" && pathname === "/grantAdmin") {
    return authenticate(req, res, () => {
      db.getUserByUsername(req.authUser, (err, user) => {
        if (err || !user || !user.isAdmin) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Unauthorized" }));
        }
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const { id } = JSON.parse(body);
            db.grantAdmin(id, (err) => {
              if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Database error" }));
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ success: true }));
            });
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Invalid JSON" }));
          }
        });
      });
    });
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(port, () => {
  console.log(`Serverul rulează la http://localhost:${port}`);
});
