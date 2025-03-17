import React from 'react';
import ApiService from './api.service';
import { API_CONFIG } from '../config/api.config';
import ActividadesService, { ActividadReciente } from './actividades.service';

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

export interface DatoGrafico {
  name: string;
  value: number;
  color?: string;
}

export interface DatoBarras {
  name: string;
  completadas: number;
  pendientes: number;
}

export interface EstadisticaResumen {
  titulo: string;
  valor: number;
  total?: number;
  icono?: string | React.ReactElement; // Acepta tanto string como componentes React
  color: string;
  subtexto?: string;
  tendencia?: 'subida' | 'bajada' | 'estable';
  porcentaje?: number;
}

export interface DashboardData {
  proyectos: ProyectoResumen[];
  supervisados: SupervisadoResumen[];
  estadisticas: EstadisticaResumen[];
  datosGraficoPie: DatoGrafico[];
  datosGraficoBarras: DatoBarras[];
  actividadesRecientes: ActividadReciente[];
}

class DashboardService {
  // Obtener todos los datos del dashboard (método combinado)
  static async getDashboardData(esSupevisor = false, idUsuario?: string): Promise<Partial<DashboardData>> {
    // Obtenemos datos de múltiples endpoints y los combinamos
    try {
      const [estadisticas, proyectos, actividades] = await Promise.all([
        this.getEstadisticas(),
        this.getProyectosActivos(esSupevisor, idUsuario),
        ActividadesService.getActividadesRecientes()
      ]);
      
      // Intentamos obtener supervisados si el usuario tiene permisos
      let supervisados: SupervisadoResumen[] = [];
      try {
        supervisados = await this.getSupervisados();
      } catch (error) {
        console.log('El usuario no tiene permisos para ver supervisados o no hay datos');
      }
      
      return {
        estadisticas,
        proyectos,
        supervisados,
        actividadesRecientes: actividades,
        datosGraficoPie: await this.getDatosGraficoPie(),
        datosGraficoBarras: await this.getDatosGraficoBarras()
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      throw error;
    }
  }

  // Obtener estadísticas para las tarjetas
  static async getEstadisticas(): Promise<EstadisticaResumen[]> {
    // Creamos estadísticas basadas en datos reales de la API
    try {
      // Obtenemos datos de actividades y proyectos
      // Usamos fechas actuales (no futuras)
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];
      const fechaInicio = new Date(hoy);
      fechaInicio.setDate(fechaInicio.getDate() - 7);
      const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
      
      // Obtenemos datos de estadísticas diarias
      let actividadesDiarias: {estadisticas: Array<{fecha: string, total: number}>} = {estadisticas: []};
      try {
        // Incluimos ambos parámetros: fechaInicio y fechaFin
        const actividadesDiariasResponse = await ApiService.get<{estadisticas: Array<{fecha: string, total: number}>}>(
          `${API_CONFIG.ENDPOINTS.ESTADISTICAS.BASE}/actividades/diarias?fechaInicio=${fechaInicioStr}&fechaFin=${fechaHoy}`
        );
        if (actividadesDiariasResponse && actividadesDiariasResponse.estadisticas) {
          actividadesDiarias = actividadesDiariasResponse;
        } 
      } catch (e) {
        console.warn('Error al obtener estadísticas diarias:', e);
      }
      
      // Obtenemos estadísticas de proyectos
      let estadisticasProyectos: {estadisticas: Array<{nombre: string, total: number}>} = {estadisticas: []};
      try {
        const estadisticasProyectosResponse = await ApiService.get<{estadisticas: Array<{nombre: string, total: number}>}>(`${API_CONFIG.ENDPOINTS.ESTADISTICAS.BASE}/actividades/proyectos`);
        if (estadisticasProyectosResponse && estadisticasProyectosResponse.estadisticas) {
          estadisticasProyectos = estadisticasProyectosResponse;
        }
      } catch (e) {
        console.warn('Error al obtener estadísticas de proyectos:', e);
      }
      
      const totalProyectos = estadisticasProyectos.estadisticas.length || 0;
      
      // Calculamos actividades pendientes
      let pendientesHoy = 0;
      try {
        // Obtenemos todas las actividades y filtramos localmente
        const actividadesResponse = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/usuario?estado=pendiente`);
        
        // Verificamos si la respuesta tiene el formato esperado
        let actividades = [];
        if (actividadesResponse && actividadesResponse.actividades && Array.isArray(actividadesResponse.actividades)) {
          actividades = actividadesResponse.actividades;
        } else if (Array.isArray(actividadesResponse)) {
          actividades = actividadesResponse;
        }
        
        // Filtramos actividades pendientes para hoy
        pendientesHoy = actividades.filter((a: {fecha?: string, fecha_limite?: string}) => {
          // Verificamos si tiene fecha y coincide con hoy
          const fechaActividad = a.fecha || a.fecha_limite;
          if (!fechaActividad) return false;
          
          return new Date(fechaActividad).toISOString().split('T')[0] === fechaHoy;
        }).length;
      } catch (e) {
        console.warn('Error al obtener actividades pendientes:', e);
      }
      
      // Calculamos tasa de completitud
      const completadas = actividadesDiarias.estadisticas.reduce((acc: number, curr: any) => acc + curr.total, 0) || 0;
      const tasaCompletitud = completadas > 0 ? Math.round((completadas / (completadas + pendientesHoy)) * 100) : 0;
      
      // Obtenemos actividades de hoy con estado 'enviado'
      let actividadesHoy = 0;
      try {
        // Primero intentamos obtener las actividades de hoy usando el mismo método que para el modal
        const proyectosHoy = await this.getActividadesHoy();
        // Contamos el total de actividades en todos los proyectos
        actividadesHoy = proyectosHoy.reduce((total, proyecto) => total + proyecto.actividades.length, 0);
        console.log('Total actividades hoy (desde getActividadesHoy):', actividadesHoy);
        
        // Si no hay actividades, intentamos con el endpoint original como respaldo
        if (actividadesHoy === 0) {
          const actividadesHoyResponse = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/usuario?estado=enviado&fecha=${fechaHoy}`);
          
          // Verificamos si la respuesta tiene el formato esperado
          let actividades = [];
          if (actividadesHoyResponse && actividadesHoyResponse.actividades && Array.isArray(actividadesHoyResponse.actividades)) {
            actividades = actividadesHoyResponse.actividades;
          } else if (actividadesHoyResponse && actividadesHoyResponse.data && Array.isArray(actividadesHoyResponse.data)) {
            actividades = actividadesHoyResponse.data;
          } else if (Array.isArray(actividadesHoyResponse)) {
            actividades = actividadesHoyResponse;
          }
          
          console.log('Actividades de hoy recibidas (endpoint original):', actividades);
          actividadesHoy = actividades.length;
          
          // Si aún no hay actividades, intentamos con un endpoint alternativo
          if (actividadesHoy === 0) {
            const alternativeResponse = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}?estado=enviado&fecha=${fechaHoy}`);
            
            let actividades = [];
            if (alternativeResponse && alternativeResponse.actividades && Array.isArray(alternativeResponse.actividades)) {
              actividades = alternativeResponse.actividades;
            } else if (alternativeResponse && alternativeResponse.data && Array.isArray(alternativeResponse.data)) {
              actividades = alternativeResponse.data;
            } else if (Array.isArray(alternativeResponse)) {
              actividades = alternativeResponse;
            }
            
            console.log('Actividades de hoy (endpoint alternativo):', actividades);
            actividadesHoy = actividades.length;
          }
        }
      } catch (e) {
        console.warn('Error al obtener actividades de hoy:', e);
      }
      
      console.log('Total actividades hoy contadas (final):', actividadesHoy);
      
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
          icono: 'PendingActions',
          color: '#f9a825', // warning.main
          subtexto: 'Plazo: Hoy',
          tendencia: pendientesHoy > 0 ? 'bajada' : 'subida',
          porcentaje: 15
        },
        {
          titulo: 'Proyectos',
          valor: totalProyectos,
          icono: 'FolderSpecial',
          color: '#2196f3', // info.main
          subtexto: 'En progreso',
          tendencia: 'estable'
        },
        {
          titulo: 'Tasa de Completitud',
          valor: tasaCompletitud,
          total: 100,
          icono: 'CheckCircle',
          color: '#4caf50', // success.main
          subtexto: 'Últimos 7 días',
          tendencia: 'subida',
          porcentaje: 12
        }
      ];
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      // Retornamos datos de respaldo en caso de error
      return [
        { titulo: 'Actividades Hoy', valor: 0, icono: 'Today', color: '#3f51b5', subtexto: 'Completadas hoy', tendencia: 'estable' },
        { titulo: 'Pendientes', valor: 0, icono: 'PendingActions', color: '#f9a825', subtexto: 'Plazo: Hoy', tendencia: 'estable' },
        { titulo: 'Proyectos', valor: 0, icono: 'FolderSpecial', color: '#2196f3', subtexto: 'En progreso', tendencia: 'estable' },
        { titulo: 'Tasa de Completitud', valor: 0, total: 100, icono: 'CheckCircle', color: '#4caf50', subtexto: 'Últimos 7 días', tendencia: 'estable' }
      ];
    }
  }

  // Obtener proyectos activos
  static async getProyectosActivos(esSupevisor = false, idUsuario?: string): Promise<ProyectoResumen[]> {
    try {
      // Importar la configuración de la API
      console.log('Obteniendo proyectos activos, supervisor:', esSupevisor, 'idUsuario:', idUsuario);
      
      // Usar el mismo endpoint que en GestionProyectos.tsx
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}`);
      console.log('Respuesta de proyectos:', response);
      
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
      
      console.log('Proyectos obtenidos:', proyectos);
      
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
      
      // Filtrar proyectos según el rol
      let resultado = proyectosFormateados;
      
      if (esSupevisor) {
        // Para supervisores, filtrar por proyectos donde activo=true
        console.log('Filtrando proyectos para supervisor');
        resultado = proyectosFormateados.filter(proyecto => 
          proyecto.activo === true || 
          proyecto.estado === 'activo' || 
          proyecto.estado === 'en_progreso'
        );
        
        // Si no hay proyectos que cumplan con los criterios, mostrar todos
        if (resultado.length === 0 && proyectosFormateados.length > 0) {
          console.log('No hay proyectos que cumplan con los criterios, mostrando todos');
          resultado = proyectosFormateados;
        }
        
        console.log('Proyectos filtrados para supervisor:', resultado);
        // Limitar a máximo 3 proyectos para supervisores
        resultado = resultado.slice(0, 3);
      }
      
      console.log('Proyectos a mostrar (final):', resultado);
      return resultado;
    } catch (error) {
      console.error('Error al obtener proyectos activos:', error);
      return [];
    }
  }

  // Obtener supervisados con actividades pendientes
  static async getSupervisados(): Promise<SupervisadoResumen[]> {
    try {
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

  // Obtener datos para el gráfico de pie
  static async getDatosGraficoPie(): Promise<DatoGrafico[]> {
    try {
      // Obtenemos todas las actividades del usuario
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/usuario`);
      
      // Verificamos si la respuesta tiene el formato esperado
      let actividades: any[] = [];
      if (response) {
        if (response.actividades && Array.isArray(response.actividades)) {
          actividades = response.actividades;
        } else if (Array.isArray(response)) {
          actividades = response;
        }
      }
      
      // Contamos por estado (basado en los datos disponibles)
      const completadas = actividades.filter(a => a.estado === 'completada').length;
      const enProceso = actividades.filter(a => a.estado === 'en_proceso' || a.estado === 'enviado').length;
      const pendientes = actividades.filter(a => a.estado === 'pendiente').length;
      
      return [
        { name: 'Completadas', value: completadas, color: '#4caf50' }, // success.main
        { name: 'En proceso', value: enProceso, color: '#2196f3' }, // info.main
        { name: 'Pendientes', value: pendientes, color: '#f9a825' } // warning.main
      ];
    } catch (error) {
      console.error('Error al obtener datos para gráfico de pie:', error);
      // Retornamos datos de respaldo en caso de error
      return [
        { name: 'Completadas', value: 0, color: '#4caf50' },
        { name: 'En proceso', value: 0, color: '#2196f3' },
        { name: 'Pendientes', value: 0, color: '#f9a825' }
      ];
    }
  }

  // Obtener datos para el gráfico de barras
  static async getDatosGraficoBarras(): Promise<DatoBarras[]> {
    try {
      // Obtenemos estadísticas diarias de la última semana
      const fechaHoy = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 6); // Últimos 7 días incluyendo hoy
      
      const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
      const fechaHoyStr = fechaHoy.toISOString().split('T')[0];
      
      // Obtenemos estadísticas diarias
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ESTADISTICAS.BASE}/actividades/diarias?fechaInicio=${fechaInicioStr}&fechaFin=${fechaHoyStr}`);
      
      // Verificamos si la respuesta tiene el formato esperado
      let estadisticas: Array<{fecha: string, total: number}> = [];
      if (response) {
        if (response.estadisticas && Array.isArray(response.estadisticas)) {
          estadisticas = response.estadisticas;
        } else if (Array.isArray(response)) {
          estadisticas = response;
        }
      }
      
      // Obtenemos actividades pendientes por día
      let actividadesPendientes: any[] = [];
      try {
        const pendientesResponse = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/usuario?estado=pendiente`);
        
        if (pendientesResponse) {
          if (pendientesResponse.actividades && Array.isArray(pendientesResponse.actividades)) {
            actividadesPendientes = pendientesResponse.actividades;
          } else if (Array.isArray(pendientesResponse)) {
            actividadesPendientes = pendientesResponse;
          }
        }
      } catch (e) {
        console.warn('No se pudieron obtener actividades pendientes:', e);
      }
      
      // Creamos un mapa para contar pendientes por día
      const pendientesPorDia = new Map();
      actividadesPendientes.forEach(actividad => {
        if (actividad.fecha || actividad.fecha_limite) {
          const fechaActividad = actividad.fecha || actividad.fecha_limite;
          try {
            const fecha = new Date(fechaActividad).toISOString().split('T')[0];
            pendientesPorDia.set(fecha, (pendientesPorDia.get(fecha) || 0) + 1);
          } catch (e) {
            console.warn(`Fecha inválida en actividad: ${fechaActividad}`, e);
          }
        }
      });
      
      // Generamos datos para cada día de la semana
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const resultado: DatoBarras[] = [];
      
      // Iteramos por cada día en el rango
      const fechaActual = new Date(fechaInicio);
      while (fechaActual <= fechaHoy) {
        const fechaStr = fechaActual.toISOString().split('T')[0];
        const diaSemana = diasSemana[fechaActual.getDay()];
        
        // Buscamos estadísticas para este día
        const estadisticaDia = estadisticas.find((e: any) => e.fecha === fechaStr);
        const completadas = estadisticaDia ? estadisticaDia.total : 0;
        const pendientes = pendientesPorDia.get(fechaStr) || 0;
        
        resultado.push({
          name: diaSemana,
          completadas,
          pendientes
        });
        
        // Avanzamos al siguiente día
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
      
      return resultado;
    } catch (error) {
      console.error('Error al obtener datos para gráfico de barras:', error);
      // Retornamos datos de respaldo en caso de error
      const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      return diasSemana.map(dia => ({
        name: dia,
        completadas: 0,
        pendientes: 0
      }));
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
      const response = await ApiService.get<any>(`${API_CONFIG.ENDPOINTS.ACTIVIDADES.BASE}/supervisados?fechaInicio=${hoy}&fechaFin=${hoy}&estado=enviado`);
      
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

      console.log('Actividades recibidas de la API:', actividades);

      // Agrupar por proyecto
      const proyectosMap = new Map();
      
      actividades.forEach(actividad => {
        // Verificar si tenemos la información necesaria del proyecto
        const proyectoId = actividad.proyecto_id || actividad.proyectoId || actividad.id_proyecto;
        const proyectoNombre = actividad.proyecto_nombre || actividad.proyectoNombre || actividad.nombre_proyecto || 'Proyecto sin nombre';
        
        if (!proyectoId) return;

        if (!proyectosMap.has(proyectoId)) {
          proyectosMap.set(proyectoId, {
            id: proyectoId,
            nombre: proyectoNombre,
            actividades: []
          });
        }

        const proyecto = proyectosMap.get(proyectoId);
        
        // Extraer información de usuario con manejo de diferentes formatos de respuesta
        const usuarioId = actividad.usuario_id || actividad.usuarioId || actividad.id_usuario;
        const usuarioNombre = actividad.usuario_nombre || actividad.usuarioNombre || actividad.nombre_usuario || 'Usuario';
        
        proyecto.actividades.push({
          id: actividad.id || `temp-${Date.now()}-${Math.random()}`,
          titulo: actividad.descripcion || actividad.titulo || actividad.nombre || 'Sin título',
          estado: 'enviado',
          hora: actividad.hora_inicio || actividad.horaInicio || actividad.hora || '00:00',
          usuario: {
            id: usuarioId || 'unknown',
            nombre: usuarioNombre,
            avatar: actividad.usuario_avatar || actividad.usuarioAvatar || actividad.avatar
          }
        });
      });

      const proyectos = Array.from(proyectosMap.values());
      console.log('Proyectos procesados para el modal:', proyectos);
      return proyectos;
    } catch (error) {
      console.error('Error al obtener actividades de hoy:', error);
      return [];
    }
  }
}

export default DashboardService;

