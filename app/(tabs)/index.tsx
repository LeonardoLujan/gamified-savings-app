import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Image,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { doc, getDoc, onSnapshot,  } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig'; // adjust if path differs

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [points, setPoints] = React.useState(0);
  const [receipts, setReceipts] = React.useState<any[]>([]);


  const COLORS = {
    background: isDark ? '#1a1a1a' : '#FFFFFF',
    primary: isDark ? '#CFC493' : '#006747',
    text: isDark ? '#FFFFFF' : '#006747',
    receiptBorder: isDark ? '#444' : '#ccc',
    buttonText: '#FFFFFF',
  };

  // ✅ Log out function
  const signOut = async () => {
    await AsyncStorage.removeItem('studentID');
    router.replace('/login');
  };

  useEffect(() => {
    const setupRealtimeListener = async () => {
      const studentID = await AsyncStorage.getItem('studentID');
      if (!studentID) {
        router.replace('/login');
        return;
      }
  
      const userRef = doc(db, 'users', studentID);
  
      // 🧠 Real-time Firestore listener
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPoints(data.rewardPoints || 0);
          setReceipts(data.receipts || []);
          console.log("📡 Points & receipts updated in real time");
        }
      });
      
  
      // 🧼 Clean up listener when component unmounts
      return () => unsubscribe();
    };
  
    setupRealtimeListener();
  }, []);
  

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { backgroundColor: COLORS.background, opacity: fadeAnim }]}>

      {/* ✅ Sign Out Button Top Left */}
      <View style={styles.bottomRightBar}>
        <Pressable onPress={signOut}>
          <Text style={[styles.signOutText, { color: COLORS.primary }]}>Sign Out</Text>
        </Pressable>
      </View>

      {/* Points Display */}
      <View style={[styles.pointsContainer, { backgroundColor: COLORS.background }]}>
        <Text style={[styles.pointsText, { color: COLORS.primary }]}>{points} pts</Text>
        <Ionicons name="trophy-outline" size={22} color={COLORS.primary} />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Image
          source={require('../../assets/images/rocky2.png')}
          style={{
            width: 160,
            height: 160,
            resizeMode: 'contain',
            marginBottom: 20,
          }}
        />

        <Text style={[styles.title, { color: COLORS.text }]}>Welcome to SaveABull 💶!</Text>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.toggleButton, { borderColor: COLORS.primary }]}>
          <Ionicons name="contrast-outline" size={18} color={COLORS.primary} />
          <Text style={[styles.toggleText, { color: COLORS.primary }]}>
            {isDark ? 'Light' : 'Dark'} Mode
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
        <TouchableOpacity
  style={[styles.button, { backgroundColor: COLORS.primary }]}
  onPress={() => router.push('/camera')}
>
  <Ionicons name="camera" size={20} color={COLORS.buttonText} />
  <Text style={styles.buttonText}>Scan Receipt</Text>
</TouchableOpacity>


          <TouchableOpacity
            style={[styles.button, { backgroundColor: COLORS.primary }]}
            onPress={() => router.push('/explore')}
          >
            <Ionicons name="gift-outline" size={20} color={COLORS.buttonText} />
            <Text style={styles.buttonText}>Redeem Points</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.receiptsSection}>
          <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Your Recent Receipts</Text>
          <ScrollView style={styles.receiptsList}>
            {receipts.length > 0 ? (
              receipts.slice(-3).reverse().map((receipt, index) => (
               <Text
                  key={index}
                  style={[styles.receiptItem, { color: COLORS.text, borderBottomColor: COLORS.receiptBorder }]}
                >
               📄 {receipt.date.substring(0,10)} - {receipt.merchant} – ${parseFloat(receipt.total).toFixed(2)}
                </Text>
           ))
) : (
  <Text style={{ color: COLORS.text }}>No receipts yet</Text>
)}

          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    position: 'relative',
  },
  bottomRightBar: {
    position: 'absolute',
    bottom: 90, // just above the tab bar
    right: 20,
    zIndex: 10,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  pointsContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 30,
  },
  toggleText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  receiptsSection: {
    width: '100%',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'left',
  },
  receiptsList: {
    maxHeight: 160,
    paddingHorizontal: 5,
  },
  receiptItem: {
    fontSize: 16,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
});
