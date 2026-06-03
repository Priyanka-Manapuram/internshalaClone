import Footer from "@/Components/Footer";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";

function AuthListener() {
  const dispatch = useDispatch();
  useEffect(() => {
    auth.onAuthStateChanged((authuser) => {
      if (authuser) {
        dispatch(
          login({
            uid: authuser.uid,
            photo: authuser.photoURL,
            name: authuser.displayName,
            email: authuser.email,
            phoneNumber: authuser.phoneNumber,
          })
        );
      } else {
        dispatch(logout());
      }
    });
  }, [dispatch]);
  return null;
}

function OtpGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // Check if OTP is pending from sessionStorage
  const otpPending = typeof window !== "undefined" 
    ? sessionStorage.getItem("otpPending") === "true" 
    : false;
  
  const currentPath = typeof window !== "undefined" 
    ? window.location.pathname 
    : "";

  useEffect(() => {
    if (otpPending && currentPath !== "/otpVerification") {
      router.push("/otpVerification");
    }
  }, [otpPending, currentPath]);

  // Block rendering of other pages if OTP is pending
  if (otpPending && currentPath !== "/otpVerification") {
    return null;
  }

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <AuthListener />
      <div className="bg-white">
        <ToastContainer />
        <Navbar />
        <OtpGuard>
          <Component {...pageProps} />
        </OtpGuard>
        <Footer />
      </div>
    </Provider>
  );
}
