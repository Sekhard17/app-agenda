import { API_CONFIG } from '../config/api.config';
import ApiService from './api.service';

// Interfaces para los tipos de datos
export interface Documento {
  id: string;
  id_actividad: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo?: string;
  tamaño_bytes?: number;
  fecha_creacion: string | Date;
  actividades?: {
    id: string;
    descripcion: string;
    fecha: string | Date;
    usuarios?: {
      id: string;
      nombres: string;
      appaterno: string;
    };
  };
}

class DocumentosService {
  /**
   * Obtiene los documentos asociados a una actividad
   * @param actividadId ID de la actividad
   */
  static async getDocumentosPorActividad(actividadId: string): Promise<Documento[]> {
    try {
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BY_ID(actividadId)}/documentos`);
      
      // Verificamos el formato de la respuesta
      let documentos: any[] = [];
      if (response) {
        if (response.documentos && Array.isArray(response.documentos)) {
          documentos = response.documentos;
        } else if (Array.isArray(response)) {
          documentos = response;
        } else if (response.data && Array.isArray(response.data)) {
          documentos = response.data;
        }
      }
      
      return documentos.map(doc => ({
        ...doc,
        fecha_creacion: doc.fecha_creacion ? new Date(doc.fecha_creacion) : new Date(),
        actividades: doc.actividades ? {
          ...doc.actividades,
          fecha: doc.actividades.fecha ? new Date(doc.actividades.fecha) : new Date()
        } : undefined
      }));
    } catch (error) {
      console.error(`Error al obtener documentos para la actividad ${actividadId}:`, error);
      return [];
    }
  }

  /**
   * Sube un nuevo documento para una actividad
   * @param actividadId ID de la actividad
   * @param formData FormData con los datos del documento
   */
  static async subirDocumento(actividadId: string, formData: FormData): Promise<Documento | null> {
    try {
      // Asegurar que el formData tenga el ID de la actividad
      if (!formData.has('id_actividad')) {
        formData.append('id_actividad', actividadId);
      }
      
      const response = await ApiService.post<Documento>(
        `${API_CONFIG.ENDPOINTS.ACTIVIDADES.BY_ID(actividadId)}/documentos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error al subir el documento:', error);
      return null;
    }
  }

  /**
   * Elimina un documento
   * @param documentoId ID del documento a eliminar
   */
  static async eliminarDocumento(documentoId: string): Promise<boolean> {
    try {
      await ApiService.delete(`${API_CONFIG.ENDPOINTS.DOCUMENTOS.BY_ID(documentoId)}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar el documento con ID ${documentoId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene la URL para descargar un documento
   * @param documentoId ID del documento
   */
  static async getUrlDescarga(documentoId: string): Promise<string | null> {
    try {
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.DOCUMENTOS.BY_ID(documentoId)}/descargar`);
      
      if (response && response.url) {
        return response.url;
      }
      
      return null;
    } catch (error) {
      console.error(`Error al obtener URL de descarga para el documento ${documentoId}:`, error);
      return null;
    }
  }
}

export default DocumentosService; 