import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app from './config';

// Ensure messaging is only initialized on the client and if supported
export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return null;
  
  const supported = await isSupported();
  if (!supported) {
    console.log('Firebase Messaging is not supported in this browser.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted.');
      return null;
    }

    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    // Register service worker with config in URL params
    const config = app.options;
    const swUrl = `/firebase-messaging-sw.js?apiKey=${config.apiKey}&authDomain=${config.authDomain}&projectId=${config.projectId}&storageBucket=${config.storageBucket}&messagingSenderId=${config.messagingSenderId}&appId=${config.appId}`;
    
    const registration = await navigator.serviceWorker.register(swUrl);
    
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch (error) {
    console.error('An error occurred while retrieving token: ', error);
    return null;
  }
}

export async function onMessageListener() {
  if (typeof window === 'undefined') return () => {};
  
  const supported = await isSupported();
  if (!supported) return () => {};

  const messaging = getMessaging(app);
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
}
