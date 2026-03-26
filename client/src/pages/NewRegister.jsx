import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Mail, Lock, User, ArrowRight, Briefcase, Eye, EyeOff, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function NewRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: ""
  });

  const setRole = (role) => setFormData((prev) => ({ ...prev, role }));

  const handleLocalRegister = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, role } = formData;

    if (!name || !email || !password || !role) {
      toast.error("Please fill name, email, password and role.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      login({ ...data.user, token: data.token });
      toast.success("Account created successfully.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (token) => {
    const { role } = formData;
    if (!role) {
      toast.error("Select role before Google sign-in.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Google sign-in failed");
      }

      login({ ...data.user, token: data.token });
      toast.success("Google sign-in successful.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[140px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-600/20 blur-[140px] rounded-full"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white">New Register</h1>
          <p className="text-slate-400 mt-1 text-sm uppercase tracking-widest font-semibold">
            Setter / Invigilator Enrollment
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLocalRegister} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Name</label>
              <div className="relative mt-2">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone (Optional)</label>
              <div className="relative mt-2">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="tel"
                  placeholder="+91XXXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Role</label>
              <div className="relative mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("PAPER_SETTER")}
                  className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    formData.role === "PAPER_SETTER"
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <Briefcase size={14} /> Setter
                </button>
                <button
                  type="button"
                  onClick={() => setRole("INVIGILATOR")}
                  className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    formData.role === "INVIGILATOR"
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <ShieldCheck size={14} /> Invigilator
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-12 pr-12 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              Register
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-4 flex justify-center">
            <GoogleSignInButton
              onToken={handleGoogleSignIn}
              text="signup_with"
              disabled={loading}
            />
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Already have an account?{" "}
            <Link to="/" className="text-indigo-400 font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default NewRegister;
