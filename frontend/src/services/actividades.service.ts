import { API_CONFIG } from '../config/api.config';
import ApiService from './api.service';

// Interfaces para los tipos de datos
export interface Actividad {
  id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'enviado' | 'borrador' | string;
  prioridad?: 'baja' | 'media' | 'alta' | string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  id_usuario: string;
  id_proyecto?: string;
  proyecto_nombre?: string;
  avatar?: string; // Añadido campo avatar para manejar avatares de usuarios
  id_tipo_actividad?: string;
  sistema?: string;
  // Propiedades adicionales para RevisionActividades
  proyectos?: {
    nombre: string;
  };
  usuarios?: {
    nombres: string;
    appaterno: string;
    apmaterno?: string;
    nombre_usuario: string;
  };
}

export interface ActividadReciente {
  id: string;
  usuario: string;
  avatar?: string;
  accion: string;
  actividad: string;
  timestamp: string;
  proyecto?: string;
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  estado?: string;
}

class ActividadesService {
  /**
   * Obtiene todas las actividades del usuario actual
   */
  static async getActividadesUsuario(): Promise<Actividad[]> {
    try {
      console.log('Obteniendo actividades del usuario...');
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/usuario`);
      
      console.log('Respuesta de actividades del usuario:', response);
      
      // Obtener el usuario actual del localStorage
      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
      
      // Verificamos el formato de la respuesta
      let actividades: any[] = [];
      if (response) {
        if (response.actividades && Array.isArray(response.actividades)) {
          actividades = response.actividades;
        } else if (Array.isArray(response)) {
          actividades = response;
        } else if (response.data && Array.isArray(response.data)) {
          actividades = response.data;
        }
      }
      
      // Procesar las actividades manteniendo la información original
      return actividades.map(actividad => ({
        ...actividad,
        proyecto_nombre: actividad.proyectos?.nombre || actividad.proyecto_nombre || null,
        // Solo asignar información del usuario si no existe
        usuarios: actividad.usuarios || {
          nombres: usuarioActual.nombres || usuarioActual.nombre || 'Usuario',
          appaterno: usuarioActual.appaterno || '',
          apmaterno: usuarioActual.apmaterno || '',
          nombre_usuario: usuarioActual.nombre_usuario || usuarioActual.username || 'usuario'
        }
      }));
    } catch (error) {
      console.error('Error al obtener actividades del usuario:', error);
      return [];
    }
  }

  /**
   * Obtiene las actividades recientes del usuario
   * @param nombreUsuarioActual Nombre del usuario actual para mostrar en las actividades
   * @param limite Número máximo de actividades a retornar
   */
  static async getActividadesRecientes(nombreUsuarioActual?: string, limite: number = 5): Promise<ActividadReciente[]> {
    try {
      console.log('Obteniendo actividades recientes...');
      const actividades = await this.getActividadesUsuario();
      
      if (actividades.length === 0) {
        return [];
      }
      
      // Ordenamos por fecha de actualización (más recientes primero)
      const actividadesOrdenadas = [...actividades]
        .filter(a => a.fecha_actualizacion) // Aseguramos que tengan fecha de actualización
        .sort((a, b) => {
          try {
            return new Date(b.fecha_actualizacion).getTime() - new Date(a.fecha_actualizacion).getTime();
          } catch (e) {
            return 0; // En caso de error con las fechas
          }
        })
        .slice(0, limite); // Tomamos las más recientes según el límite
      
      // Transformamos al formato esperado
      return actividadesOrdenadas.map(actividad => {
        let accion = 'actualizó';
        if (actividad.estado === 'enviado') {
          accion = 'envió';
        } else if (actividad.estado === 'borrador') {
          accion = 'guardó';
        }

        return {
          id: actividad.id,
          usuario: nombreUsuarioActual || 'Usuario',
          avatar: actividad.avatar,
          accion,
          actividad: actividad.nombre,
          timestamp: actividad.fecha_actualizacion,
          proyecto: actividad.proyectos?.nombre,
          fecha: actividad.fecha,
          hora_inicio: actividad.hora_inicio,
          hora_fin: actividad.hora_fin,
          estado: actividad.estado
        };
      });
    } catch (error) {
      console.error('Error al obtener actividades recientes:', error);
      return [];
    }
  }

  /**
   * Obtiene una actividad por su ID
   * @param id ID de la actividad
   */
  static async getActividadPorId(id: string): Promise<Actividad | null> {
    try {
      const response = await ApiService.get<Actividad>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BY_ID(id)}`);
      return response;
    } catch (error) {
      console.error(`Error al obtener la actividad con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Crea una nueva actividad
   * @param actividad Datos de la actividad a crear
   */
  static async crearActividad(actividad: Omit<Actividad, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<Actividad | null> {
    try {
      const response = await ApiService.post<Actividad>(API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE, actividad);
      return response;
    } catch (error) {
      console.error('Error al crear la actividad:', error);
      return null;
    }
  }

  /**
   * Actualiza una actividad existente
   * @param id ID de la actividad a actualizar
   * @param actividad Datos actualizados de la actividad
   */
  static async actualizarActividad(id: string, actividad: Partial<Actividad>): Promise<Actividad | null> {
    try {
      const response = await ApiService.put<Actividad>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BY_ID(id)}`, actividad);
      return response;
    } catch (error) {
      console.error(`Error al actualizar la actividad con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina una actividad
   * @param id ID de la actividad a eliminar
   */
  static async eliminarActividad(id: string): Promise<boolean> {
    try {
      await ApiService.delete(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BY_ID(id)}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar la actividad con ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Obtiene las actividades de los usuarios supervisados
   * @param filtros Filtros para la búsqueda de actividades
   */
  static async getActividadesSupervisadas(filtros?: Record<string, string>): Promise<Actividad[]> {
    try {
      console.log('Obteniendo actividades supervisadas con filtros:', filtros);
      
      // Construir la URL con los parámetros de filtro
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/supervisados`;
      
      if (filtros && Object.keys(filtros).length > 0) {
        const params = new URLSearchParams();
        
        // Procesar cada filtro y asegurarse de que las fechas estén en formato ISO
        Object.entries(filtros).forEach(([key, value]) => {
          if (!value) return;
          
          // Convertir fechas al formato que espera el backend (YYYY-MM-DD)
          if (key === 'fechaInicio' || key === 'fechaFin') {
            try {
              // Intentar parsear la fecha y formatearla como ISO
              const fecha = new Date(value);
              if (!isNaN(fecha.getTime())) {
                // Formato YYYY-MM-DD
                const fechaFormateada = fecha.toISOString().split('T')[0];
                params.append(key, fechaFormateada);
                console.log(`Fecha ${key} formateada:`, fechaFormateada);
              } else {
                console.warn(`Fecha inválida para ${key}:`, value);
              }
            } catch (e) {
              console.error(`Error al formatear fecha ${key}:`, e);
              params.append(key, value); // Usar el valor original si hay error
            }
          } else {
            params.append(key, value);
          }
        });
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      console.log('URL de petición:', url);
      const response = await ApiService.get<any>(url);
      console.log('Respuesta del servidor:', response);
      
      // Verificamos el formato de la respuesta
      let actividades: Actividad[] = [];
      if (response) {
        if (response.actividades && Array.isArray(response.actividades)) {
          console.log('Formato de respuesta: { actividades: [...] }');
          actividades = response.actividades;
        } else if (Array.isArray(response)) {
          console.log('Formato de respuesta: [...]');
          actividades = response;
        } else if (response.data && Array.isArray(response.data)) {
          console.log('Formato de respuesta: { data: [...] }');
          actividades = response.data;
        } else {
          // Intentar extraer datos si la respuesta es un objeto
          if (typeof response === 'object' && response !== null) {
            // Buscar cualquier propiedad que sea un array
            for (const key in response) {
              if (Array.isArray(response[key])) {
                console.log(`Encontrado array en la propiedad '${key}'`);
                actividades = response[key];
                break;
              }
            }
          }
          
          if (actividades.length === 0) {
            console.log('Formato de respuesta desconocido:', response);
          }
        }
      }
      
      // Ordenar actividades por fecha y hora (más recientes primero)
      actividades.sort((a, b) => {
        // Primero comparar por fecha
        const fechaA = new Date(a.fecha || '').getTime();
        const fechaB = new Date(b.fecha || '').getTime();
        
        if (fechaA !== fechaB) return fechaB - fechaA;
        
        // Si las fechas son iguales, comparar por hora
        const horaA = a.hora_inicio || '';
        const horaB = b.hora_inicio || '';
        return horaB.localeCompare(horaA);
      });
      
      console.log('Actividades procesadas:', actividades.length);
      return actividades;
    } catch (error) {
      console.error('Error al obtener actividades supervisadas:', error);
      return [];
    }
  }
}

export default ActividadesService;
