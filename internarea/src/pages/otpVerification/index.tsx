import axios from "axios";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";

const VerifyOtp = () => {
  const router = useRouter();
  const user = useSelector(selectuser);
  const [otp, setotp] = useState("");
  const [isloading, setisloading] = useState(false);
  const [isresending, setisresending] = useState(false);
  const [countdown, setcountdown] = useState(300); // 5 minutes

  // Redirect away if no user in store
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setcountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleverify = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setisloading(true);
    await axios.post(
      `https://internshalaclone-jby6.onrender.com/api/auth/verify-otp`,
      { email: user?.email, otp }
    );
    sessionStorage.removeItem("otpPending");  // ← add this line
    toast.success("OTP verified! Welcome.");
    router.push("/");
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Invalid OTP.");
  } finally {
    setisloading(false);
  }
};

  const handleresend = async () => {
    try {
      setisresending(true);
      await axios.post(
        `https://internshalaclone-jby6.onrender.com/api/auth/resend-otp`,
        { email: user?.email }
      );
      setcountdown(300);
      toast.success("OTP resent to your email.");
    } catch (error) {
      toast.error("Failed to resend OTP. Try again.");
    } finally {
      setisresending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-4 rounded-full">
            <ShieldCheck className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Verify your login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We sent a 6-digit OTP to{" "}
          <span className="font-medium text-blue-600">{user?.email}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleverify}>
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                One-Time Password
              </label>
              <div className="mt-1">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) =>
                    setotp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="block w-full text-black text-center text-2xl tracking-widest px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="• • • • • •"
                />
              </div>
            </div>

            {/* Countdown */}
            <div className="text-center text-sm text-gray-500">
              {countdown > 0 ? (
                <>
                  OTP expires in{" "}
                  <span className="font-semibold text-blue-600">
                    {formatTime(countdown)}
                  </span>
                </>
              ) : (
                <span className="text-red-500">OTP expired. Please resend.</span>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isloading || countdown <= 0}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isloading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify OTP"
                )}
              </button>
            </div>
          </form>

          <div className="mt-4">
            <button
              onClick={handleresend}
              disabled={isresending || countdown > 0}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isresending ? "animate-spin" : ""}`} />
              {isresending ? "Resending..." : "Resend OTP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;