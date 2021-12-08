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


const getLinesAsync = async () => {
  return new Promise((resolve, reject) => {
    if (db == null) {
      console.log("Database is null");
    } else {
      console.log("Database is not null, type = " + typeof(db));
    }
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM LINES;',
        [],
        (_, result) => { resolve(result) },
        (_, error) => { console.log("Error getting Lines from DB"); reject(error)}
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
export const database = {
  getLinesAsync,
  loadDatabase
}
