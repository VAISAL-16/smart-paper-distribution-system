import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    ShieldCheck,
    Mail,
    Lock,
    User,
    ArrowRight,
    Briefcase,
    Eye,
    EyeOff
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: ""
    });

    const handleRegister = async (e) => {
        e.preventDefault();
        const { name, email, password, role } = formData;

        if (!name || !email || !password || !role) {
            toast.error("Please fill in all fields including role.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }
            login({ ...data.user, token: data.token });
            toast.success("Account created successfully!");
            navigate("/dashboard");
        } catch (error) {
            toast.error(error.message || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[140px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-600/20 blur-[140px] rounded-full"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <ShieldCheck className="text-white" size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Create Account</h1>
                    <p className="text-slate-400 mt-1 text-sm uppercase tracking-widest font-semibold">
                        Join the Secure Distribution Network
                    </p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Full Name
                            </label>
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

                        {/* Email */}
                        <div>
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Work Email
                            </label>
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

                        {/* Role Selection */}
                        <div>
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Security Role
                            </label>
                            <div className="relative mt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: "PAPER_SETTER" })}
                                    className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.role === "PAPER_SETTER"
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                                        }`}
                                >
                                    <Briefcase size={14} /> Setter
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: "INVIGILATOR" })}
                                    className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.role === "INVIGILATOR"
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                                        }`}
                                >
                                    <ShieldCheck size={14} /> Invigilator
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Secure Password
                            </label>
                            <div className="relative mt-2">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
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
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 mt-2"
                        >
                            Enroll Device
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-8">
                        Already registered?{" "}
                        <Link to="/" className="text-indigo-400 font-bold hover:underline">
                            System Login
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default Register;
