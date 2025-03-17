import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import AuthService, { Usuario, LoginCredentials } from '../services/auth.service';

// Definir la interfaz para el contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean;
  usuario: Usuario | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Crear el contexto con un valor predeterminado
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  usuario: null,
  loading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  clearError: () => {},
});

// Definir la interfaz para las props del proveedor
interface AuthProviderProps {
  children: ReactNode;
}

// Crear el proveedor del contexto
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar si el usuario está autenticado al cargar la página
  useEffect(() => {
    const verificarAutenticacion = async () => {
      try {
        // Verificar si hay un token válido
        if (!AuthService.isAuthenticated()) {
          setIsAuthenticated(false);
          setUsuario(null);
          setLoading(false);
          return;
        }

        // Obtener información del usuario actual
        const usuarioActual = await AuthService.getCurrentUser();
        
        if (usuarioActual) {
          setIsAuthenticated(true);
          setUsuario(usuarioActual);
        } else {
          setIsAuthenticated(false);
          setUsuario(null);
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setIsAuthenticated(false);
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };

    verificarAutenticacion();
  }, []);

  // Función para iniciar sesión
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.login(credentials);
      setIsAuthenticated(true);
      setUsuario(response.usuario);
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      setError(error.response?.data?.message || 'Error al iniciar sesión');
      setIsAuthenticated(false);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsAuthenticated(false);
      setUsuario(null);
      setLoading(false);
    }
  };

  // Función para limpiar errores
  const clearError = () => {
    setError(null);
  };

  // Valor del contexto
  const contextValue: AuthContextType = {
    isAuthenticated,
    usuario,
    loading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para acceder fácilmente al contexto
export const useAuth = () => {
  return useContext(AuthContext);
};
