import { API_CONFIG } from '../config/api.config';
import ApiService from './api.service';

// Interfaces para los tipos de datos
export interface TipoActividad {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  activo: boolean;
  creado_por: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

class TiposActividadService {
  /**
   * Obtiene todos los tipos de actividad
   * @param incluirInactivos Si se deben incluir los tipos inactivos
   */
  static async obtenerTiposActividad(incluirInactivos: boolean = false): Promise<TipoActividad[]> {
    try {
      const response = await ApiService.get<TipoActividad[]>(
        `${API_CONFIG.ENDPOINTS.TIPOS_ACTIVIDAD.BASE}?incluirInactivos=${incluirInactivos}`
      );
      return response || [];
    } catch (error) {
      console.error('Error al obtener tipos de actividad:', error);
      return [];
    }
  }

  /**
   * Obtiene un tipo de actividad por su ID
   * @param id ID del tipo de actividad
   */
  static async obtenerTipoActividadPorId(id: string): Promise<TipoActividad | null> {
    try {
      const response = await ApiService.get<TipoActividad>(
        `${API_CONFIG.ENDPOINTS.TIPOS_ACTIVIDAD.BY_ID(id)}`
      );
      return response;
    } catch (error) {
      console.error(`Error al obtener tipo de actividad con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Crea un nuevo tipo de actividad
   * @param tipoActividad Datos del tipo de actividad a crear
   */
  static async crearTipoActividad(
    tipoActividad: Omit<TipoActividad, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'creado_por'>
  ): Promise<TipoActividad | null> {
    try {
      const response = await ApiService.post<TipoActividad>(
        API_CONFIG.ENDPOINTS.TIPOS_ACTIVIDAD.BASE,
        tipoActividad
      );
      return response;
    } catch (error) {
      console.error('Error al crear tipo de actividad:', error);
      return null;
    }
  }

  /**
   * Actualiza un tipo de actividad existente
   * @param id ID del tipo de actividad a actualizar
   * @param tipoActividad Datos actualizados del tipo de actividad
   */
  static async actualizarTipoActividad(
    id: string,
    tipoActividad: Partial<TipoActividad>
  ): Promise<TipoActividad | null> {
    try {
      const response = await ApiService.put<TipoActividad>(
        `${API_CONFIG.ENDPOINTS.TIPOS_ACTIVIDAD.BY_ID(id)}`,
        tipoActividad
      );
      return response;
    } catch (error) {
      console.error(`Error al actualizar tipo de actividad con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Desactiva un tipo de actividad
   * @param id ID del tipo de actividad a desactivar
   */
  static async desactivarTipoActividad(id: string): Promise<boolean> {
    try {
      await ApiService.delete(`${API_CONFIG.ENDPOINTS.TIPOS_ACTIVIDAD.BY_ID(id)}`);
      return true;
    } catch (error) {
      console.error(`Error al desactivar tipo de actividad con ID ${id}:`, error);
      return false;
    }
  }
}

export default TiposActividadService; 