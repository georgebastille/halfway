import React from 'react'

import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as SQLite from "expo-sqlite"

var db;

async function loadDatabase() {
  console.log("Method starting, Opening Database");
  if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
  }
  console.log("Copying db to app filesystem");
  await FileSystem.downloadAsync(
    Asset.fromModule(require('../assets/halfway.db')).uri,
    FileSystem.documentDirectory + 'SQLite/myDatabaseName.db'
  );
  console.log("Opening Database");
  return new Promise((resolve, _reject) => {
    SQLite.openDatabase('myDatabaseName.db', "", "", "", 
      dbo => {db = dbo; console.log("Database opened"); resolve();}
    )

  }) 
}


const getStationsAsync = async () => {
  return new Promise((resolve, reject) => {
    if (db == null) {
      console.log("Database is null");
    } else {
      console.log("Database is not null, type = " + typeof(db));
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
  console.log('About to queryDB');
  db.transaction( 
    tx => {
      sql = 'SELECT * FROM LINES;';
      console.log('Running DB Query');
      tx.executeSql(sql, null, (_, resultSet) => {
        console.log('Printing Results:');
        console.log(resultSet.rows.item(0));
        console.log('Done printing Results');
        success(resultSet);
      }, errortx);
    console.log('Done executing SQL');
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
    const sumVal = sum(places);
    const stdDevVal = standardDeviation(places);

    destinationObj = {name: name, sum: sumVal, stdDev: stdDevVal};
    sortableDestinations.push(destinationObj);
  }
  return sortableDestinations;
}

function fairestStation(startingFrom, callback) {
  const destinations = new DefaultDict(Array);
  const stationAs = ' stationa = ? OR'.repeat(startingFrom.length).slice(0, -2);

  let sql = `SELECT stationb, weight FROM fullroutes WHERE weight < 10000.0 AND (${stationAs})`;
  db.transaction( 
    tx => {
      tx.executeSql(sql, startingFrom, (_, resultSet) => {
        resultSet.rows.forEach((value) => {
          destinations[value.STATIONB].push(value.WEIGHT);
        });
        let sortable = processWeights(destinations);
        /*console.log("\nLowest Sum:");
        printTop(sortable, sumCompare);
        console.log("\nLowest Std Dev:");
        printTop(sortable, stdDevCompare);*/
        console.log(sortable);
        console.log('Done printing Results');
      }, errortx);
    console.log('Done executing SQL');
  }, error, null);
}

export const database = {
  fairestStation,
  getStationsAsync,
  loadDatabase
}
