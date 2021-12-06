import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View,
  Picker
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import AppLoading from 'expo-app-loading';
import { Asset } from 'expo-asset';


class HalfwayDB {
  constructor(callback) {
    console.log('...about to open database...');
    this.db = SQLite.openDatabase('halfway.db', "", "", "", db => {
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
        }, errortx);
        console.log('Done executing SQL');
      }, error, null);
    });
    console.log('...done opening Halfway DB');
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
  console.error(msg);
}

function errortx(tx, msg) {
  console.log('Error(msg, tx):');
  console.error(msg);
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isReady: false,
      textLabelText: 'Press Me!',
      lines: [],

    };
    // https://stackoverflow.com/questions/39705002/react-this2-setstate-is-not-a-function
    this.updateLabel = this.updateLabel.bind(this);
    this.initialise = this.initialise.bind(this);
  }

  saveLines(resultSet) {
    let lines = [];
    for (let i = 0; i < resultSet.rows.length; i++) {
      let row = resultSet.rows.item(i);
      lines.push({
        NAME: row.NAME,
        ID: row.ID,
      });
    }
    this.setState({
      lines: lines,
    });
  }

  updateLabel(resultSet) {
    this.setState({
      textLabelText: resultSet.rows.item(0)['NAME'],
    });
  }

  initialise() {
    console.log('Loading Halfway DB...');
    return FileSystem.deleteAsync(
      `${FileSystem.documentDirectory}SQLite/`,
      {idempotent: true}
    ).then(() => {
    FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}SQLite/`
    )}).then(() => {
    FileSystem.downloadAsync(
      Asset.fromModule(require('./assets/halfway.db')).uri,
      `${FileSystem.documentDirectory}SQLite/halfway.db`
    )}).then(() => {
       this.halfwayDB = new HalfwayDB(this.saveLines);
    })
  }


  // Subtle difference between these two onPress calls.
  // Arrow functions keep the 'this' reference of the parent
  // wheras using a function variable uses the this of the 
  // 'Text' object.
  //<Text onPress={() => this._queryDB()}>
  //<Text onPress={this._queryDB}>

  render() {
    if (!this.state.isReady) {
      return (
        <AppLoading
          startAsync={this.initialise}
          onFinish={() => this.setState({ isReady:true })}
          onError={console.warn}
        />
      );
    }
    return (
      <View style={styles.container}>
        <Picker
          style={{height: 50, width:200}}
          selectedValue={this.state.selectedLine}
          onValueChange={(value, _) => this.setState({selectedLine: value})}>
          {this.state.lines.map((line, id) => 
            <Picker.Item label={line.NAME} value={line.ID} key={id}/>
          )}
        </Picker>
        <Text>
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
