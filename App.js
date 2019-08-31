import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View,
  Picker
} from 'react-native';
import { SQLite } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { AppLoading } from 'expo';


class HalfwayDB {
  constructor() {
    console.log('...about to open database...');
    this.db = SQLite.openDatabase('halfway.db');
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
    this.halfwayDB = new HalfwayDB();
    this.state = {
      isReady: false,
      textLabelText: 'Press Me!',
      lines: [],

    };
    // https://stackoverflow.com/questions/39705002/react-this2-setstate-is-not-a-function
    this.updateLabel = this.updateLabel.bind(this);
  }

  updateLabel(resultSet) {
    let lines = [];
    for (let i = 0; i < resultSet.rows.length; i++) {
      let row = resultSet.rows.item(i);
      lines.push({
        NAME: row.NAME,
        ID: row.ID,
      });
    }
    this.setState({
      textLabelText: resultSet.rows.item(0)['NAME'],
      lines: lines,
    });
  }

  _copyDatabaseFromAssets() {
    console.log('Loading Halfway DB...');
    return FileSystem.deleteAsync(
      `${FileSystem.documentDirectory}SQLite/`,
      {idempotent: true}
    ).then(() => {
    FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}SQLite/`
    )}).then(() => {
    FileSystem.downloadAsync(
      Expo.Asset.fromModule(require('./assets/halfway.db')).uri,
      `${FileSystem.documentDirectory}SQLite/halfway.db`
    )})
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
          startAsync={this._copyDatabaseFromAssets}
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
