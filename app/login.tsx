import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [studentID, setStudentID] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const trimmedID = studentID.trim();

    if (!trimmedID || !password) {
      Alert.alert('Missing Info', 'Please enter both Student ID and Password');
      return;
    }

    const docRef = doc(db, 'users', trimmedID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const storedPassword = docSnap.data().password;
      if (storedPassword === password) {
        await AsyncStorage.setItem('studentID', trimmedID);
        router.replace('/');
      } else {
        Alert.alert('Login Failed', 'Incorrect password');
      }
    } else {
      await setDoc(docRef, {
        studentID: trimmedID,
        password,
        categoryTotals: {},
        receipts: [],
        rewardPoints: 600,
      });

      await AsyncStorage.setItem('studentID', trimmedID);
      Alert.alert('Account Created', 'Welcome to SaveHero!');
      router.replace('/');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Log In or Sign Up</Text>

          <TextInput
            style={styles.input}
            placeholder="Student ID"
            placeholderTextColor="#888"
            value={studentID}
            onChangeText={setStudentID}
            autoCapitalize="characters"
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Continue"
              onPress={handleLogin}
              disabled={!studentID || !password}
              color={studentID && password ? '#006747' : '#999'}
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000', // match dark theme
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#CFC493',
    marginBottom: 24,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#CFC493',
    color: '#fff',
    marginBottom: 24,
    paddingVertical: 8,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 12,
  },
});
