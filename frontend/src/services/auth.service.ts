import ApiService from './api.service';
import { API_CONFIG } from '../config/api.config';
import Cookies from 'js-cookie';

// Interfaces
export interface LoginCredentials {
  nombre_usuario: string;
  password: string;
}

export interface Usuario {
  id: string;
  nombre_usuario: string;
  nombres: string;
  appaterno: string;
  apmaterno?: string;
  email: string;
  rol: 'funcionario' | 'supervisor';
  id_supervisor?: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface UserResponse {
  usuario: Usuario;
}

// Servicio de autenticación
class AuthService {
  // Iniciar sesión
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await ApiService.post<LoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      
      // Guardar el token en una cookie
      Cookies.set('auth_token', response.token, {
        expires: 1, // 1 día
        secure: window.location.protocol === 'https:', // Solo en HTTPS en producción
        sameSite: 'strict',
        path: '/' // Asegurar que la cookie esté disponible en toda la aplicación
      });
      
      // Guardar la información completa del usuario en localStorage
      // para usarla cuando el token no contenga todos los datos
      if (response.usuario) {
        localStorage.setItem('usuario_completo', JSON.stringify(response.usuario));
      }
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Cerrar sesión
  static async logout(): Promise<void> {
    try {
      // Llamar al endpoint de logout (opcional, depende de tu backend)
      await ApiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Usar una función helper para intentar eliminar la cookie de múltiples maneras
      const eliminarCookieDeFormaExhaustiva = (nombre: string) => {
        // 1. Eliminar con opciones específicas
        Cookies.remove(nombre, { 
          path: '/',
          secure: window.location.protocol === 'https:',
          sameSite: 'strict'
        });
        
        // 2. Eliminar con la ruta por defecto
        Cookies.remove(nombre);
        
        // 3. Probar con diferentes rutas
        ['/api', '/auth', '/login', ''].forEach(path => {
          Cookies.remove(nombre, { path });
        });
        
        // 4. Sobreescribir la cookie con una expirada (método alternativo)
        document.cookie = `${nombre}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        
        console.log('Cookie eliminada: intentos exhaustivos completados');
      };
      
      // Eliminar la cookie de autenticación
      eliminarCookieDeFormaExhaustiva('auth_token');
      
      // Limpiar cualquier dato de sesión en localStorage
      localStorage.clear();
      // Limpiar cualquier dato de sesión en sessionStorage
      sessionStorage.clear();
    }
  }

  // Obtener usuario actual
  static async getCurrentUser(): Promise<Usuario | null> {
    try {
      // Verificar si hay un token
      const token = Cookies.get('auth_token');
      if (!token) {
        return null;
      }
      
      // Decodificar el JWT directamente en lugar de hacer una llamada API
      try {
        // Obtener el payload del token (segunda parte del JWT)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Formato de token inválido');
        }
        
        // Decodificar el payload
        const base64Url = tokenParts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Verificar si el token ya expiró
        const now = Date.now() / 1000;
        if (payload.exp && payload.exp < now) {
          // Token expirado, eliminarlo
          Cookies.remove('auth_token');
          return null;
        }
        
        // Crear objeto de usuario desde el payload
        const usuario: Usuario = {
          id: payload.id,
          nombre_usuario: payload.nombre_usuario,
          nombres: '',
          appaterno: '',
          apmaterno: '',
          email: '',
          rol: payload.rol,
          id_supervisor: payload.id_supervisor
        };
        
        // Obtener información adicional del usuario desde localStorage
        // (guardada durante el login)
        const usuarioGuardado = localStorage.getItem('usuario_completo');
        if (usuarioGuardado) {
          try {
            const datosGuardados = JSON.parse(usuarioGuardado);
            // Solo usar los datos guardados si pertenecen al mismo usuario
            if (datosGuardados.id === usuario.id) {
              usuario.nombres = datosGuardados.nombres || '';
              usuario.appaterno = datosGuardados.appaterno || '';
              usuario.apmaterno = datosGuardados.apmaterno || '';
              usuario.email = datosGuardados.email || '';
            }
          } catch (e) {
            console.warn('Error al parsear usuario guardado:', e);
          }
        }
        
        // Si no hay información completa, usar el nombre de usuario como fallback
        if (!usuario.nombres) {
          usuario.nombres = usuario.nombre_usuario;
        }
        
        return usuario;
      } catch (decodeError) {
        console.error('Error al decodificar token JWT:', decodeError);
        
        // Si hay error al decodificar, verificar si tenemos datos en localStorage
        const usuarioGuardado = localStorage.getItem('usuario_completo');
        if (usuarioGuardado) {
          try {
            return JSON.parse(usuarioGuardado);
          } catch (e) {
            console.error('Error al obtener usuario de localStorage:', e);
          }
        }
        return null;
      }
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  // Verificar si el usuario está autenticado
  static isAuthenticated(): boolean {
    try {
      // Verificar token y su validez
      const token = Cookies.get('auth_token');
      if (!token) {
        return false;
      }
      
      // Verificar expiración decodificando el token
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return false;
      }
      
      // Decodificar el payload para verificar expiración
      const base64Url = tokenParts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Verificar si ya expiró
      const now = Date.now() / 1000;
      if (payload.exp && payload.exp < now) {
        Cookies.remove('auth_token');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    }
  }
}

export default AuthService;
