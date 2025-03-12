// halfway/expo-client-25/components/AutocompleteInput.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AutocompleteDropdown } from "react-native-autocomplete-dropdown";

interface Station {
  NAME: string;
  ID: string | null;
}

interface AutocompleteInputProps {
  stations: Station[];
  onSelect: (stationId: string | null) => void;
  label: string;
  value: string | null;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  stations,
  onSelect,
  label,
  value,
}) => {
  // Filter out stations with null IDs and map to the required format
  const dropdownData = stations
    .filter((station) => station.ID !== null)
    .map((station) => ({
      id: station.ID!,
      title: station.NAME,
    }));

  // Find the initial value object if value exists
  const initialValueObject = value
    ? dropdownData.find((item) => item.id === value)
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <AutocompleteDropdown
        clearOnFocus={false}
        closeOnBlur={true}
        closeOnSubmit={false}
        initialValue={initialValueObject || { id: "", title: "" }}
        onSelectItem={(item) => onSelect(item ? item.id : null)}
        dataSet={dropdownData}
        textInputProps={{
          placeholder: "Select station",
          style: styles.inputText,
        }}
        inputContainerStyle={styles.inputContainer}
        suggestionsListContainerStyle={styles.suggestionsContainer}
        containerStyle={styles.dropdownContainer}
        rightButtonsContainerStyle={styles.rightButtonsContainer}
        suggestionsListTextStyle={styles.suggestionText}
        emptyResultText="No stations found"
        showClear={true}
        useFilter={true}
        debounce={300}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333333",
  },
  dropdownContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
  inputContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputText: {
    color: "#333333",
    fontSize: 16,
    paddingLeft: 12,
  },
  suggestionsContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginTop: 5,
  },
  suggestionText: {
    color: "#333333",
    fontSize: 16,
  },
  rightButtonsContainer: {
    right: 8,
    height: 30,
    alignSelf: "center",
  },
});

export default AutocompleteInput;
