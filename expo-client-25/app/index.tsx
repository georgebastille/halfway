// halfway/expo-client-25/app/index.tsx
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { database } from "../components/database";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import AutocompleteInput from "../components/AutocompleteInput";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";

const { width } = Dimensions.get("window");

interface Station {
  NAME: string;
  ID: string | null;
}

interface AppState {
  isLoading: boolean;
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
      isLoading: true,
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
      this.setState({ isLoading: false });
      console.log("Done loading Halfway DB");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      this.setState({ isLoading: false });
    }
  }

  private saveStations(resultSet: {
    rows: { length: number; item: (index: number) => any };
  }): void {
    const stations: Station[] = []; // Remove the initial null station
    for (const row of resultSet) {
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
    value: string | null,
  ): void => {
    const stateKey = `selectedStation${stationNumber}` as const;

    this.setState({ [stateKey]: value }, () =>
      this.determineFairest((fairest) =>
        this.setState({ fairestStationLabel: fairest }),
      ),
    );
  };

  private renderAutocomplete = (
    stationNumber: 1 | 2 | 3,
  ): React.ReactElement => {
    const stateKey = `selectedStation${stationNumber}` as const;

    return (
      <AutocompleteInput
        stations={this.state.stations}
        onSelect={(value) => this.handleStationChange(stationNumber, value)}
        label={`Starting Point ${stationNumber}`}
        value={this.state[stateKey]}
      />
    );
  };

  private resetSelections = () => {
    this.setState({
      selectedStation1: null,
      selectedStation2: null,
      selectedStation3: null,
      fairestStationLabel: "Select Stations",
    });
  };

  render(): React.ReactElement {
    if (this.state.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading stations...</Text>
        </View>
      );
    }

    return (
      <AutocompleteDropdownContextProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.titleText}>Halfway</Text>
              <Text style={styles.subtitleText}>
                Find the perfect meeting point
              </Text>
            </View>

            {this.renderAutocomplete(1)}
            {this.renderAutocomplete(2)}
            {this.renderAutocomplete(3)}

            <TouchableOpacity
              style={styles.resetButton}
              onPress={this.resetSelections}
            >
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text style={styles.resetButtonText}>Reset Selections</Text>
            </TouchableOpacity>

            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Meeting Point:</Text>
              <Text style={styles.resultText}>
                {this.state.fairestStationLabel}
              </Text>
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </AutocompleteDropdownContextProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#0066CC",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  titleText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: "#666666",
  },
  resetButton: {
    flexDirection: "row",
    backgroundColor: "#0066CC",
    padding: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  resetButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  resultContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 10,
  },
  resultText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0066CC",
    textAlign: "center",
  },
});
