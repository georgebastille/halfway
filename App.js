import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  console.log('Hello World!');
  return (
    <View style={styles.container}>
      <Text>Ramp up App.js to start working on your app!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
