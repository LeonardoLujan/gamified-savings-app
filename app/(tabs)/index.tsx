import { Image, View, Text, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';


export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Add any content here later */}
      <Text>Hell world</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,               // Take full screen height
    backgroundColor: '#ffffff',  // Pure white background
    alignItems: 'center',  // Optional: center content horizontally
    justifyContent: 'center' // Optional: center content vertically
  }
});