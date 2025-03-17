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
        sameSite: 'strict'
      });
      
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
      // Eliminar la cookie del token
      Cookies.remove('auth_token');
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
      
      const response = await ApiService.get<UserResponse>(API_CONFIG.ENDPOINTS.AUTH.ME);
      return response.usuario;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  // Verificar si el usuario está autenticado
  static isAuthenticated(): boolean {
    return !!Cookies.get('auth_token');
  }
}

export default AuthService;
