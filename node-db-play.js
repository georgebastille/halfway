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

const from = 'ANG';

db.serialize(() => {
  db.all(`SELECT stationb, weight FROM fullroutes 
          WHERE stationa = ? ORDER BY stationb LIMIT 10`, [from],
    (err, rows) => {
      if (err) {
        console.err(err.message);
      }
      console.log(rows);
      rows.forEach((value) => {
        console.log('Name: ' + value.STATIONB);
      });
    }
  );  
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Closed HalfwayDB');
});

// https://stackoverflow.com/questions/19127650/defaultdict-equivalent-in-javascript
class DefaultDict {
  constructor(defaultInit) {
    return new Proxy({}, {
      get: (target, name) => name in target ?
        target[name] :
        (target[name] = typeof defaultInit === 'function' ?
          new defaultInit().valueOf() :
          defaultInit)
    })
  }
}
