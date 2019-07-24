import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View
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
  constructor(props) {
    super(props);
    this.state = {
      textLabelText: 'Press Me!'
    };
    // https://stackoverflow.com/questions/39705002/react-this2-setstate-is-not-a-function
    this._queryDB = this._queryDB.bind(this);
  }

  _queryDB() {
    console.log('About to queryDB');
    console.log(this);
    db.transaction( tx => {
        sql = 'SELECT * FROM LINES;';
        console.log('Running DB Query');
        tx.executeSql(sql, null, 
          (_, resultSet) => {
            console.log('Printing Results:');
            console.log(resultSet.rows.item(0));
            this.setState({textLabelText: resultSet.rows.item(0)['NAME']});
            console.log('Done printing Results');
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
        <Text onPress={this._queryDB}>
          {this.state.textLabelText}
        </Text>
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
