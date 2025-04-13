// lib/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCQssULHqMBojIBwS8g0_WUh8NcGqrG_Gs',
  authDomain: 'finsaveapp.firebaseapp.com',
  projectId: 'finsaveapp',
  storageBucket: 'finsaveapp.appspot.com',
  messagingSenderId: '76566589035',
  appId: '1:76566589035:web:f2d30dce90806e342dcb2e',
  measurementId: 'G-GQW5YMENY6',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
