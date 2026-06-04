import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { CheckCircle, Zap, Star, Crown, Shield } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: 0,
    limit: 1,
    icon: Shield,
    color: "gray",
    features: ["1 application/month", "Basic profile", "Job search"],
  },
  {
    name: "Bronze",
    price: 100,
    limit: 3,
    icon: Zap,
    color: "orange",
    features: ["3 applications/month", "Priority listing", "Email support"],
  },
  {
    name: "Silver",
    price: 300,
    limit: 5,
    icon: Star,
    color: "blue",
    features: ["5 applications/month", "Featured profile", "Resume builder"],
    popular: true,
  },
  {
    name: "Gold",
    price: 1000,
    limit: 999999,
    icon: Crown,
    color: "yellow",
    features: ["Unlimited applications", "Top placement", "Dedicated support"],
  },
];

const colorMap: any = {
  gray:   { bg: "bg-gray-50",   border: "border-gray-200", btn: "bg-gray-600 hover:bg-gray-700",   badge: "bg-gray-100 text-gray-600" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", btn: "bg-orange-500 hover:bg-orange-600", badge: "bg-orange-100 text-orange-600" },
  blue:   { bg: "bg-blue-50",   border: "border-blue-300",  btn: "bg-blue-600 hover:bg-blue-700",   badge: "bg-blue-100 text-blue-600" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-300", btn: "bg-yellow-500 hover:bg-yellow-600", badge: "bg-yellow-100 text-yellow-700" },
};

declare global {
  interface Window { Razorpay: any; }
}

export default function SubscriptionPage() {
  const user = useSelector(selectuser);
  const router = useRouter();
  const [currentPlan, setcurrentPlan] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const [payingPlan, setpayingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyPlan();
    loadRazorpay();
  }, [user]);

  const fetchMyPlan = async () => {
  try {
    const res = await axios.get(
      `https://internshalaclone-jby6.onrender.com/api/subscription/my-plan/${user?.uid}`,
      { params: { email: user?.email, name: user?.name } }
    );
    setcurrentPlan(res.data.subscription);
  } catch (error) {
    console.error(error);
  } finally {
    setloading(false);
  }
};

  const loadRazorpay = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  };

  const handleSelectPlan = async (plan: any) => {
    if (!user) {
      toast.error("Please login first.");
      return;
    }

    if (plan.name === "Free") {
      toast.info("You are already on the Free plan.");
      return;
    }

    if (currentPlan?.plan === plan.name) {
      toast.info(`You are already on the ${plan.name} plan.`);
      return;
    }

    try {
      setpayingPlan(plan.name);

      const res = await axios.post(
        "https://internshalaclone-jby6.onrender.com/api/subscription/create-order",
        {
          uid: user.uid,
          email: user.email,
          name: user.name,
          plan: plan.name,
        }
      );

      const { orderId, amount, currency } = res.data;

      const options = {
        key: "rzp_test_SxAPCkyCxYll4Y",
        amount,
        currency,
        name: "Internarea",
        description: `${plan.name} Plan Subscription`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await axios.post(
              "https://internshalaclone-jby6.onrender.com/api/subscription/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                uid: user.uid,
                email: user.email,
                name: user.name,
                plan: plan.name,
              }
            );

            if (verifyRes.data.success) {
              toast.success(`${plan.name} plan activated! Invoice sent to your email.`);
              router.push(`/subscription/success?plan=${plan.name}&invoice=${verifyRes.data.invoiceNumber}`);
            }
          } catch (error: any) {
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => setpayingPlan(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        toast.error("Payments only allowed between 10:00 AM – 11:00 AM IST.");
      } else {
        toast.error("Could not initiate payment. Try again.");
      }
      setpayingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Choose Your Plan
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Upgrade to apply to more internships and jobs
          </p>
          {currentPlan && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm text-blue-700 font-medium">
              Current plan: <strong>{currentPlan.plan}</strong> —{" "}
              {currentPlan.applicationsUsed}/{currentPlan.plan === "Gold" ? "∞" : currentPlan.applicationLimit} applications used
            </div>
          )}
          <p className="mt-2 text-xs text-red-500 font-medium">
            ⏰ Payments accepted only between 10:00 AM – 11:00 AM IST
          </p>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const colors = colorMap[plan.color];
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan?.plan === plan.name;
              const isPaying = payingPlan === plan.name;

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-6 flex flex-col ${colors.bg} ${
                    isCurrentPlan ? "border-blue-500 shadow-lg" : colors.border
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        ACTIVE
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${colors.badge}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  </div>

                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-extrabold text-gray-900">Free</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                        <span className="text-gray-500 text-sm">/month</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.limit === 999999 ? "Unlimited" : plan.limit} applications
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan || isPaying}
                    className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${colors.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isPaying ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                        Processing...
                      </div>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.price === 0 ? (
                      "Get Started"
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}