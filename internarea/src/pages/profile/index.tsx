import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { ExternalLink, Mail, User } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLanguage } from "@/context/LanguageContext";

interface User {
  name: string;
  email: string;
  photo: string;
}

const index = () => {
  const user = useSelector(selectuser);
  const { t } = useLanguage();
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axios.get(
          "https://internshalaclone-jby6.onrender.com/api/application"
        );
        setApplications(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchApplications();
  }, []);

  // Filter to only this user's applications (same logic as userapplication page)
  const userApplications = applications.filter(
    (app: any) => app.user?.name === user?.name
  );

  // Derive counts
  const activeCount = userApplications.filter(
    (app: any) => app.status?.toLowerCase() === "pending"
  ).length;

  const acceptedCount = userApplications.filter(
    (app: any) => app.status?.toLowerCase() === "approved"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={
                    user?.photo ||
                    `https://ui-avatars.com/api/?name=${user?.name}&background=3b82f6&color=fff`
                  }
                  alt={user?.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="mt-2 flex items-center justify-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {activeCount}
                  </span>
                  <p className="text-blue-600 text-sm mt-1">
                    {t("activeApplications")}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="text-green-600 font-semibold text-2xl">
                    {acceptedCount}
                  </span>
                  <p className="text-green-600 text-sm mt-1">
                    {t("acceptedApplications")}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-3 pt-4">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {t("viewApplications")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/resume"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  {t("resumeBuilder")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/login-history"
                  className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  {t("viewLoginHistory")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;