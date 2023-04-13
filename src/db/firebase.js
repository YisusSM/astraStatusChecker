import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyA3CSAPlKdWZRvHCF4lKaHPHtQAuOFDGF4',
  authDomain: 'astra-fc4a3.firebaseapp.com',
  projectId: 'astra-fc4a3',
  storageBucket: 'astra-fc4a3.appspot.com',
  messagingSenderId: '1086541251007',
  appId: '1:1086541251007:web:8b87b143498f4f329c610a'
}

export const app = initializeApp(firebaseConfig)

export async function getServices (callback) {
  const db = getDatabase()
  const servicesRef = ref(db, 'services')
  onValue(servicesRef, (snapshot) => {
    callback(snapshot.val())
  })
}
