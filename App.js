import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View
} from 'react-native';
import { SQLite } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';


class HalfwayDB {
  constructor() {
    console.log('Loading Halfway DB...');
    FileSystem.downloadAsync(
      Expo.Asset.fromModule(require('./assets/halfway.db')).uri,
        `${FileSystem.documentDirectory}SQLite/halfway.db`
    ).then(() => { 
      this.db = SQLite.openDatabase('halfway.db');
      console.log('...done loading Halfway DB');
    }, error);
  }

  getLines(success) {
    console.log('About to queryDB');
    this.db.transaction( tx => {
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
}

function error(msg) {
  console.log('Error(msg):');
  console.log(msg);
}

function errortx(tx, msg) {
  console.log('Error(msg, tx):');
  console.log(msg);
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.halfwayDB = new HalfwayDB();
    this.state = {
      textLabelText: 'Press Me!'
    };
    // https://stackoverflow.com/questions/39705002/react-this2-setstate-is-not-a-function
    this.updateLabel = this.updateLabel.bind(this);
  }

  updateLabel(resultSet) {
    this.setState({textLabelText: resultSet.rows.item(0)['NAME']});
  }

  // Subtle difference between these two onPress calls.
  // Arrow functions keep the 'this' reference of the parent
  // wheras using a function variable uses the this of the 
  // 'Text' object.
  //<Text onPress={() => this._queryDB()}>
  //<Text onPress={this._queryDB}>

  render() {
    return (
      <View style={styles.container}>
        <Text onPress={() => this.halfwayDB.getLines(this.updateLabel)}> 
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
