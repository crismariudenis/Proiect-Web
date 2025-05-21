const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const db = require("./db");
const port = 3000;

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

  if (
    method === "GET" &&
    fs.existsSync(filePath) &&
    !fs.lstatSync(filePath).isDirectory()
  ) {
    const ext = path.extname(filePath);
    const contentType =
      {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
      }[ext] || "text/plain";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
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
