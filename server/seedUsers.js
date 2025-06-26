const { addUser } = require('./db');

function randomUsername() {
  return 'user' + Math.floor(Math.random() * 1e6);
}
function randomPassword() {
  return 'Pass' + Math.random().toString(36).slice(-8);
}

const count = parseInt(process.argv[2], 10) || 20;
for (let i = 0; i < count; i++) {
  const username = randomUsername();
  const password = randomPassword();
  addUser(username, password, (err) => {
    if (err) console.error(`Error adding ${username}:`, err.message);
    else console.log(`Added ${username}`);
  });
}
