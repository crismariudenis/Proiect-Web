const http = require("http");
const url = require("url");
const db = require("./db");
const bcrypt = require("bcrypt");
const port = 3000;

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

  res.writeHead(404);
  res.end("Not found");
});

server.listen(port, () => {
  console.log(`Serverul rulează la http://localhost:${port}`);
});
