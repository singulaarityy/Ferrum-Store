'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = public user
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate from localStorage
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const data = await api.login(email, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                return { success: true };
            }
        } catch (error) {
            console.error("Login failed:", error);
            return { success: false, message: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        // Redirect to root or refresh? usually just state update is enough.
        // But for clarity, we might want to refresh to clear any sensitive data from memory not in React state.
        window.location.reload(); 
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        canEdit: (folderOwnerId) => {
            if (!user) return false;
            // Admin can edit anything.
            if (user.role === 'admin') return true;
            // Owner can edit.
            if (user.id === folderOwnerId) return true;
            // OSIS/Media can edit if shared (permission check needs API ideally, but for now specific roles)
            // Backend handles real permission, frontend just shows UI.
            return ['osis', 'media_guru'].includes(user.role); 
        },
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
