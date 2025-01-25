import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { database } from "../components/database";

interface Station {
  NAME: string;
  ID: string | null;
}

interface AppState {
  isReady: boolean;
  fairestStationLabel: string;
  stations: Station[];
  selectedStation1: string | null;
  selectedStation2: string | null;
  selectedStation3: string | null;
}

export default class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      isReady: false,
      fairestStationLabel: "Select Stations",
      stations: [],
      selectedStation1: null,
      selectedStation2: null,
      selectedStation3: null,
    };
  }

  componentDidMount() {
    this.initialise();
  }

  private async initialise(): Promise<void> {
    try {
      console.log("Loading Halfway DB...");
      await database.loadDatabase();
      const stations = await database.getStationsAsync();
      this.saveStations(stations);
      console.log("Done loading Halfway DB");
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  }

  private saveStations(resultSet: {
    rows: { length: number; item: (index: number) => any };
  }): void {
    const stations: Station[] = [{ NAME: "---", ID: null }];

    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      stations.push({
        NAME: row.NAME,
        ID: row.CODE,
      });
    }

    stations.sort((a, b) => a.NAME.localeCompare(b.NAME));

    this.setState({ stations });
  }

  private determineFairest = (callback: (fairest: any) => void): void => {
    const startingFrom = [
      this.state.selectedStation1,
      this.state.selectedStation2,
      this.state.selectedStation3,
    ].filter((station) => station !== null);

    database.fairestStation(startingFrom, callback);
  };

  private handleStationChange = (
    stationNumber: 1 | 2 | 3,
    value: string,
  ): void => {
    const stateKey = `selectedStation${stationNumber}` as const;

    this.setState({ [stateKey]: value }, () =>
      this.determineFairest((fairest) =>
        this.setState({ fairestStationLabel: fairest }),
      ),
    );
  };

  private renderPicker = (stationNumber: 1 | 2 | 3): React.ReactElement => {
    const stateKey = `selectedStation${stationNumber}` as const;

    return (
      <View style={styles.pickerView}>
        <Picker
          style={styles.pickerStyle}
          selectedValue={this.state[stateKey]}
          onValueChange={(value) =>
            this.handleStationChange(stationNumber, value)
          }
        >
          {this.state.stations.map((station, index) => (
            <Picker.Item
              label={station.NAME}
              value={station.ID}
              key={`station-${index}`}
            />
          ))}
        </Picker>
      </View>
    );
  };

  render(): React.ReactElement {
    return (
      <View style={styles.container}>
        <Text style={styles.titleText}>Halfway</Text>
        {this.renderPicker(1)}
        {this.renderPicker(2)}
        {this.renderPicker(3)}
        <Text style={styles.paddingText}> </Text>
        <Text style={styles.resultText}>{this.state.fairestStationLabel}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 0,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  titleText: {
    fontSize: 60,
    fontWeight: "bold",
    height: 120,
  },
  resultText: {
    fontSize: 20,
    textAlign: "center",
    height: 200,
  },
  pickerView: {},
  pickerStyle: {
    height: 100,
    width: 300,
  },
  paddingText: {},
});
