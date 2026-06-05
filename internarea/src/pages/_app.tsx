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
import { LanguageProvider } from "@/context/LanguageContext";

function AuthListener() {
  const dispatch = useDispatch();
  useEffect(() => {
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
          }),
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
  const [otpPending, setotpPending] = useState(false);

  useEffect(() => {
    const pending = sessionStorage.getItem("otpPending") === "true";
    setotpPending(pending);
    if (pending && window.location.pathname !== "/otpVerification") {
      router.push("/otpVerification");
    }
    setchecked(true);
  }, []);

  if (!checked) return <>{children}</>;
  if (
    otpPending &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/otpVerification"
  ) {
    return null;
  }
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <AuthListener />
        <div className="bg-white">
          <ToastContainer />
          <Navbar />
          <OtpGuard>
            <Component {...pageProps} />
          </OtpGuard>
          <Footer />
        </div>
      </LanguageProvider>
    </Provider>
  );
}
