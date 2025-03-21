import ApiService from './api.service';
import { API_CONFIG } from '../config/api.config';

export interface Comentario {
  id: string;
  id_actividad: string;
  id_usuario: string;
  contenido: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  padre_id: string | null;
  estado: 'activo' | 'eliminado';
  usuario: {
    nombres: string;
    appaterno: string;
    apmaterno: string | null;
    rol: string;
  };
}

export interface ComentarioCrear {
  id_actividad: string;
  contenido: string;
  padre_id?: string;
}

class ComentariosService {
  // Obtener comentarios de una actividad
  static async obtenerComentarios(idActividad: string): Promise<Comentario[]> {
    try {
      // El backend ya obtiene el ID del usuario del token JWT
      const response = await ApiService.get<{ comentarios: Comentario[] }>(
        `${API_CONFIG.ENDPOINTS.COMENTARIOS.BASE}/${idActividad}`
      );
      return response.comentarios;
    } catch (error) {
      console.error('Error al obtener comentarios:', error);
      throw error;
    }
  }

  // Crear un nuevo comentario
  static async crearComentario(comentario: ComentarioCrear): Promise<Comentario> {
    try {
      const response = await ApiService.post<{ comentario: Comentario }>(
        API_CONFIG.ENDPOINTS.COMENTARIOS.BASE,
        comentario
      );
      return response.comentario;
    } catch (error) {
      console.error('Error al crear comentario:', error);
      throw error;
    }
  }

  // Actualizar un comentario
  static async actualizarComentario(id: string, contenido: string): Promise<Comentario> {
    try {
      const response = await ApiService.put<{ comentario: Comentario }>(
        `${API_CONFIG.ENDPOINTS.COMENTARIOS.BASE}/${id}`,
        { contenido }
      );
      return response.comentario;
    } catch (error) {
      console.error('Error al actualizar comentario:', error);
      throw error;
    }
  }

  // Eliminar un comentario
  static async eliminarComentario(id: string): Promise<Comentario> {
    try {
      const response = await ApiService.delete<{ comentario: Comentario }>(
        `${API_CONFIG.ENDPOINTS.COMENTARIOS.BASE}/${id}`
      );
      return response.comentario;
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      throw error;
    }
  }
}

export default ComentariosService; 