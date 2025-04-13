// CameraScreen.tsx
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../lib/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const GOOGLE_VISION_API_KEY = 'AIzaSyAG7bG1yg7lQ0V61C6j6kwH0FdIeEKoXF0';

const convertToBase64 = async (uri: string) => {
  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState<{ merchant: string; total: string; date: string } | null>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('We need access to your photo library to select images.');
      }
    })();
  }, []);

  const extractTextFromImageWithVisionApi = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      const base64Image = await convertToBase64(imageUri);
      const body = {
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      };

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();
      const text = result.responses?.[0]?.fullTextAnnotation?.text || 'No text found';
      setExtractedText(text);
      await parseReceiptData(text);
    } catch (error) {
      console.error('❌ Vision API Error:', error);
      setExtractedText('Failed to extract text from image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseReceiptData = async (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let total = 'Not found';
    let date = 'Not found';
    let merchant = lines[0] || 'Not found';
    let largestAmount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/\btotal\b/i.test(line)) {
        const match = line.match(/\$\s?\d{1,5}(\.\d{2})?/);
        if (match) {
          total = match[0].replace(/\s/g, '');
          break;
        }
        const nextLine = lines[i + 1];
        if (nextLine) {
          const nextMatch = nextLine.match(/\$\s?\d{1,5}(\.\d{2})?/);
          if (nextMatch) {
            total = nextMatch[0].replace(/\s/g, '');
            break;
          }
        }
      }
      const allMatches = line.match(/\$\s?\d{1,5}(\.\d{2})?/g);
      if (allMatches) {
        for (const match of allMatches) {
          const amount = parseFloat(match.replace('$', '').replace(/\s/g, ''));
          if (!isNaN(amount) && amount > largestAmount) {
            largestAmount = amount;
          }
        }
      }
      if (date === 'Not found') {
        const dateMatch = line.match(/\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Z][a-z]+ \d{1,2}, \d{4})\b/);
        if (dateMatch) {
          date = dateMatch[0];
        }
      }
    }
    if (total === 'Not found' && largestAmount > 0) {
      total = `$${largestAmount.toFixed(2)}`;
    }
    setReceiptInfo({ merchant, total, date });
  };

  const submitReceiptToFirebase = async () => {
    if (!receiptInfo) return;

    try {
      const studentID = await AsyncStorage.getItem('studentID');
      if (!studentID) throw new Error('Missing student ID');

      const numericTotal = parseFloat(receiptInfo.total.replace('$', ''));
      let parsedDate: Date | null = null;
      if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(receiptInfo.date)) {
        const [month, day, year] = receiptInfo.date.split('/');
        const fullYear = year.length === 2 ? `20${year}` : year;
        parsedDate = new Date(`${fullYear}-${month}-${day}`);
      } else {
        const tryDate = new Date(receiptInfo.date);
        if (!isNaN(tryDate.getTime())) parsedDate = tryDate;
      }

      const userRef = doc(db, 'users', studentID);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error('User not found');

      const userData = userSnap.data();
      const receipts = userData.receipts || [];
      const currentPoints = userData.rewardPoints || 0;

      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(now.getDate() - 14);

      const lastWeekReceipts = receipts.filter((r: any) => {
        const rDate = new Date(r.date);
        return rDate >= fourteenDaysAgo && rDate < sevenDaysAgo;
      });

      const lastWeekAvg = lastWeekReceipts.length > 0
        ? lastWeekReceipts.reduce((sum: number, r: any) => sum + parseFloat(r.total), 0) / lastWeekReceipts.length
        : null;

      if (lastWeekAvg !== null) {
        console.log(`📊 Last week's average: $${lastWeekAvg.toFixed(2)}`);
      }

      let newPoints = currentPoints;
      let bonusPoints = 0;

      if (lastWeekAvg !== null && numericTotal < lastWeekAvg) {
        const dollarsSaved = Math.floor(lastWeekAvg - numericTotal);
        bonusPoints = dollarsSaved * 10;
        newPoints += bonusPoints;
        console.log(`🎉 Earned ${bonusPoints} pts for saving $${dollarsSaved}`);
      }

      await updateDoc(userRef, {
        rewardPoints: newPoints,
        receipts: arrayUnion({
          merchant: receiptInfo.merchant,
          total: numericTotal.toFixed(2),
          date: parsedDate?.toISOString() || null,
        }),
      });

      if (bonusPoints > 0) {
        Alert.alert('✅ Points updated', `You earned ${bonusPoints} reward points!`);
      }

      console.log('✅ Receipt submitted and user updated');
      resetCamera();
    } catch (err) {
      console.error('❌ Failed to submit receipt:', err);
    }
  };


  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      if (photo.uri) {
        setCapturedImage(photo.uri);
        await extractTextFromImageWithVisionApi(photo.uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      setExtractedText("Failed to take picture.");
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length) {
        setCapturedImage(result.assets[0].uri);
        await extractTextFromImageWithVisionApi(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setExtractedText('');
    setReceiptInfo(null);
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.resultContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.textResultContainer}>
            <Text style={styles.resultTitle}>Receipt Text:</Text>
            <Text style={styles.extractedText}>{extractedText || 'No text was detected in the image.'}</Text>
          </View>
        </ScrollView>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={resetCamera}>
            <Text style={styles.text}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: 'green' }]} onPress={submitReceiptToFirebase}>
            <Text style={styles.text}>Submit</Text>
          </TouchableOpacity>
        </View>
        {receiptInfo && (
          <View style={{ marginTop: 16 }}>
            <Text>🛒 Merchant: {receiptInfo.merchant}</Text>
            <Text>📅 Date: {receiptInfo.date}</Text>
            <Text>💵 Total: {receiptInfo.total}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
            <Text style={styles.text}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.captureButton]} onPress={takePicture}>
            <Text style={styles.text}>Capture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.text}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 20,
  },
  captureButton: {
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,0,0,0.6)',
  },
  text: { fontSize: 16, color: 'white' },
  message: { textAlign: 'center', padding: 10 },
  previewImage: { width: '100%', height: 300, resizeMode: 'contain' },
  resultContainer: { flex: 1, padding: 16 },
  textResultContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  extractedText: { fontSize: 16, lineHeight: 22 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: { color: '#ffffff', marginTop: 10, fontSize: 16 },
});