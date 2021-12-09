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
      fairestStationLabel: 'Meet at: KINGS CROSS',
      lines: [],
      stations: [],
      selectedStation1: null,
      selectedStation2: null,
      selectedStation3: null,

  };

  // https://stackoverflow.com/questions/39705002/react-this2-setstate-is-not-a-function
  this.updateLabel = this.updateLabel.bind(this);
  this.initialise = this.initialise.bind(this);
  this.determineFairest = this.determineFairest.bind(this);
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
      fairestStationLabel: resultSet.rows.item(0)['NAME'],
    });
  }

  async initialise() {
    console.log('Loading Halfway DB...');
    await database.loadDatabase();
    this.saveStations(await database.getStationsAsync());
    console.log('done Loading Halfway DB');
  }

  determineFairest(callback) {
    let startingFrom = [];
    console.log(this.state.selectedStation1);
    if (this.state.selectedStation1 != null) {
      startingFrom.push(this.state.selectedStation1.ID);
    }
    callback("Richie Rules w00t");


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
          style={{height: 50, width:300}}
          selectedValue={this.state.selectedStation1}
          onValueChange={(value, _index) => {
              console.log(value, _index); 
              this.setState({selectedStation1: value}, () => 
                this.determineFairest(fairest => this.state.fairestStationLabel = fairest))
            }
          }>
          {this.state.stations.map((line, id) => 
            <Picker.Item label={line.NAME} value={line.ID} key={id}/>
          )}
        </Picker>
        <Picker
          style={{height: 50, width:300}}
          selectedValue={this.state.selectedStation2}
          onValueChange={(value, _index) => {
              console.log(value, _index); 
              this.setState({selectedStation2: value})
              this.determineFairest(fairest => this.state.fairestStationLabel = fairest)
            }
          }>
          {this.state.stations.map((line, id) => 
            <Picker.Item label={line.NAME} value={line.ID} key={id}/>
          )}
        </Picker>
        <Picker
          style={{height: 50, width:300}}
          selectedValue={this.state.selectedStation3}
          onValueChange={(value, _index) => {
              console.log(value, _index); 
              this.setState({selectedStation3: value})
              this.determineFairest(fairest => this.state.fairestStationLabel = fairest)
            }
          }>
          {this.state.stations.map((line, id) => 
            <Picker.Item label={line.NAME} value={line.ID} key={id}/>
          )}
        </Picker>
        <Text>
          {this.state.fairestStationLabel}
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
