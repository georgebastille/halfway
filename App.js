import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SQLite } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';


function results(tx, resultSet) {
  console.log('Printing Results:');
  console.log(resultSet.rows.item(0));
  console.log('Done printing Results');
}

function error(msg) {
  console.log('Error(msg):');
  console.log(msg);
}

function errortx(tx, msg) {
  console.log('Error(msg, tx):');
  console.log(msg);
}

function dump_sql(tx) {
  sql = 'SELECT * FROM LINES;';
  console.log('Running DB Query');
  tx.executeSql(sql, null, results, errortx);
  console.log('Done executing SQL');
}

function successCallback(result) {
  console.log('About to open db');
  const db = SQLite.openDatabase('halfway.db');
  console.log('Hello World!');
  db.transaction(dump_sql, error, null);
  console.log('Done with the DB, for now...');
};

export default function App() {
  // Load db from assets
  console.log('Before loading DB');
  FileSystem.downloadAsync(
    Expo.Asset.fromModule(require('./assets/halfway.db')).uri,
      `${FileSystem.documentDirectory}SQLite/halfway.db`
  ).then(successCallback, error);
  return (
    <View style={styles.container}>
      <Text>Monkey up App.js to start working on your app!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
