import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View,
  TouchableOpacity
} from 'react-native';
import { SQLite } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

let db = null



function error(msg) {
  console.log('Error(msg):');
  console.log(msg);
}

function errortx(tx, msg) {
  console.log('Error(msg, tx):');
  console.log(msg);
}


function successCallback(result) {
  console.log('About to open db');
  db = SQLite.openDatabase('halfway.db');
  console.log('DB opened');
};


export default class App extends React.Component {
  state = {
    textLabelText: 'Press Me!'
  };

  _queryDB() {
    console.log(db);
    console.log('About to queryDB');
    db.transaction(
      tx => {
        sql = 'SELECT * FROM LINES;';
        console.log('Running DB Query');
        tx.executeSql(sql, null, 
          (tx, resultSet) => {
            console.log('Printing Results:');
            console.log(resultSet.rows.item(0));
            //this.setState.bind({textLabelText: resultSet.rows.item(0)});
            console.log('Done printing Results');
            console.log('And updating label');
          }, errortx);
        console.log('Done executing SQL');
      } , error, null);
    console.log('Done with the DB, for now...');
  }

  componentDidMount() { 
    // Load db from assets
    console.log('Before loading DB');
    FileSystem.downloadAsync(
      Expo.Asset.fromModule(require('./assets/halfway.db')).uri,
        `${FileSystem.documentDirectory}SQLite/halfway.db`
    ).then(successCallback, error);
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._queryDB}>
          <Text>{this.state.textLabelText}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
