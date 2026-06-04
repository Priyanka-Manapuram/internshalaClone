import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { FileText, Lock, Download, Loader2 } from "lucide-react";

declare global {
  interface Window { Razorpay: any; }
}

const steps = ["Details", "Verify OTP", "Payment", "Resume"];

export default function ResumePage() {
  const user = useSelector(selectuser);
  const router = useRouter();
  const resumeRef = useRef<HTMLDivElement>(null);

  const [step, setstep] = useState(0);
  const [loading, setloading] = useState(false);
  const [otpSent, setotpSent] = useState(false);
  const [otp, setotp] = useState("");
  const [otpVerified, setotpVerified] = useState(false);
  const [existingResume, setexistingResume] = useState<any>(null);
  const [isPremium, setisPremium] = useState(false);
  const [checkingPlan, setcheckingPlan] = useState(true);

  const [form, setform] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    photo: "",
    summary: "",
    qualification: "",
    institution: "",
    graduationYear: "",
    experience: "",
    skills: "",
    linkedin: "",
  });

  useEffect(() => {
    if (!user) return;
    setform((f) => ({ ...f, name: user.name || "", email: user.email || "", photo: user.photo || "" }));
    checkPlanAndResume();
    loadRazorpay();
  }, [user]);

  const checkPlanAndResume = async () => {
    try {
      const [planRes, resumeRes] = await Promise.all([
        axios.get(`https://internshalaclone-jby6.onrender.com/api/subscription/my-plan/${user?.uid}`,
          { params: { email: user?.email, name: user?.name } }),
        axios.get(`https://internshalaclone-jby6.onrender.com/api/resume/${user?.uid}`),
      ]);

      const plan = planRes.data.subscription?.plan;
      setisPremium(plan === "Silver" || plan === "Gold");

      if (resumeRes.data.resume) {
        setexistingResume(resumeRes.data.resume);
        setstep(3);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setcheckingPlan(false);
    }
  };

  const loadRazorpay = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  };

  const handleSendOtp = async () => {
    if (!user) return;
    try {
      setloading(true);
      await axios.post(
        "https://internshalaclone-jby6.onrender.com/api/resume/send-otp",
        { uid: user.uid, email: user.email, plan: "check" }
      );
      setotpSent(true);
      setstep(1);
      toast.success("OTP sent to your email!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setloading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setloading(true);
      await axios.post(
        "https://internshalaclone-jby6.onrender.com/api/resume/verify-otp",
        { email: user?.email, otp }
      );
      setotpVerified(true);
      setstep(2);
      toast.success("OTP verified! Proceed to payment.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid OTP.");
    } finally {
      setloading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setloading(true);
      const res = await axios.post(
        "https://internshalaclone-jby6.onrender.com/api/resume/create-order",
        { uid: user?.uid, email: user?.email }
      );

      const { orderId, amount, currency } = res.data;

      const options = {
        key: "rzp_test_SxAPCkyCxYll4Y",
        amount,
        currency,
        name: "Internarea",
        description: "Resume Creation — ₹50",
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await axios.post(
              "https://internshalaclone-jby6.onrender.com/api/resume/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                uid: user?.uid,
                email: user?.email,
                resumeData: form,
              }
            );

            if (verifyRes.data.success) {
              setexistingResume(verifyRes.data.resume);
              setstep(3);
              toast.success("Resume created successfully!");
            }
          } catch (error: any) {
            toast.error("Payment verification failed.");
          }
        },
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => setloading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error("Could not initiate payment.");
    } finally {
      setloading(false);
    }
  };

  const handleDownload = () => {
    const element = resumeRef.current;
    if (!element) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Resume - ${existingResume?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
            h1 { font-size: 28px; margin-bottom: 4px; }
            h2 { font-size: 16px; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 4px; margin-top: 20px; }
            p { margin: 4px 0; font-size: 14px; }
            .header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
            .header img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
            .info { color: #555; font-size: 13px; }
            .section { margin-bottom: 16px; }
          </style>
        </head>
        <body>${element.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const resume = existingResume || form;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please login to access Resume Builder.</p>
      </div>
    );
  }

  if (checkingPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isPremium && step !== 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 p-4 rounded-full">
              <Lock className="h-10 w-10 text-yellow-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h2>
          <p className="text-gray-500 mb-6">
            Resume Builder is available only for <strong>Silver</strong> and <strong>Gold</strong> plan users.
          </p>
          <button
            onClick={() => router.push("/subscription")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Resume Builder</h1>
          <p className="text-gray-500 mt-2">Create a professional resume for ₹50</p>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${i <= step ? "text-blue-600 font-medium" : "text-gray-400"}`}>{s}</span>
                {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>
        )}

        {/* Step 0 — Form */}
        {step === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 space-y-5">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Enter Your Details</h2>

            {[
              { label: "Full Name", key: "name" },
              { label: "Email", key: "email" },
              { label: "Phone", key: "phone" },
              { label: "Location", key: "location" },
              { label: "Photo URL", key: "photo", placeholder: "https://..." },
              { label: "LinkedIn", key: "linkedin", placeholder: "https://linkedin.com/in/..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={(form as any)[key]}
                  onChange={(e) => setform({ ...form, [key]: e.target.value })}
                  placeholder={placeholder || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            {[
              { label: "Professional Summary", key: "summary" },
              { label: "Qualification (e.g. B.Tech Computer Science)", key: "qualification" },
              { label: "Institution", key: "institution" },
              { label: "Graduation Year", key: "graduationYear" },
              { label: "Experience", key: "experience" },
              { label: "Skills (comma separated)", key: "skills" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <textarea
                  value={(form as any)[key]}
                  onChange={(e) => setform({ ...form, [key]: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <button
              onClick={handleSendOtp}
              disabled={loading || !form.name || !form.email}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Send OTP & Continue"}
            </button>
          </div>
        )}

        {/* Step 1 — OTP */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Verify Your Email</h2>
            <p className="text-gray-500">Enter the 6-digit OTP sent to <strong>{user.email}</strong></p>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setotp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full text-center text-2xl tracking-widest px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Verify OTP"}
            </button>
            <button onClick={() => setstep(0)} className="text-sm text-gray-400 hover:text-gray-600">
              ← Back
            </button>
          </div>
        )}

        {/* Step 2 — Payment */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Complete Payment</h2>
            <p className="text-gray-500">Pay ₹50 to generate your professional resume</p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <p className="text-blue-700 font-semibold text-lg">Resume Generation</p>
              <p className="text-blue-600 text-3xl font-extrabold mt-2">₹50</p>
              <p className="text-blue-500 text-sm mt-1">One-time payment per resume</p>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Pay ₹50 with Razorpay"}
            </button>
          </div>
        )}

        {/* Step 3 — Resume Preview */}
        {step === 3 && existingResume && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Your Resume</h2>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>

            {/* Resume Preview */}
            <div ref={resumeRef} className="bg-white rounded-2xl shadow p-8">
              {/* Header */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b">
                {existingResume.photo && (
                  <img
                    src={existingResume.photo}
                    alt={existingResume.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">{existingResume.name}</h1>
                  <p className="text-gray-500 text-sm mt-1">{existingResume.email} · {existingResume.phone}</p>
                  <p className="text-gray-500 text-sm">{existingResume.location}</p>
                  {existingResume.linkedin && (
                    <a href={existingResume.linkedin} className="text-blue-600 text-sm hover:underline">
                      {existingResume.linkedin}
                    </a>
                  )}
                </div>
              </div>

              {/* Summary */}
              {existingResume.summary && (
                <div className="mb-5">
                  <h2 className="text-base font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-2">
                    PROFESSIONAL SUMMARY
                  </h2>
                  <p className="text-gray-700 text-sm leading-relaxed">{existingResume.summary}</p>
                </div>
              )}

              {/* Education */}
              {existingResume.qualification && (
                <div className="mb-5">
                  <h2 className="text-base font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-2">
                    EDUCATION
                  </h2>
                  <p className="text-gray-800 font-semibold text-sm">{existingResume.qualification}</p>
                  <p className="text-gray-600 text-sm">{existingResume.institution}</p>
                  <p className="text-gray-500 text-sm">{existingResume.graduationYear}</p>
                </div>
              )}

              {/* Experience */}
              {existingResume.experience && (
                <div className="mb-5">
                  <h2 className="text-base font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-2">
                    EXPERIENCE
                  </h2>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {existingResume.experience}
                  </p>
                </div>
              )}

              {/* Skills */}
              {existingResume.skills && (
                <div className="mb-5">
                  <h2 className="text-base font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-2">
                    SKILLS
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {existingResume.skills.split(",").map((skill: string) => (
                      <span
                        key={skill}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Create new resume button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => { setstep(0); setexistingResume(null); }}
                className="text-sm text-blue-600 hover:underline"
              >
                + Create a new resume (₹50)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}