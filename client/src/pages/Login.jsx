import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff, KeyRound, Globe2, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SESSION_EXPIRED_NOTICE_KEY = "sessionExpiredNotice";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("CREDENTIALS");
  const [otpEmail, setOtpEmail] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [otpCode, setOtpCode] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState("REQUEST");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotResetToken, setForgotResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotExpiryMinutes, setForgotExpiryMinutes] = useState(5);
  const [loginExpiryMinutes, setLoginExpiryMinutes] = useState(5);

  const resetForgotState = (emailSeed = formData.email || "") => {
    setForgotEmail(emailSeed);
    setForgotStep("REQUEST");
    setForgotOtp("");
    setForgotResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  useEffect(() => {
    if (localStorage.getItem("isAuthenticated") === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const sessionNotice = sessionStorage.getItem(SESSION_EXPIRED_NOTICE_KEY);
    if (!sessionNotice) return;

    toast.error(sessionNotice);
    sessionStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);
  }, []);

  const requestLoginOtp = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/auth/login/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }
      setOtpEmail(email.trim().toLowerCase());
      setLoginExpiryMinutes(Number(data.expiresInMinutes) || 5);
      setStep("OTP");
      toast.success(`OTP sent to ${data.destination}. Valid for ${Number(data.expiresInMinutes) || 5} minutes.`);
    } catch (error) {
      toast.error(error.message || "Failed to request OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLoginOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error("Enter OTP");
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/auth/login/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, otp: otpCode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "OTP verify failed");

      login({ ...data.user, token: data.token });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.message || "OTP verify failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Google login failed");

      login({ ...data.user, token: data.token });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.message || "Google login failed");
    }
  };

  const openForgot = () => {
    setForgotOpen(true);
    resetForgotState(formData.email || "");
  };

  const closeForgot = () => {
    setForgotOpen(false);
    resetForgotState(formData.email || "");
  };

  const requestForgotOtp = async (mode = "SEND") => {
    const normalizedEmail = forgotEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Enter your registered email");
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/auth/forgot/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, deliveryChoice: "EMAIL" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");
      setForgotEmail(normalizedEmail);
      setForgotOtp("");
      setForgotExpiryMinutes(Number(data.expiresInMinutes) || 5);
      setForgotStep("VERIFY");
      toast.success(
        mode === "RESEND"
          ? `New OTP sent to ${data.destination}. Previous OTP is no longer valid.`
          : `Verification code sent to ${data.destination}. Valid for ${Number(data.expiresInMinutes) || 5} minutes.`
      );
    } catch (error) {
      toast.error(error.message || "Failed to send recovery OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyForgotOtp = async () => {
    if (!forgotOtp) {
      toast.error("Enter OTP");
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/auth/forgot/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "OTP verify failed");
      setForgotResetToken(data.resetToken);
      setForgotStep("COMPLETE");
      toast.success("OTP verified. Set your new password.");
    } catch (error) {
      toast.error(error.message || "OTP verify failed");
    } finally {
      setIsLoading(false);
    }
  };

  const completeForgot = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Enter new password and confirm it");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/auth/forgot/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          resetToken: forgotResetToken,
          action: "RESET",
          newPassword
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to complete");
      toast.success(data.message || "Password reset completed");
      closeForgot();
    } catch (error) {
      toast.error(error.message || "Failed to complete");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dff0df] via-[#eaf5e8] to-[#d9ecd8] relative overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:p-10 grid place-items-center">
      <div className="absolute -top-20 -left-20 h-56 w-56 rotate-12 rounded-3xl bg-white/30 animate-pulse" />
      <div className="absolute top-10 right-20 h-14 w-14 rotate-12 rounded-xl bg-white/50" />
      <div className="absolute bottom-16 right-16 h-24 w-24 rounded-3xl bg-white/20 rotate-12" />
      <div className="absolute top-1/3 -right-10 h-40 w-40 rounded-full bg-emerald-200/35 blur-2xl" />

      <div className="w-full max-w-5xl rounded-[2rem] overflow-hidden bg-white shadow-[0_24px_60px_rgba(43,63,43,0.15)] grid md:grid-cols-2 border border-white/70">
        <section className="p-5 sm:p-7 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-black text-slate-900">
                Secure<span className="text-emerald-600">Exam</span>
              </h1>
              <button className="text-xs text-slate-500 inline-flex items-center gap-1">
                <Globe2 size={14} />
                EN
              </button>
            </div>

            <div className="mt-8 sm:mt-10">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                {step === "CREDENTIALS" ? "Welcome!" : "Verify OTP"}
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {step === "CREDENTIALS"
                  ? "Enter your email and password to continue to secure access."
                  : `Enter the code sent to ${otpEmail}. It is valid for ${loginExpiryMinutes} minutes.`}
              </p>
            </div>

            {step === "CREDENTIALS" && (
              <form onSubmit={requestLoginOtp} className="mt-7 sm:mt-8 space-y-3">
                <Field
                  icon={<Mail size={16} />}
                  type="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={(v) => setFormData((p) => ({ ...p, email: v }))}
                />
                <Field
                  icon={<Lock size={16} />}
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={formData.password}
                  onChange={(v) => setFormData((p) => ({ ...p, password: v }))}
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={openForgot}
                    className="h-12 rounded-xl border border-slate-200 bg-[#f3f5f7] text-sm text-emerald-700 font-semibold sm:col-span-2"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full h-12 rounded-xl bg-black text-white font-semibold hover:bg-slate-900 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {step === "OTP" && (
              <form onSubmit={verifyLoginOtp} className="mt-7 sm:mt-8 space-y-3">
                <Field
                  icon={<KeyRound size={16} />}
                  type="text"
                  placeholder="6-digit OTP"
                  value={otpCode}
                  onChange={(v) => setOtpCode(v.replace(/\D/g, "").slice(0, 6))}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-black text-white font-semibold hover:bg-slate-900 disabled:opacity-60 transition-transform hover:scale-[1.01]"
                >
                  Verify & Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setStep("CREDENTIALS")}
                  className="w-full text-sm text-emerald-700 font-semibold"
                >
                  Back to login
                </button>
              </form>
            )}

            <div className="mt-6">
              <GoogleSignInButton onToken={handleGoogleToken} text="signin_with" />
            </div>
          </div>

          <div className="pt-8 text-center text-xs text-slate-500">
            Need an account?{" "}
            <Link to="/newregister" className="text-emerald-700 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </section>

        <section
          className="hidden md:flex relative min-h-[640px] bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=80')"
          }}
        >
          <div className="absolute inset-0 bg-slate-900/15" />
          <div className="relative self-end m-8 rounded-3xl bg-white/35 backdrop-blur-md border border-white/40 p-6 max-w-sm">
            <p className="text-3xl">OTP</p>
            <h3 className="text-3xl font-black text-white mt-3 leading-tight">
              Secure exam access with OTP verification
            </h3>
            <p className="text-white/90 text-sm mt-3">
              Two-step authentication protects admin, setter, and invigilator accounts with email-based verification.
            </p>
          </div>
        </section>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
            <div className="rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">Password Recovery</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">Verify by Email OTP</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    We will send a 6-digit verification code to your registered email address.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Step</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {forgotStep === "REQUEST" ? "1 of 3" : forgotStep === "VERIFY" ? "2 of 3" : "3 of 3"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Email", "Verify", "Reset"].map((label, index) => {
                  const activeIndex =
                    forgotStep === "REQUEST" ? 0 : forgotStep === "VERIFY" ? 1 : 2;
                  const isActive = index <= activeIndex;
                  return (
                    <div
                      key={label}
                      className={`h-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-200"}`}
                    />
                  );
                })}
              </div>
            </div>

            {forgotStep === "REQUEST" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-sm font-semibold text-slate-800">Enter your registered email</p>
                  <p className="mt-1 text-xs text-slate-500">
                    We will send the recovery OTP using your configured EmailJS template.
                  </p>
                </div>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-[#f8fafb] px-4 text-sm text-slate-700 outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-slate-500 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  Email OTP will be sent through the configured EmailJS service.
                </p>
                <button
                  type="button"
                  onClick={requestForgotOtp}
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-black text-white font-semibold disabled:opacity-60"
                >
                  Send OTP
                </button>
              </div>
            )}

            {forgotStep === "VERIFY" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Verification code sent to <span className="font-semibold text-slate-700">{forgotEmail}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-bold">Verification Code</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-2 w-full h-14 rounded-2xl border border-slate-200 bg-[#f8fafb] px-4 text-center text-xl font-black tracking-[0.45em] text-slate-800 outline-none focus:border-emerald-500 sm:text-2xl"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Enter the 6-digit code from your inbox exactly as received. This OTP is valid for {forgotExpiryMinutes} minutes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={verifyForgotOtp}
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-black text-white font-semibold disabled:opacity-60"
                >
                  Verify OTP
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => requestForgotOtp("RESEND")}
                    disabled={isLoading}
                    className="h-12 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={15} />
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotStep("REQUEST")}
                    className="h-12 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {forgotStep === "COMPLETE" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 inline-flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Identity verified. Create your new password.
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-slate-200 bg-[#f8fafb] px-4 text-sm outline-none focus:border-emerald-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-slate-200 bg-[#f8fafb] px-4 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-xs text-slate-500 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  Your old password will stop working as soon as you save the new one.
                </p>

                <button
                  type="button"
                  onClick={completeForgot}
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-black text-white font-semibold disabled:opacity-60"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => setForgotStep("VERIFY")}
                  className="w-full h-12 rounded-2xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Back
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={closeForgot}
              className="mt-4 w-full h-12 rounded-2xl border border-slate-200 text-slate-600 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ icon, type, placeholder, value, onChange, right = null }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 rounded-xl border border-slate-200 bg-[#f3f5f7] pl-12 pr-12 text-sm text-slate-700 outline-none focus:border-emerald-500"
      />
      {right && <span className="absolute right-4 top-1/2 -translate-y-1/2">{right}</span>}
    </div>
  );                  
}

export default Login;
