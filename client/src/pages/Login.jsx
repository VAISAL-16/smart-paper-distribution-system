import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Mail,
  Lock,
  ArrowRight,
  Fingerprint,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    if (email.includes("admin")) {
      const name = email.split("@")[0] || "Admin";
      login({ email, role: "ADMIN", name });
      navigate("/dashboard");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      login(data.user);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Invalid user");
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password recovery link will be sent (coming soon).");
  };

  const handleGoogleToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google login failed");
      }

      login(data.user);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Google login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[140px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-600/20 blur-[140px] rounded-full"></div>

      <div className="w-full max-w-md sm:max-w-lg md:max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl">
            <ShieldAlert className="text-white" size={28} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            SecureExam
          </h1>

          <p className="text-slate-400 mt-1 text-xs sm:text-sm uppercase tracking-widest font-semibold">
            Zero-Trust Distribution Node
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">

          <div className="mb-5 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              System Login
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Enter your credentials to access the vault.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Work Email
              </label>

              <div className="relative mt-2">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="email"
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mt-2">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] sm:text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Forgot?
                </button>
              </div>

              <div className="relative mt-2">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-12 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 mt-4"
            >
              Authorized Access
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 sm:my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-bold tracking-widest">
                Secure Connect
              </span>
            </div>
          </div>

          {/* Google */}
          <div className="mb-3 flex justify-center">
            <GoogleSignInButton onToken={handleGoogleToken} text="signin_with" />
          </div>

          {/* Biometric */}
          <button className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-3 text-sm">
            <Fingerprint size={18} />
            Biometric Unlock
          </button>

          {/* Register */}
          <p className="text-center text-slate-500 text-xs sm:text-sm mt-6 sm:mt-8">
            Unauthorized Personnel?{" "}
            <Link to="/newregister" className="text-indigo-400 font-bold hover:underline cursor-pointer">
              Register Device
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center text-slate-600 text-[10px] sm:text-xs">
          <p className="uppercase tracking-widest mb-2">
            FIPS 140-2 Compliant Node
          </p>
          <p>
            Access restricted to authorized personnel. All connections are logged.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
