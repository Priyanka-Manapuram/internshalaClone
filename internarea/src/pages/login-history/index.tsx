import axios from "axios";
import { Monitor, Smartphone, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { auth } from "@/firebase/firebase";

interface LoginRecord {
  _id: string;
  uid: string;
  email: string;
  name: string;
  ipAddress: string;
  browser: string;
  os: string;
  device: string;
  loginTime: string;
  status: string;
}

const LoginHistory = () => {
  const router = useRouter();
  const user = useSelector(selectuser);
  const [history, sethistory] = useState<LoginRecord[]>([]);
  const [isloading, setisloading] = useState(true);

  useEffect(() => {
    // Wait for Firebase to restore session before checking
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        router.push("/");
      } else {
        fetchHistory(firebaseUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchHistory = async (uid: string) => {
    try {
      setisloading(true);
      const res = await axios.get(
        `https://internshalaclone-jby6.onrender.com/api/auth/login-history/${uid}`
      );
      sethistory(res.data.history || []);
    } catch (error) {
      console.error(error);
    } finally {
      setisloading(false);
    }
  };

  const DeviceIcon = ({ device }: { device: string }) => {
    if (device === "Mobile")
      return <Smartphone className="h-5 w-5 text-green-500" />;
    return <Monitor className="h-5 w-5 text-blue-500" />;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Login History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Recent sign-ins to your account
          </p>
        </div>

        {isloading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
            No login history found.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record, index) => (
              <div
                key={record._id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <DeviceIcon device={record.device} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        {record.browser}
                      </span>
                      <span className="text-gray-400">on</span>
                      <span className="font-semibold text-gray-800">
                        {record.os}
                      </span>
                      {index === 0 && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {record.ipAddress}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(record.loginTime)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      record.status === "success"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {record.status === "success" ? "✓ Success" : "✗ Blocked"}
                  </span>
                  <span className="text-xs text-gray-400">{record.device}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginHistory;