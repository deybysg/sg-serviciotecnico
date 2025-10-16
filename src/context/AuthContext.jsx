import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
// Importa Swal si lo usas también en el contexto para notificaciones
// import Swal from "sweetalert2"; 

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // 💡 Nuevo estado: isLoading para evitar renderizar la app antes de chequear localStorage
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 🔄 PASO CLAVE 1: Efecto para Rehidratar la Sesión (al cargar la página)
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        
        if (storedUser) {
            try {
                const userObject = JSON.parse(storedUser);
                // Si encontramos datos válidos, rehidratamos el estado
                setUser(userObject);
            } catch (error) {
                console.error("Error al leer el usuario de localStorage:", error);
                localStorage.removeItem('currentUser'); // Limpiar datos corruptos
            }
        }
        
        // La verificación inicial de sesión ha terminado
        setIsLoading(false); 
    }, []);
    
    // --- LÓGICA DE SESIÓN ---

    // 💾 PASO CLAVE 2: Modificar LOGIN (Guardar en localStorage)
    const login = useCallback(async (username, password) => {
        try {
            const res = await fetch(`http://localhost:3001/Usuarios?username=${username}`);
            const data = await res.json();

            if (data.length === 0) return { ok: false, message: "Usuario no encontrado" };

            const found = data[0];
            if (found.password !== password) return { ok: false, message: "Contraseña incorrecta" };

            // Objeto simplificado para el estado y localStorage
            const userToStore = { username: found.username, role: found.role };
            
            // GUARDAR EN LOCALSTORAGE
            localStorage.setItem('currentUser', JSON.stringify(userToStore)); 

            setUser(userToStore);
            return { ok: true, user: found }; // Devolvemos 'found' para tener todos los datos
        } catch (err) {
            return { ok: false, message: "Error de conexión" };
        }
    }, []);

    // REGISTRO (No necesita cambios de localStorage, ya que el setUser lo maneja)
    const register = useCallback(async (username, password) => {
        try {
            const resCheck = await fetch(`http://localhost:3001/Usuarios?username=${username}`);
            const dataCheck = await resCheck.json();
            if (dataCheck.length > 0) return { ok: false, message: "Usuario ya existe" };

            const newUser = { username, password, role: "user" };
            const res = await fetch(`http://localhost:3001/Usuarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser)
            });
            const data = await res.json();
            
            // Objeto simplificado para el estado y localStorage
            const userToStore = { username: data.username, role: data.role };

            // Opcional: Si quieres que el usuario quede logueado inmediatamente
            localStorage.setItem('currentUser', JSON.stringify(userToStore)); 

            setUser(userToStore);
            return { ok: true, user: data };
        } catch (err) {
            return { ok: false, message: "Error de conexión" };
        }
    }, []);

    // 🧹 PASO CLAVE 3: Modificar LOGOUT (Limpiar localStorage)
    const logout = useCallback(() => {
        setUser(null);
        // ELIMINAR DE LOCALSTORAGE
        localStorage.removeItem('currentUser'); 
    }, []);


    // Muestra un indicador de carga mientras verifica la sesión
    if (isLoading) {
        return <div>Cargando sesión...</div>; 
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};