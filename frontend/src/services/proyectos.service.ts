import ApiService from './api.service';
import { API_CONFIG } from '../config/api.config';

// Interfaces para los proyectos
export interface Proyecto {
  id: string;
  nombre: string;
  descripcion?: string;
  id_supervisor: string;
  id_externo_rex?: string;
  activo: boolean;
  estado: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
  fecha_inicio?: string | Date | null;
  fecha_fin?: string | Date | null;
  responsable_id?: string | null;
  presupuesto?: number | null;
  fecha_creacion: string | Date;
  fecha_actualizacion: string | Date;
  progreso?: number | null;
  usuarios_asignados?: UsuarioAsignado[] | null;
  total_actividades?: number | null;
  actividades_completadas?: number | null;
  horas_registradas?: number | null;
  documentos?: Documento[] | null;
  color?: string | null;
  icono?: string | null;
  ultima_actividad?: {
    descripcion: string;
    fecha: string | Date;
    usuario: string;
    estado?: string;
  } | null;
}

export interface UsuarioAsignado {
  id: string;
  nombres: string;
  appaterno: string;
  apmaterno?: string;
  email: string;
  rol: string;
  rut: string;
  avatar?: string;
}

export interface Documento {
  id: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo?: string;
  tamaño_bytes?: number;
  fecha_creacion: string | Date;
  id_actividad: string;
  actividades?: {
    id: string;
    descripcion: string;
    fecha: string | Date;
    usuarios?: {
      id: string;
      nombres: string;
      appaterno: string;
      avatar?: string;
    };
  };
}

export interface ProyectoResumido {
  id: string;
  nombre: string;
  estado: string;
  progreso: number;
  fecha_fin?: string | Date;
  actividades_totales: number;
  actividades_completadas: number;
}

export interface ProyectoFiltros {
  estado?: string;
  busqueda?: string;
  fechaInicio?: string;
  fechaFin?: string;
  ordenarPor?: string;
}

class ProyectosService {
  /**
   * Obtiene todos los proyectos activos
   */
  static async getProyectosActivos(): Promise<Proyecto[]> {
    try {
      const response = await ApiService.get<{proyectos: Proyecto[]}>(
        `${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}?activo=true`
      );
      return response.proyectos || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene proyectos asignados a un usuario específico
   */
  static async getProyectosPorUsuario(usuarioId: string): Promise<Proyecto[]> {
    try {
      const response = await ApiService.get<{proyectos: Proyecto[]}>(
        API_CONFIG.ENDPOINTS.PROYECTOS.BY_USUARIO(usuarioId)
      );
      return response.proyectos || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene detalles de un proyecto específico
   */
  static async getProyectoDetalle(proyectoId: string): Promise<Proyecto | null> {
    try {
      const response = await ApiService.get<{proyecto: Proyecto}>(
        API_CONFIG.ENDPOINTS.PROYECTOS.BY_ID(proyectoId)
      );
      return response.proyecto || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene las actividades asociadas a un proyecto
   */
  static async getActividadesProyecto(proyectoId: string): Promise<any[]> {
    try {
      const endpoint = `${API_CONFIG.ENDPOINTS.PROYECTOS.BY_ID(proyectoId)}/actividades`;
      
      const response = await ApiService.get<{actividades: any[]} | any[] | any>(endpoint);
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object') {
        if ('actividades' in response && Array.isArray(response.actividades)) {
          return response.actividades;
        } else if ('data' in response && Array.isArray(response.data)) {
          return response.data;
        }
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene los documentos asociados a un proyecto
   */
  static async getDocumentosProyecto(proyectoId: string): Promise<Documento[]> {
    try {
      const response = await ApiService.get<{documentos: Documento[]}>(
        `${API_CONFIG.ENDPOINTS.PROYECTOS.BY_ID(proyectoId)}/documentos`
      );
      
      // Formatear los documentos si es necesario
      const docs = response.documentos || [];
      
      // Convertir campos de fecha a objetos Date
      return docs.map(doc => ({
        ...doc,
        fecha_creacion: doc.fecha_creacion ? new Date(doc.fecha_creacion) : new Date(),
        actividades: doc.actividades ? {
          ...doc.actividades,
          fecha: doc.actividades.fecha ? new Date(doc.actividades.fecha) : new Date()
        } : undefined
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene las estadísticas de un proyecto
   */
  static async getEstadisticasProyecto(proyectoId: string): Promise<any> {
    try {
      const response = await ApiService.get<{estadisticas: any}>(
        API_CONFIG.ENDPOINTS.ESTADISTICAS.PROYECTO(proyectoId)
      );
      return response.estadisticas || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Obtiene un resumen de todos los proyectos con información básica
   */
  static async getResumenProyectos(): Promise<ProyectoResumido[]> {
    try {
      const response = await ApiService.get<{proyectos: ProyectoResumido[]}>(
        `${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}/resumen`
      );
      return response.proyectos || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene los documentos asociados a una actividad específica
   */
  static async getDocumentosActividad(actividadId: string): Promise<Documento[]> {
    try {
      const response = await ApiService.get<{documentos: Documento[]}>(
        `${API_CONFIG.ENDPOINTS.ACTIVIDADES.BY_ID(actividadId)}/documentos`
      );
      
      // Formatear los documentos si es necesario
      const docs = response.documentos || [];
      
      // Convertir campos de fecha a objetos Date
      return docs.map(doc => ({
        ...doc,
        fecha_creacion: doc.fecha_creacion ? new Date(doc.fecha_creacion) : new Date(),
        actividades: doc.actividades ? {
          ...doc.actividades,
          fecha: doc.actividades.fecha ? new Date(doc.actividades.fecha) : new Date()
        } : undefined
      }));
    } catch (error) {
      return [];
    }
  }
}

export default ProyectosService; 