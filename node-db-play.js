console.log("Hello there World!");
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(
    './halfway.db', 
    sqlite3.OPEN_READONLY, 
    (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to HalfwayDB');
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Closed HalfwayDB');
});
