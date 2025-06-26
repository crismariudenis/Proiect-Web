const db = require("./db");

db.getUsers((err, users) => {
  if (err) {
    console.error("Error fetching users:", err);
    return;
  }
  users.forEach((user) => {
    // seed questions 1..6 with random scores
    for (let qid = 1; qid <= 6; qid++) {
      const score = Math.floor(Math.random() * 101); // 0–100
      db.updateRanking(score, user.username, qid, (err) => {
        if (err) {
          console.error(`Failed to seed ${user.username} q${qid}:`, err);
        }
      });
    }
  });
  console.log("Ranking seeder done.");
});
