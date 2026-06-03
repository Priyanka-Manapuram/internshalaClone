import Footer from "@/Components/Footer";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";

function AuthListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore email/password login session first
    const savedEmailUser = localStorage.getItem("emailUser");
    if (savedEmailUser) {
      dispatch(login(JSON.parse(savedEmailUser)));
    }

    const unsubscribe = auth.onAuthStateChanged((authuser) => {
      if (authuser) {
        localStorage.removeItem("emailUser");
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
        const emailUser = localStorage.getItem("emailUser");
        if (!emailUser) {
          dispatch(logout());
        }
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}

function OtpGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setchecked] = useState(false);

  useEffect(() => {
    const otpPending = sessionStorage.getItem("otpPending") === "true";
    const currentPath = window.location.pathname;

    if (otpPending && currentPath !== "/otpVerification") {
      router.push("/otpVerification");
    }

    setchecked(true);
  }, []);

  if (!checked) return null;

  const otpPending =
    typeof window !== "undefined"
      ? sessionStorage.getItem("otpPending") === "true"
      : false;

  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";

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