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

// https://derickbailey.com/2014/09/21/calculating-standard-deviation-with-array-map-and-array-reduce-in-javascript/
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

const from = ['ALE', 'GPK', 'LON'];
const destinations = new DefaultDict(Array);
const stationAs = ' stationa = ? OR'.repeat(from.length).slice(0, -2);

let sql = `SELECT stationb, weight FROM fullroutes WHERE ${stationAs}`;
console.log(from);

db.serialize(() => {
  db.all(sql, from,
    (err, rows) => {
      if (err) {
        console.err(err.message);
      }
      rows.forEach((value) => {
        destinations[value.STATIONB].push(value.WEIGHT);
      });
      let sortable = processWeights(destinations);
      console.log("\nLowest Sum:");
      printTop(sortable, sumCompare);
      console.log("\nLowest Std Dev:");
      printTop(sortable, stdDevCompare);
      //closeDB();
    }
  );  
});


function closeDB() {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed HalfwayDB');
  });
}


function printTop(values, comparator) {
  const sql = "SELECT name FROM stations WHERE code = ?";
  values.sort(comparator);
  for (let item of values.slice(0, 10)){
    db.get(sql, item.name, 
      (err, row) => {
        if (err) {
          console.log(err.message);
        }
        console.log(`${row.NAME}: ${item.sum} - ${item.stdDev}`);
      }
    );
  }
}

function sumCompare( a, b ) {
  if ( a.sum < b.sum ) {
    return -1;
  } else if ( a.sum > b.sum ) {
    return 1;
  } else {
    return 0;
  }
}

function stdDevCompare( a, b ) {
  if ( a.stdDev < b.stdDev ) {
    return -1;
  } else if ( a.stdDev > b.stdDev ) {
    return 1;
  } else {
    return 0;
  }
}

function processWeights(destinations) {
  sortableDestinations = [];
  for (let name in destinations) {
    const places = destinations[name];
    const sumVal = sum(places);
    const stdDevVal = standardDeviation(places);

    destinationObj = {name: name, sum: sumVal, stdDev: stdDevVal};
    sortableDestinations.push(destinationObj);
  }
  return sortableDestinations;
}
