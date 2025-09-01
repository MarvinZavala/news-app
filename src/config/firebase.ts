// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9Asdb4OAa4Zl4nf_5tM6qoeGE31gTAUY",
  authDomain: "news-app-ecea9.firebaseapp.com",
  projectId: "news-app-ecea9",
  // Using your selected bucket name
  storageBucket: "news-app-ecea9.firebasestorage.app",
  messagingSenderId: "891028541788",
  appId: "1:891028541788:web:8fbaaa8f16c8fa3065b199",
  measurementId: "G-Y0Y6HWYMC7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for React Native
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage for media uploads (explicit bucket)
const storage = getStorage(app, 'gs://news-app-ecea9.firebasestorage.app');

// Export auth, db, and storage for use in other parts of the app
export { auth, db, storage };
export default app;
