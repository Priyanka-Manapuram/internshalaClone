import { useRouter } from "next/router";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccess() {
  const router = useRouter();
  const { plan, invoice } = router.query;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-500 mb-6">
          Your <strong>{plan}</strong> plan is now active.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Plan</span>
            <span className="font-semibold text-gray-800">{plan}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Invoice</span>
            <span className="font-semibold text-gray-800">{invoice}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Invoice sent to</span>
            <span className="font-semibold text-gray-800">Your email</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/internship"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            Browse Internships
          </Link>
          <Link
            href="/profile"
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}