import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';

import * as SQLite from 'expo-sqlite';
import AppLoading from 'expo-app-loading';
import {database} from './components/database'


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
      stations: [],
      selectedStation: null
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

  saveStations(resultSet) {
    let stations = [];
    for (let i = 0; i < resultSet.rows.length; i++) {
      let row = resultSet.rows.item(i);
      stations.push({
        NAME: row.NAME,
        ID: row.CODE,
      });
    }
    this.setState({
      stations: stations
    });
  }

  updateLabel(resultSet) {
    this.setState({
      textLabelText: resultSet.rows.item(0)['NAME'],
    });
  }

  async initialise() {
    console.log('Loading Halfway DB...');
    await database.loadDatabase();
    this.saveStations(await database.getStationsAsync());
    console.log('done Loading Halfway DB');
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
          selectedValue={this.state.selectedStation}
          onValueChange={(value, _) => this.setState({selectedStation: value})}>
          {this.state.stations.map((line, id) => 
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
