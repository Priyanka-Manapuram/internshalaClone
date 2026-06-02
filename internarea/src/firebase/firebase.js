// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {getAuth,GoogleAuthProvider} from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAI5Ph5ojdZXFUZMrQIBHuk9qyDxScsUMg",
  authDomain: "internarea-b5fcf.firebaseapp.com",
  projectId: "internarea-b5fcf",
  storageBucket: "internarea-b5fcf.firebasestorage.app",
  messagingSenderId: "1060103419763",
  appId: "1:1060103419763:web:f0c845c4ece3e18b41f706"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app)
const provider=new GoogleAuthProvider()
export {auth,provider};;

