import React, { useState } from "react";
import Link from "next/link";
import { auth, provider } from "../firebase/firebase";
import { Search } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { selectuser } from "@/Feature/Userslice";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "@/Feature/Userslice";
import axios from "axios";
import { useRouter } from "next/router";

const Navbar = () => {
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const router = useRouter();

  // ← only new line added here
  const otpPending = typeof window !== "undefined"
    ? sessionStorage.getItem("otpPending") === "true"
    : false;

  const [showEmailLogin, setshowEmailLogin] = useState(false);
  const [emailInput, setemailInput] = useState("");
  const [passwordInput, setpasswordInput] = useState("");

  const handlelogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;

      const res = await axios.post(
        "https://internshalaclone-jby6.onrender.com/api/auth/record-login",
        { uid: u.uid, email: u.email, name: u.displayName }
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
      { email: emailInput, password: passwordInput }
    );

    const userData = {
      uid: res.data.uid,        // ← use uid from backend
      photo: null,
      name: res.data.name,      // ← use name from backend
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

          {/* Navigation Links — hidden during OTP verification */}
          {!otpPending && (
            <div className="hidden md:flex items-center space-x-8">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/internship"}>
                  <span>Internships</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/jobs"}>
                  <span>Jobs</span>
                </Link>
              </button>
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Opportunities"
                  className="ml-2 bg-transparent focus:outline-none text-sm w-48"
                />
              </div>
            </div>
          )}

          {/* Auth Buttons — hidden during OTP verification */}
          {!otpPending && (
            <div className="flex items-center space-x-4 relative">
              {user ? (
                <div className="relative flex">
                  <button className="flex items-center space-x-2">
                    <Link href={"/profile"}>
                      <img
                        src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=3b82f6&color=fff`}
                        alt="profile"
                        className="w-8 h-8 rounded-full"
                      />
                    </Link>
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                    onClick={handlelogout}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  {/* Google Login */}
                  <button
                    onClick={handlelogin}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-gray-700">Continue with Google</span>
                  </button>

                  {/* Email Login Button + Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setshowEmailLogin(!showEmailLogin)}
                      className="bg-blue-600 text-white border border-blue-600 rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-700"
                    >
                      Login with Email
                    </button>

                    {showEmailLogin && (
                      <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-80 z-50">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          Login with Email
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
                              Forgot Password?
                            </Link>
                            <button
                              onClick={() => setshowEmailLogin(false)}
                              className="hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="relative flex items-center gap-2">
    <Link
      href="/subscription"
      className="text-sm text-blue-600 font-medium hover:underline"
    >
      Plans
    </Link>
    <button className="flex items-center space-x-2">
      <Link href={"/profile"}>
        <img
          src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=3b82f6&color=fff`}
          alt="profile"
          className="w-8 h-8 rounded-full"
        />
      </Link>
    </button>
    <button
      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
      onClick={handlelogout}
    >
      Logout
    </button>
    </div>
                  </div>
                  
                  <a href="/adminlogin" className="text-gray-600 hover:text-gray-800">
                    Admin
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;