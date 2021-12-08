import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';



async function openDatabase() {
  if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
  }
  await FileSystem.downloadAsync(
    Asset.fromModule(require('./assets/halfway.db')).uri,
    FileSystem.documentDirectory + 'SQLite/myDatabaseName.db'
  );
  return SQLite.openDatabase('myDatabaseName.db', "", "", "", db => {
      console.log("Crazy Callbacks");
      console.log('About to queryDB');
      db.transaction( tx => {
        sql = 'SELECT * FROM LINES;';
        console.log('Running DB Query');
        tx.executeSql(sql, null, (_, resultSet) => {
          console.log('Printing Results:');
          console.log(resultSet.rows.item(0));
          console.log('Done printing Results');
          callback(resultSet);
        }, null);
        console.log('Done executing SQL');
      }, null, null);
    });
}

const db = openDatabase();

export default function App() {
    db.transaction( tx => {
      sql = 'SELECT * FROM LINES;';
      console.log('Running DB Query');
      tx.executeSql(sql, null, (_, resultSet) => {
        console.log('Printing Results:');
        console.log(resultSet.rows.item(0));
        console.log('Done printing Results');
        callback(resultSet);
      }, null);
      console.log('Done executing SQL');
    }, null, null);


  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
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
