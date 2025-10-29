import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 🔄 Verificar token y rehidratar sesión al cargar la página
    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            
            if (token) {
                try {
                    // Verificar el token con el backend
                    const res = await fetch(`${API_URL}/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        // El backend puede responder con el objeto usuario directo o envuelto en { user }
                        const resolvedUser = data?.user ?? data;
                        setUser(resolvedUser);
                        // Actualizar también el storage para mantener consistencia
                        localStorage.setItem('currentUser', JSON.stringify(resolvedUser));
                    } else {
                        // Token inválido o expirado
                        localStorage.removeItem('token');
                        localStorage.removeItem('currentUser');
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Error al verificar token:", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('currentUser');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            
            setIsLoading(false);
        };

        verifyToken();
    }, []);
    
    // --- LÓGICA DE SESIÓN ---

    // 💾 LOGIN con JWT
    const login = useCallback(async (username, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                return { ok: false, message: data.message || data.mensaje || "Error al iniciar sesión" };
            }

            // Guardar token y usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            setUser(data.user);
            return { ok: true, user: data.user };
        } catch (err) {
            console.error("Error en login:", err);
            return { ok: false, message: "Error de conexión con el servidor" };
        }
    }, []);

    // REGISTRO con JWT
    const register = useCallback(async (username, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role: 'user' })
            });

            const data = await res.json();

            if (!res.ok) {
                return { ok: false, message: data.message || data.mensaje || "Error al registrar usuario" };
            }

            // Guardar token y usuario (auto-login después de registro)
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));

            setUser(data.user);
            return { ok: true, user: data.user };
        } catch (err) {
            console.error("Error en register:", err);
            return { ok: false, message: "Error de conexión con el servidor" };
        }
    }, []);

    // 🧹 LOGOUT (limpiar token)
    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    }, []);

    // Helper para obtener el token (útil para otros componentes)
    const getToken = useCallback(() => {
        return localStorage.getItem('token');
    }, []);

    // Muestra un indicador de carga mientras verifica la sesión
    if (isLoading) {
        return <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontSize: '1.2rem'
        }}>
            🔐 Verificando sesión...
        </div>; 
    }

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            register, 
            getToken,
            isLoggedIn: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    );
};