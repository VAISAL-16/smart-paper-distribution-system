import { createContext, useContext, useState } from "react";
import { isAuthTokenExpired } from "../utils/authToken";

const AuthContext = createContext();
const SESSION_TTL_MS = Number(import.meta.env.VITE_SESSION_TTL_MS || 8 * 60 * 60 * 1000);

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const getStoredIssuedAt = () => Number(localStorage.getItem("authIssuedAt") || 0);
const getStoredToken = () => localStorage.getItem("authToken") || "";

const isStoredSessionValid = () => {
    const token = getStoredToken();
    if (token && isAuthTokenExpired(token)) {
        return false;
    }
    const issuedAt = getStoredIssuedAt();
    return Boolean(issuedAt) && Date.now() - issuedAt < SESSION_TTL_MS;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);
    const [role, setRole] = useState(localStorage.getItem("userRole") || getStoredUser()?.role || null);
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem("isAuthenticated") === "true" && isStoredSessionValid()
    );

    const login = (userData) => {
        const { token, ...safeUser } = userData;
        const issuedAt = Date.now();
        setUser(safeUser)
        setRole(safeUser.role);
        setIsAuthenticated(true);
        localStorage.setItem("userRole", safeUser.role);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify(safeUser));
        localStorage.setItem("authIssuedAt", String(issuedAt));
        if (token) {
            localStorage.setItem("authToken", token);
        }
    };

    const logout = () => {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
        localStorage.removeItem("userRole");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        localStorage.removeItem("authIssuedAt");
        localStorage.removeItem("authToken");
    };

    return (
        <AuthContext.Provider value={{ user, role, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
