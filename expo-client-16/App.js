import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AppLoading from "expo-app-loading";
import { StatusBar } from "expo-status-bar";
import { database } from "./components/database";

function error(msg) {
  console.log("Error(msg):");
  console.error(msg);
}

function errortx(tx, msg) {
  console.log("Error(msg, tx):");
  console.error(msg);
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isReady: false,
      fairestStationLabel: "Select Stations",
      stations: [],
      selectedStation1: null,
      selectedStation2: null,
      selectedStation3: null,
    };

    // https://stackoverflow.com/questions/39705002/react-this2-setstate-is-not-a-function
    this.initialise = this.initialise.bind(this);
    this.determineFairest = this.determineFairest.bind(this);
  }

  async initialise() {
    console.log("Loading Halfway DB...");
    await database.loadDatabase();
    this.saveStations(await database.getStationsAsync());
    console.log("done Loading Halfway DB");
  }

  saveStations(resultSet) {
    let stations = [];
    stations.push({ NAME: "---", ID: null });
    for (let i = 0; i < resultSet.rows.length; i++) {
      let row = resultSet.rows.item(i);
      stations.push({
        NAME: row.NAME,
        ID: row.CODE,
      });
    }
    stations.sort((a, b) => {
      if (a.NAME < b.NAME) {
        return -1;
      }
      if (a.NAME > b.NAME) {
        return 1;
      }
      return 0;
    });
    this.setState({
      stations: stations,
    });
  }

  determineFairest(callback) {
    let startingFrom = [];
    if (this.state.selectedStation1 != null) {
      startingFrom.push(this.state.selectedStation1);
    }
    if (this.state.selectedStation2 != null) {
      startingFrom.push(this.state.selectedStation2);
    }
    if (this.state.selectedStation3 != null) {
      startingFrom.push(this.state.selectedStation3);
    }
    database.fairestStation(startingFrom, callback);
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
          onFinish={() => this.setState({ isReady: true })}
          onError={console.warn}
        />
      );
    }
    return (
      <View style={styles.container}>
        <Text style={styles.titleText}>Halfway</Text>
        <View style={styles.pickerView}>
          <Picker
            style={styles.pickerStyle}
            selectedValue={this.state.selectedStation1}
            onValueChange={(value, _index) => {
              console.log(value, _index);
              this.setState({ selectedStation1: value }, () =>
                this.determineFairest((fairest) =>
                  this.setState({ fairestStationLabel: fairest })
                )
              );
            }}
          >
            {this.state.stations.map((line, id) => (
              <Picker.Item label={line.NAME} value={line.ID} key={id} />
            ))}
          </Picker>
        </View>
        <View style={styles.pickerView}>
          <Picker
            style={styles.pickerStyle}
            selectedValue={this.state.selectedStation2}
            onValueChange={(value, _index) => {
              console.log(value, _index);
              this.setState({ selectedStation2: value }, () =>
                this.determineFairest((fairest) =>
                  this.setState({ fairestStationLabel: fairest })
                )
              );
            }}
          >
            {this.state.stations.map((line, id) => (
              <Picker.Item label={line.NAME} value={line.ID} key={id} />
            ))}
          </Picker>
        </View>
        <View style={styles.pickerView}>
          <Picker
            style={styles.pickerStyle}
            selectedValue={this.state.selectedStation3}
            onValueChange={(value, _index) => {
              console.log(value, _index);
              this.setState({ selectedStation3: value }, () =>
                this.determineFairest((fairest) =>
                  this.setState({ fairestStationLabel: fairest })
                )
              );
            }}
          >
            {this.state.stations.map((line, id) => (
              <Picker.Item label={line.NAME} value={line.ID} key={id} />
            ))}
          </Picker>
        </View>
        <Text style={styles.paddingText}> </Text>
        <Text style={styles.resultText}>{this.state.fairestStationLabel}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 60,
    fontWeight: "bold",
    height: 120,
  },
  resultText: {
    fontSize: 20,
    textAlign: "center", // <-- the magic
    height: 200,
  },
  pickerView: {
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 4,
    marginBottom: 5,
  },
  pickerStyle: {
    height: 50,
    width: 300,
  },
  paddingText: {
    height: 50,
  },
});
