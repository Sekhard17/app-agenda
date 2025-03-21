import { API_CONFIG } from '../config/api.config';
import ApiService from './api.service';

// Interfaces para los tipos de datos
export interface Recurso {
  id: string;
  nombre: string;
  descripcion?: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamaño_bytes?: number;
  id_proyecto?: string;
  id_actividad?: string;
  id_usuario: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  estado: string;
  id_categoria?: string;
  url_firmada?: string;
}

class RecursosService {
  /**
   * Obtiene los recursos asociados a una actividad
   * @param actividadId ID de la actividad
   */
  static async getRecursosPorActividad(actividadId: string): Promise<Recurso[]> {
    try {
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.RECURSOS.BASE}/actividad/${actividadId}`);
      
      // Verificamos el formato de la respuesta
      let recursos: any[] = [];
      if (response) {
        if (response.recursos && Array.isArray(response.recursos)) {
          recursos = response.recursos;
        } else if (Array.isArray(response)) {
          recursos = response;
        } else if (response.data && Array.isArray(response.data)) {
          recursos = response.data;
        }
      }
      
      return recursos;
    } catch (error) {
      console.error(`Error al obtener recursos para la actividad ${actividadId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene los recursos asociados a un proyecto
   * @param proyectoId ID del proyecto
   */
  static async getRecursosPorProyecto(proyectoId: string): Promise<Recurso[]> {
    try {
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.RECURSOS.BY_PROYECTO(proyectoId)}`);
      
      // Verificamos el formato de la respuesta
      let recursos: any[] = [];
      if (response) {
        if (response.recursos && Array.isArray(response.recursos)) {
          recursos = response.recursos;
        } else if (Array.isArray(response)) {
          recursos = response;
        } else if (response.data && Array.isArray(response.data)) {
          recursos = response.data;
        }
      }
      
      return recursos;
    } catch (error) {
      console.error(`Error al obtener recursos para el proyecto ${proyectoId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene una URL firmada para descargar un recurso
   * @param recursoId ID del recurso
   */
  static async getUrlFirmada(recursoId: string): Promise<string | null> {
    try {
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.RECURSOS.URL_FIRMADA(recursoId)}`);
      
      if (response && response.url) {
        return response.url;
      }
      
      return null;
    } catch (error) {
      console.error(`Error al obtener URL firmada para el recurso ${recursoId}:`, error);
      return null;
    }
  }

  /**
   * Sube un nuevo recurso
   * @param formData FormData con los datos del recurso
   */
  static async subirRecurso(formData: FormData): Promise<Recurso | null> {
    try {
      const response = await ApiService.post<Recurso>(
        API_CONFIG.ENDPOINTS.RECURSOS.BASE, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Error al subir el recurso:', error);
      return null;
    }
  }

  /**
   * Elimina un recurso
   * @param id ID del recurso a eliminar
   */
  static async eliminarRecurso(id: string): Promise<boolean> {
    try {
      await ApiService.delete(`${API_CONFIG.ENDPOINTS.RECURSOS.BY_ID(id)}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar el recurso con ID ${id}:`, error);
      return false;
    }
  }
}

export default RecursosService; 