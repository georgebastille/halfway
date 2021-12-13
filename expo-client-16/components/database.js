import React from 'react'

import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as SQLite from "expo-sqlite"

var db;

async function loadDatabase() {
  await FileSystem.deleteAsync(FileSystem.documentDirectory + 'SQLite');
  await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
  await FileSystem.downloadAsync(
    Asset.fromModule(require('../assets/halfway.db')).uri,
    FileSystem.documentDirectory + 'SQLite/myDatabaseName.db'
  );
  console.log("Opening Database");
  return new Promise((resolve, _reject) => {
    SQLite.openDatabase('myDatabaseName.db', "", "", "", 
      dbo => {
        db = dbo; 
        console.log("Database opened"); 
        resolve();
      }
    )
  }) 
}


const getStationsAsync = async () => {
  return new Promise((resolve, reject) => {
    if (db == null) {
      //console.log("Database is null");
    } else {
      //console.log("Database is not null, type = " + typeof(db));
    }
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM STATIONS;',
        [],
        (_, result) => { resolve(result) },
        (_, error) => { console.log("Error getting Stations from DB"); reject(error)}
      )
    })
  })
}

const getLines = (setLinesFunc) => {
  //console.log('About to queryDB');
  db.transaction( 
    tx => {
      sql = 'SELECT * FROM LINES;';
      //console.log('Running DB Query');
      tx.executeSql(sql, null, (_, resultSet) => {
        //console.log('Printing Results:');
        //console.log(resultSet.rows.item(0));
        //console.log('Done printing Results');
        success(resultSet);
      }, errortx);
    //console.log('Done executing SQL');
  }, error, null);
}

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

function processWeights(destinations) {
  sortableDestinations = [];
  for (let name in destinations) {
    const places = destinations[name];
    const meanVal = average(places);
    const stdDevVal = standardDeviation(places);

    destinationObj = {name: name, mean: meanVal, stdDev: stdDevVal, prod:(meanVal + 2 * stdDevVal)};
    sortableDestinations.push(destinationObj);
  }
  return sortableDestinations;
}

function meanCompare( a, b ) {
  if ( a.mean < b.mean ) {
    return -1;
  } else if ( a.mean > b.mean ) {
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

function prodCompare( a, b ) {
  if ( a.prod < b.prod ) {
    return -1;
  } else if ( a.prod > b.prod ) {
    return 1;
  } else {
    return 0;
  }
}


async function stationNameFromCode(code) {
  const sql = `SELECT name FROM stations WHERE code = "${code}"`;
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          sql, [],
          (_, resultSet) => {
            console.log("Name from code = ", resultSet.rows.item(0).NAME);
            resolve(resultSet.rows.item(0).NAME);
          },
          error => {reject(error)}
        )  
      },
      error => {reject(error)}
    );
  })
}

async function getTop(values, comparator, callback) {
  values.sort(comparator);
  console.log("Top 3 = ", values[0], values[1], values[2]);
  var result = "";
  for (var i = 0; i < 3; i++)
  {
    var option = values[i];
    var fullName = await stationNameFromCode(option.name);
    result += `${fullName}\n${(option.mean).toFixed(1)} +/- ${2 * option.stdDev.toFixed(1)} minutes\n\n`
  }
  callback(result);
}

function fairestStation(startingFrom, callback) {
  console.log("inside fairest station db code");
  const destinations = new DefaultDict(Array);
  const stationAs = ' stationa = ? OR'.repeat(startingFrom.length).slice(0, -2);

  let sql = `SELECT stationb, weight FROM fullroutes WHERE weight < 10000.0 AND (${stationAs})`;
  console.log(sql, startingFrom);
  db.transaction( 
    tx => {
      tx.executeSql(
          sql, 
          startingFrom, 
          (_, resultSet) => {
            //console.log(resultSet);
            for (let i = 0; i < resultSet.rows.length; i++) {
              row = resultSet.rows.item(i);
              destinations[row.STATIONB].push(row.WEIGHT);
            }
            let sortable = processWeights(destinations);
            getTop(sortable, prodCompare, topStations => {
              console.log('Top Stations = ', topStations); 
              callback(topStations);
            });
          }, 
          errortx => {console.log("Error with transaction:", errortx);})
      //console.log('Done executing SQL');
  }, error => {console.log("Error with transaction:", error);},
    null);
}

export const database = {
  fairestStation,
  getStationsAsync,
  loadDatabase
}
