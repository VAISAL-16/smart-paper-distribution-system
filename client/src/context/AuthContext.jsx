import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);
    const [role, setRole] = useState(localStorage.getItem("userRole") || getStoredUser()?.role || null);
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem("isAuthenticated") === "true"
    );

    const login = (userData) => {
        setUser(userData)
        setRole(userData.role);
        setIsAuthenticated(true);
        localStorage.setItem("userRole", userData.role);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
        localStorage.removeItem("userRole");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
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
