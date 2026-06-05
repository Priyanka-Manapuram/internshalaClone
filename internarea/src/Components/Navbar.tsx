import React, { useState } from "react";
import Link from "next/link";
import { auth, provider } from "../firebase/firebase";
import { Search, Globe } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { selectuser } from "@/Feature/Userslice";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "@/Feature/Userslice";
import axios from "axios";
import { useRouter } from "next/router";
import { useLanguage } from "@/context/LanguageContext";

const Navbar = () => {
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const router = useRouter();
  const { lang, t, changeLang } = useLanguage();

  const otpPending =
    typeof window !== "undefined"
      ? sessionStorage.getItem("otpPending") === "true"
      : false;

  const [showEmailLogin, setshowEmailLogin] = useState(false);
  const [emailInput, setemailInput] = useState("");
  const [passwordInput, setpasswordInput] = useState("");
  const [showLangMenu, setshowLangMenu] = useState(false);
  const [langOtpModal, setlangOtpModal] = useState(false);
  const [langOtp, setlangOtp] = useState("");
  const [langOtpLoading, setlangOtpLoading] = useState(false);
  const [pendingLang, setpendingLang] = useState<string | null>(null);
  const [pendingEmail, setpendingEmail] = useState<string>("");

  const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "hi", label: "हिंदी" },
    { code: "pt", label: "Português" },
    { code: "zh", label: "中文" },
    { code: "fr", label: "Français" },
  ];

  const handlelogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;

      const res = await axios.post(
        "https://internshalaclone-jby6.onrender.com/api/auth/record-login",
        { uid: u.uid, email: u.email, name: u.displayName },
      );

      if (res.data.requiresOtp) {
        sessionStorage.setItem("otpPending", "true");
        router.push("/otpVerification");
      } else {
        toast.success("Logged in successfully");
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        toast.error("Mobile login only allowed 10 AM – 1 PM");
      } else {
        toast.error("Login failed");
      }
    }
  };

  const handleEmailLogin = async () => {
    if (!emailInput || !passwordInput) {
      toast.error("Please enter email and password.");
      return;
    }
    try {
      const res = await axios.post(
        "https://internshalaclone-jby6.onrender.com/api/auth/email-login",
        { email: emailInput, password: passwordInput },
      );
      const userData = {
        uid: res.data.uid,
        photo: null,
        name: res.data.name,
        email: res.data.email,
        phoneNumber: null,
      };
      toast.success("Logged in successfully!");
      setshowEmailLogin(false);
      dispatch(login(userData));
      localStorage.setItem("emailUser", JSON.stringify(userData));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Login failed.");
    }
  };

  const handlelogout = () => {
    signOut(auth);
    localStorage.removeItem("emailUser");
    dispatch(logout());
  };

  const handleLangChange = async (code: string) => {
    setshowLangMenu(false);
    if (code === lang) return;

    let emailToUse = user?.email || "";

    if (!emailToUse) {
      const entered = window.prompt(
        "Enter your email to verify language change:",
      );
      if (!entered) return;
      emailToUse = entered;
    }

    try {
      await axios.post(
        "https://internshalaclone-jby6.onrender.com/api/auth/resend-otp",
        { email: emailToUse },
      );
      setpendingLang(code);
      setpendingEmail(emailToUse);
      setlangOtpModal(true);
      toast.info("OTP sent to your email. Verify to change language.");
    } catch (error) {
      toast.error("Failed to send OTP.");
    }
  };

  const handleLangOtpVerify = async () => {
    if (!langOtp || langOtp.length !== 6) return;
    try {
      setlangOtpLoading(true);
      await axios.post(
        "https://internshalaclone-jby6.onrender.com/api/auth/verify-otp",
        { email: pendingEmail, otp: langOtp },
      );
      if (pendingLang) {
        changeLang(pendingLang as any);
        setpendingLang(null);
      }
      setlangOtpModal(false);
      setlangOtp("");
      setpendingEmail("");
      toast.success("Language changed successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid OTP.");
    } finally {
      setlangOtpLoading(false);
    }
  };

  // Language switcher — reused in both logged in and logged out
  const LangSwitcher = () => (
    <div className="relative">
      <button
        onClick={() => setshowLangMenu(!showLangMenu)}
        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-gray-50"
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs font-medium uppercase">{lang}</span>
      </button>
      {showLangMenu && (
        <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-2 w-40 z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => handleLangChange(l.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                lang === l.code
                  ? "text-blue-600 font-semibold"
                  : "text-gray-700"
              }`}
            >
              {l.label}
              {lang === l.code && <span className="text-blue-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="text-xl font-bold text-blue-600">
              <img src={"/logo.png"} alt="logo" className="h-16" />
            </a>
          </div>

          {/* Navigation Links — hidden during OTP */}
          {!otpPending && (
            <div className="hidden md:flex items-center space-x-8">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/internship"}>
                  <span>{t("internships")}</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/jobs"}>
                  <span>{t("jobs")}</span>
                </Link>
              </button>
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder={t("search")}
                  className="ml-2 bg-transparent focus:outline-none text-sm w-48"
                />
              </div>
            </div>
          )}

          {/* Auth Buttons — hidden during OTP */}
          {!otpPending && (
            <div className="flex items-center space-x-4 relative">
              {user ? (
                <div className="relative flex items-center gap-3 h-10">
                  <Link
                    href="/subscription"
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    {t("plans")}
                  </Link>
                  <button className="flex items-center space-x-2">
                    <Link href={"/profile"}>
                      <img
                        src={
                          user?.photo ||
                          `https://ui-avatars.com/api/?name=${user?.name}&background=3b82f6&color=fff`
                        }
                        alt="profile"
                        className="w-8 h-8 min-w-8 min-h-8 max-w-8 max-h-8 rounded-full object-cover flex-shrink-0"
                      />
                    </Link>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                    <Link href={"/community"}>
                      <span>Community</span>
                    </Link>
                  </button>

                  {/* ← Language switcher visible when LOGGED IN */}
                  <LangSwitcher />

                  <button
                    className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                    onClick={handlelogout}
                  >
                    {t("logout")}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handlelogin}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>{t("login")}</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setshowEmailLogin(!showEmailLogin)}
                      className="bg-blue-600 text-white border border-blue-600 rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-700"
                    >
                      {t("loginEmail")}
                    </button>
                    {showEmailLogin && (
                      <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-80 z-50">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          {t("loginEmail")}
                        </h3>
                        <div className="space-y-3">
                          <input
                            type="email"
                            placeholder="Email"
                            value={emailInput}
                            onChange={(e) => setemailInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="password"
                            placeholder="Password"
                            value={passwordInput}
                            onChange={(e) => setpasswordInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleEmailLogin}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            Login
                          </button>
                          <div className="flex justify-between text-xs text-gray-500">
                            <Link
                              href="/forgotPassword"
                              className="hover:text-blue-600"
                            >
                              {t("forgotPassword")}
                            </Link>
                            <button
                              onClick={() => setshowEmailLogin(false)}
                              className="hover:text-gray-700"
                            >
                              {t("cancel")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ← Language switcher visible when LOGGED OUT */}
                  <LangSwitcher />

                  <a
                    href="/adminlogin"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {t("admin")}
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Language OTP Modal */}
      {langOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full mx-4 text-center">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Language Change Verification
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Enter the OTP sent to <strong>{pendingEmail}</strong> to switch
              language.
            </p>
            <input
              type="text"
              maxLength={6}
              value={langOtp}
              onChange={(e) => setlangOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full text-center text-2xl tracking-widest px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              onClick={handleLangOtpVerify}
              disabled={langOtpLoading || langOtp.length !== 6}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 mb-3"
            >
              {langOtpLoading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={() => {
                setlangOtpModal(false);
                setlangOtp("");
                setpendingLang(null);
                setpendingEmail("");
              }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
