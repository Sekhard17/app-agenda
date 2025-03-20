import React from 'react';
import ApiService from './api.service';
import { API_CONFIG } from '../config/api.config';
import ActividadesService, { ActividadReciente } from './actividades.service';
import AuthService from './auth.service';

// Interfaces para los tipos de datos que retorna la API
export interface Actividad {
  id: string;
  titulo: string;
  estado: 'enviado';
  hora: string;
  usuario: {
    id: string;
    nombre: string;
    avatar?: string;
  };
}

export interface Proyecto {
  id: string;
  nombre: string;
  actividades: Actividad[];
}

export interface ProyectoResumen {
  id: string;
  nombre: string;
  progreso: number;
  actividades_totales: number;
  actividades_completadas: number;
  fecha_limite?: string;
  estado?: string;
  activo?: boolean;
  id_supervisor?: string;
  responsable_id?: string;
}

export interface SupervisadoResumen {
  id: string;
  nombre: string;
  avatar?: string;
  actividades_pendientes: number;
  ultima_actividad?: string;
  proyecto_principal?: string;
  total_proyectos?: number;
}

// La interfaz ActividadReciente ahora se importa desde actividades.service.ts

export interface EstadisticaResumen {
  titulo: string;
  valor: number;
  total?: number;
  color: string;
  icono: string | React.ReactElement;
  subtexto: string;
  tendencia: 'subida' | 'bajada' | 'estable';
  porcentaje?: number;
}

export interface DashboardData {
  estadisticas: EstadisticaResumen[];
  proyectos: ProyectoResumen[];
  supervisados: SupervisadoResumen[];
  actividadesRecientes: ActividadReciente[];
}

class DashboardService {
  // Obtener todos los datos del dashboard (método combinado)
  static async getDashboardData(esSupevisor = false, idUsuario?: string): Promise<Partial<DashboardData>> {
    // Obtenemos datos de múltiples endpoints y los combinamos
    try {
      // Verificar si el usuario es supervisor (usando el parámetro o verificando directamente)
      if (esSupevisor === undefined) {
        const usuarioActual = await AuthService.getCurrentUser();
        esSupevisor = usuarioActual?.rol === 'supervisor';
      }

      // Usar Promise.all para llamadas paralelas y reducir peticiones duplicadas
      const [estadisticas, proyectos, actividades] = await Promise.all([
        this.getEstadisticas(), // Ya optimizado para no hacer llamadas duplicadas
        this.getProyectosActivos(esSupevisor, idUsuario),
        ActividadesService.getActividadesRecientes()
      ]);
      
      // Obtener supervisados solo si es supervisor (esta llamada ya fue optimizada)
      let supervisados: SupervisadoResumen[] = [];
      if (esSupevisor) {
        try {
          supervisados = await this.getSupervisados();
        } catch (error) {
          console.warn('Error al obtener supervisados:', error);
        }
      }
      
      // Eliminamos las llamadas a los gráficos ya que no se están usando
      return {
        estadisticas,
        proyectos,
        supervisados,
        actividadesRecientes: actividades
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      throw error;
    }
  }

  // Este método fusionará getEstadisticas con la lógica de getActividadesHoy
  static async getEstadisticas(): Promise<EstadisticaResumen[]> {
    // Creamos estadísticas basadas en datos reales de la API
    try {
      // Obtenemos datos de actividades y proyectos
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];
      const fechaInicio = new Date(hoy);
      fechaInicio.setDate(fechaInicio.getDate() - 7);
      const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
      
      // Obtener información del usuario para saber qué endpoints usar
      const usuarioActual = await AuthService.getCurrentUser();
      const esSupervisor = usuarioActual?.rol === 'supervisor';

      // Hacer todas las llamadas en paralelo para reducir tiempo de carga
      const [
        actividadesDiariasResponse, 
        estadisticasProyectosResponse, 
        actividadesPendientesResponse,
        actividadesHoyResponse
      ] = await Promise.all([
        // Estadísticas diarias
        ApiService.get<{estadisticas: Array<{fecha: string, total: number}>}>(
          `${API_CONFIG.ENDPOINTS.ESTADISTICAS.BASE}/actividades/diarias?fechaInicio=${fechaInicioStr}&fechaFin=${fechaHoy}`
        ),
        // Estadísticas de proyectos
        ApiService.get<{estadisticas: Array<{nombre: string, total: number}>}>(
          `${API_CONFIG.ENDPOINTS.ESTADISTICAS.BASE}/actividades/proyectos`
        ),
        // Actividades pendientes
        ApiService.get<any>(
          `${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/usuario?estado=pendiente`
        ),
        // Actividades de hoy (con el endpoint adecuado según rol)
        ApiService.get<any>(
          esSupervisor 
            ? `${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/supervisados?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}&estado=enviado`
            : `${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/usuario?estado=enviado&fecha=${fechaHoy}`
        )
      ]);
      
      // Procesamos estadísticas diarias
      let actividadesDiarias: {estadisticas: Array<{fecha: string, total: number}>} = {estadisticas: []};
      if (actividadesDiariasResponse && actividadesDiariasResponse.estadisticas) {
        actividadesDiarias = actividadesDiariasResponse;
      }
      
      // Procesamos estadísticas de proyectos
      let estadisticasProyectos: {estadisticas: Array<{nombre: string, total: number}>} = {estadisticas: []};
      if (estadisticasProyectosResponse && estadisticasProyectosResponse.estadisticas) {
        estadisticasProyectos = estadisticasProyectosResponse;
      }
      
      const totalProyectos = estadisticasProyectos.estadisticas.length || 0;
      
      // Procesamos actividades pendientes
      let pendientesHoy = 0;
      let actividades = [];
      if (actividadesPendientesResponse) {
        if (actividadesPendientesResponse.actividades && Array.isArray(actividadesPendientesResponse.actividades)) {
          actividades = actividadesPendientesResponse.actividades;
        } else if (Array.isArray(actividadesPendientesResponse)) {
          actividades = actividadesPendientesResponse;
        }
        
        // Filtramos actividades pendientes para hoy
        pendientesHoy = actividades.filter((a: {fecha?: string, fecha_limite?: string}) => {
          // Verificamos si tiene fecha y coincide con hoy
          const fechaActividad = a.fecha || a.fecha_limite;
          if (!fechaActividad) return false;
          
          return new Date(fechaActividad).toISOString().split('T')[0] === fechaHoy;
        }).length;
      }
      
      // Calculamos tasa de completitud
      const completadas = actividadesDiarias.estadisticas.reduce((acc: number, curr: any) => acc + curr.total, 0) || 0;
      const tasaCompletitud = completadas > 0 ? Math.round((completadas / (completadas + pendientesHoy)) * 100) : 0;
      
      // Procesamos actividades de hoy
      let actividadesHoy = 0;
      if (actividadesHoyResponse) {
        let actividades = [];
        if (actividadesHoyResponse.actividades && Array.isArray(actividadesHoyResponse.actividades)) {
          actividades = actividadesHoyResponse.actividades;
        } else if (actividadesHoyResponse.data && Array.isArray(actividadesHoyResponse.data)) {
          actividades = actividadesHoyResponse.data;
        } else if (Array.isArray(actividadesHoyResponse)) {
          actividades = actividadesHoyResponse;
        }
        
        actividadesHoy = actividades.length;
        
        // Si aún no hay actividades y no es supervisor, intentamos con endpoint alternativo
        if (actividadesHoy === 0 && !esSupervisor) {
          try {
            const alternativeResponse = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}?estado=enviado&fecha=${fechaHoy}`);
            
            if (alternativeResponse) {
              let alternativeActividades = [];
              if (alternativeResponse.actividades && Array.isArray(alternativeResponse.actividades)) {
                alternativeActividades = alternativeResponse.actividades;
              } else if (alternativeResponse.data && Array.isArray(alternativeResponse.data)) {
                alternativeActividades = alternativeResponse.data;
              } else if (Array.isArray(alternativeResponse)) {
                alternativeActividades = alternativeResponse;
              }
              
              actividadesHoy = alternativeActividades.length;
            }
          } catch (error) {
            console.warn('Error al obtener actividades alternativas:', error);
          }
        }
      }
      
      return [
        {
          titulo: 'Actividades Hoy',
          valor: actividadesHoy,
          icono: 'Today',
          color: '#3f51b5', // primary.main
          subtexto: 'Completadas hoy',
          tendencia: 'estable'
        },
        {
          titulo: 'Pendientes',
          valor: pendientesHoy,
          icono: 'Assignment',
          color: '#f9a825', // warning.main
          subtexto: 'Actividades sin completar',
          tendencia: pendientesHoy > 5 ? 'bajada' : 'subida'
        },
        {
          titulo: 'Proyectos Activos',
          valor: totalProyectos,
          icono: 'Folder',
          color: '#2196f3', // info.main
          subtexto: 'Proyectos en curso',
          tendencia: 'estable'
        },
        {
          titulo: 'Tasa de Completitud',
          valor: tasaCompletitud,
          icono: 'PieChart',
          color: '#4caf50', // success.main
          subtexto: '%',
          tendencia: tasaCompletitud > 70 ? 'subida' : 'bajada'
        }
      ];
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      
      // Si hay error, retornar datos por defecto
      return [
        {
          titulo: 'Actividades Hoy',
          valor: 0,
          icono: 'Today',
          color: '#3f51b5',
          subtexto: 'Completadas hoy',
          tendencia: 'estable'
        },
        {
          titulo: 'Pendientes',
          valor: 0,
          icono: 'Assignment',
          color: '#f9a825',
          subtexto: 'Actividades sin completar',
          tendencia: 'estable'
        },
        {
          titulo: 'Proyectos Activos',
          valor: 0,
          icono: 'Folder',
          color: '#2196f3',
          subtexto: 'Proyectos en curso',
          tendencia: 'estable'
        },
        {
          titulo: 'Tasa de Completitud',
          valor: 0,
          icono: 'PieChart',
          color: '#4caf50',
          subtexto: '%',
          tendencia: 'estable'
        }
      ];
    }
  }

  // Obtener proyectos activos
  static async getProyectosActivos(esSupevisor = false, idUsuario?: string): Promise<ProyectoResumen[]> {
    try {
      // Importar la configuración de la API
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}`);
      
      let proyectos: ProyectoResumen[] = [];
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        proyectos = response;
      } else if (response && typeof response === 'object') {
        if (response.proyectos && Array.isArray(response.proyectos)) {
          proyectos = response.proyectos;
        } else if (response.data && Array.isArray(response.data)) {
          proyectos = response.data;
        }
      }

      // Transformar los datos al formato que espera nuestro frontend
      const proyectosFormateados = proyectos.map((proyecto: any) => {
        // Crear objeto con el formato correcto
        return {
          id: proyecto.id || '',
          nombre: proyecto.nombre || 'Proyecto sin nombre',
          progreso: Number(proyecto.porcentaje_completado || proyecto.progreso || 0),
          actividades_totales: Number(proyecto.total_actividades || proyecto.actividades_totales || 0),
          actividades_completadas: Number(proyecto.actividades_completadas || 0),
          fecha_limite: proyecto.fecha_fin || proyecto.fecha_limite || null,
          estado: proyecto.estado || 'planificado',
          activo: proyecto.activo === true || proyecto.activo === 'true',
          id_supervisor: proyecto.id_supervisor || proyecto.supervisor_id || '',
          responsable_id: proyecto.responsable_id || proyecto.id_responsable || ''
        } as ProyectoResumen;
      });
      
      // Filtrar proyectos según el rol y el usuario
      let resultado = proyectosFormateados;
      
      if (!esSupevisor && idUsuario) {
        // Para usuarios normales, filtrar por proyectos asignados
        resultado = proyectosFormateados.filter(proyecto => 
          proyecto.responsable_id === idUsuario || 
          proyecto.id_supervisor === idUsuario
        );
      } else if (esSupevisor) {
        // Para supervisores, filtrar por proyectos donde activo=true
        resultado = proyectosFormateados.filter(proyecto => 
          proyecto.activo === true || 
          proyecto.estado === 'activo' || 
          proyecto.estado === 'en_progreso'
        );
        
        // Si no hay proyectos que cumplan con los criterios, mostrar todos
        if (resultado.length === 0 && proyectosFormateados.length > 0) {
          resultado = proyectosFormateados;
        }
        
        // Limitar a máximo 3 proyectos para supervisores
        resultado = resultado.slice(0, 3);
      }
      
      return resultado;
    } catch (error) {
      console.error('Error al obtener proyectos activos:', error);
      return [];
    }
  }

  // Obtener supervisados con actividades pendientes
  static async getSupervisados(): Promise<SupervisadoResumen[]> {
    try {
      // Primero verificar si el usuario actual es supervisor
      const usuarioActual = await AuthService.getCurrentUser();
      
      // Si no es supervisor, no hacer la llamada y retornar array vacío
      if (!usuarioActual || usuarioActual.rol !== 'supervisor') {
        return [];
      }
      
      // Obtenemos actividades de supervisados
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/supervisados`);
      
      // Verificamos si la respuesta tiene el formato esperado
      let actividades: any[] = [];
      if (response) {
        if (response.actividades && Array.isArray(response.actividades)) {
          actividades = response.actividades;
        } else if (Array.isArray(response)) {
          actividades = response;
        }
      }
      
      // Si no hay actividades, retornamos un array vacío
      if (!actividades.length) {
        return [];
      }
      
      // Agrupamos por usuario y contamos pendientes
      const usuariosMap = new Map();
      
      actividades.forEach(actividad => {
        // Verificamos que la actividad tenga un usuario_id válido
        if (!actividad.usuario_id) return;
        
        if (!usuariosMap.has(actividad.usuario_id)) {
          usuariosMap.set(actividad.usuario_id, {
            id: actividad.usuario_id,
            nombre: actividad.usuario_nombre || 'Usuario',
            avatar: actividad.usuario_avatar,
            actividades_pendientes: 0,
            ultima_actividad: null
          });
        }
        
        const usuario = usuariosMap.get(actividad.usuario_id);
        
        // Contar actividades pendientes
        if (actividad.estado === 'pendiente') {
          usuario.actividades_pendientes++;
        }
        
        // Actualizar última actividad si es más reciente
        if (actividad.fecha_actualizacion && (!usuario.ultima_actividad || new Date(actividad.fecha_actualizacion) > new Date(usuario.ultima_actividad))) {
          usuario.ultima_actividad = actividad.fecha_actualizacion;
        }
      });
      
      return Array.from(usuariosMap.values());
    } catch (error) {
      console.error('Error al obtener supervisados:', error);
      // Retornamos un array vacío en caso de error
      return [];
    }
  }

  // Obtener actividades recientes
  // Este método ahora delega en ActividadesService
  static async getActividadesRecientes(nombreUsuarioActual?: string): Promise<ActividadReciente[]> {
    return ActividadesService.getActividadesRecientes(nombreUsuarioActual);
  }

  // Obtener actividades de hoy
  static async getActividadesHoy(): Promise<Proyecto[]> {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      // Obtener información del usuario actual a través de AuthService (ahora sin llamada API)
      const usuarioActual = await AuthService.getCurrentUser();
      const esSupervisor = usuarioActual?.rol === 'supervisor';
      
      // Usar endpoint diferente según el rol
      let response;
      if (esSupervisor) {
        // Si es supervisor, usar el endpoint de supervisados
        response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/supervisados?fechaInicio=${hoy}&fechaFin=${hoy}&estado=enviado`);
      } else {
        // Si es funcionario, usar el endpoint de usuario
        response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/usuario?estado=enviado&fecha=${hoy}`);
      }
      
      // Verificar si la respuesta tiene el formato esperado
      let actividades: any[] = [];
      if (response) {
        if (response.actividades && Array.isArray(response.actividades)) {
          actividades = response.actividades;
        } else if (response.data && Array.isArray(response.data)) {
          actividades = response.data;
        } else if (Array.isArray(response)) {
          actividades = response;
        }
      }

      // Agrupar por proyecto
      const proyectosMap = new Map();
      
      actividades.forEach(actividad => {
        // Verificar si tenemos la información necesaria del proyecto
        const proyectoId = actividad.id_proyecto || actividad.proyecto_id || actividad.proyectoId;
        const proyectoNombre = actividad.proyectos?.nombre || actividad.proyecto_nombre || actividad.nombre_proyecto || 'Sin proyecto asignado';
        
        if (!proyectoId) return;

        if (!proyectosMap.has(proyectoId)) {
          proyectosMap.set(proyectoId, {
            id: proyectoId,
            nombre: proyectoNombre,
            actividades: []
          });
        }

        const proyecto = proyectosMap.get(proyectoId);
        
        // Construir el nombre completo del usuario
        const nombreCompleto = actividad.usuarios ? 
          `${actividad.usuarios.nombres || ''} ${actividad.usuarios.appaterno || ''}${actividad.usuarios.apmaterno ? ` ${actividad.usuarios.apmaterno}` : ''}`.trim() :
          actividad.usuario_nombre || 
          actividad.nombre_usuario || 
          'Usuario sin nombre';

        // Extraer información de usuario con manejo de diferentes formatos de respuesta
        const usuarioId = actividad.usuario_id || actividad.id_usuario || actividad.usuarioId;
        const avatar = actividad.usuarios?.avatar || actividad.usuario_avatar || actividad.avatar;
        
        proyecto.actividades.push({
          id: actividad.id || `temp-${Date.now()}-${Math.random()}`,
          titulo: actividad.descripcion || actividad.titulo || actividad.nombre || 'Sin título',
          estado: 'enviado',
          hora: actividad.hora_inicio || actividad.horaInicio || actividad.hora || '00:00',
          usuario: {
            id: usuarioId || 'unknown',
            nombre: nombreCompleto,
            avatar: avatar
          }
        });
      });

      const proyectos = Array.from(proyectosMap.values());
      return proyectos;
    } catch (error) {
      console.error('Error al obtener actividades de hoy:', error);
      return [];
    }
  }
}

export default DashboardService;

