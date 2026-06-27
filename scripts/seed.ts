import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const demoUsers = [
  {
    email: 'alice@example.com',
    password: 'password123',
    displayName: 'Alice Smith',
    bio: 'Software Engineer & Coffee enthusiast',
    photoURL: 'https://i.pravatar.cc/150?u=alice@example.com',
  },
  {
    email: 'bob@example.com',
    password: 'password123',
    displayName: 'Bob Johnson',
    bio: 'Designer by day, gamer by night',
    photoURL: 'https://i.pravatar.cc/150?u=bob@example.com',
  },
  {
    email: 'charlie@example.com',
    password: 'password123',
    displayName: 'Charlie Brown',
    bio: 'Music producer',
    photoURL: 'https://i.pravatar.cc/150?u=charlie@example.com',
  },
  {
    email: 'diana@example.com',
    password: 'password123',
    displayName: 'Diana Prince',
    bio: 'Product Manager',
    photoURL: 'https://i.pravatar.cc/150?u=diana@example.com',
  },
];

async function seed() {
  console.log('Starting seed process...');
  let successCount = 0;
  for (const user of demoUsers) {
    try {
      console.log(`Creating user: ${user.email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      
      const userDoc = {
        uid: userCredential.user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        bio: user.bio,
        isOnline: false,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      await new Promise(r => setTimeout(r, 1000));
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      console.log(`Successfully created user: ${user.displayName}`);
      successCount++;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${user.email} already exists in Auth. Logging in and setting document...`);
        const { signInWithEmailAndPassword } = require('firebase/auth');
        const cred = await signInWithEmailAndPassword(auth, user.email, user.password);
        const userDoc = {
          uid: cred.user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          bio: user.bio,
          isOnline: false,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
        };
        await new Promise(r => setTimeout(r, 1000));
        await setDoc(doc(db, 'users', cred.user.uid), userDoc, { merge: true });
        console.log(`Successfully updated existing user: ${user.displayName}`);
        successCount++;
      } else {
        console.error(`Failed to create user ${user.email}:`, error);
      }
    }
  }
  
  console.log(`Seeding complete. Created ${successCount} users.`);
  process.exit(0);
}

seed();
