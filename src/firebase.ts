import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with experimentalForceLongPolling to improve reliability in iframe environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// CRITICAL: Test connection to Firestore with retry logic
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Attempt to get a non-existent document from the server to verify connectivity
      await getDocFromServer(doc(db, '_connection_test_', 'ping'));
      console.log("Firestore connection verified.");
      return;
    } catch (error: any) {
      const isOffline = error.message && error.message.includes('the client is offline');
      
      if (isOffline && i < retries - 1) {
        console.warn(`Firestore connection attempt ${i + 1} failed (offline). Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (isOffline) {
        console.error("CRITICAL: Firestore configuration may be incorrect or server is unreachable. Error: ", error.message);
      }
      break;
    }
  }
}

testConnection();
