console.log("Hello there World!");
const sqlite3 = require('sqlite3').verbose();

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

function standardDeviation(values) {
  var avg = average(values);
  
  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });
  
  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data) {
  var sumVal = sum(data);
  var avg = sumVal / data.length;
  return avg;
}

function sum(data) {
  return data.reduce(function(sum, value){
    return sum + value;
  }, 0);
}

const db = new sqlite3.Database(
    './halfway.db', 
    sqlite3.OPEN_READONLY, 
    (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to HalfwayDB');
});

const from = ['ANG', 'LSQ'];
const destinations = new DefaultDict(Array);
const stationAs = ' stationa = ? OR'.repeat(from.length).slice(0, -2);

let sql = `SELECT stationb, weight FROM fullroutes WHERE ${stationAs}`;
console.log(sql);

db.serialize(() => {
  db.all(sql, from,
    (err, rows) => {
      if (err) {
        console.err(err.message);
      }
      rows.forEach((value) => {
        destinations[value.STATIONB].push(value.WEIGHT);
      });
      for (let destination in destinations) {
        let places = destinations[destination]
        console.log(`${destination}: 
          ${places} 
          Sum: ${sum(places)} 
          Std Dev: ${standardDeviation(places)}`);
      }
    }
  );  
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Closed HalfwayDB');
});

