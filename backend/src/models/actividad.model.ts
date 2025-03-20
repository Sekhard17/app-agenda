// src/models/actividad.model.ts
// Este modelo maneja la interacción con la tabla de actividades en la base de datos

import supabase from '../config/supabase'
import { Actividad as ActividadType, ActividadCrear, ActividadActualizar } from '../types/actividades.types'

// Obtener una actividad por ID
export const obtenerActividadPorId = async (id: string) => {
  const { data, error } = await supabase
    .from('actividades')
    .select('*, proyectos(nombre), usuarios(id, nombres, appaterno, apmaterno, nombre_usuario)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Obtener actividades de un usuario
export const obtenerActividadesPorUsuario = async (usuarioId: string, fecha?: Date, estado?: string) => {
  let query = supabase
    .from('actividades')
    .select('*, proyectos(nombre), usuarios(id, nombres, appaterno, apmaterno, nombre_usuario)')
    .eq('id_usuario', usuarioId)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: true })

  if (fecha) {
    const fechaStr = fecha.toISOString().split('T')[0]
    query = query.eq('fecha', fechaStr)
  }

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Obtener actividades en un rango de fechas
export const obtenerActividadesPorRango = async (usuarioId: string, fechaInicio: Date, fechaFin: Date, estado: string = 'enviado') => {
  const fechaInicioStr = fechaInicio.toISOString().split('T')[0]
  const fechaFinStr = fechaFin.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('actividades')
    .select('*, proyectos(nombre), usuarios(id, nombres, appaterno, apmaterno, nombre_usuario)')
    .eq('id_usuario', usuarioId)
    .eq('estado', estado)
    .gte('fecha', fechaInicioStr)
    .lte('fecha', fechaFinStr)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: true })

  if (error) throw error
  return data
}

// Crear una nueva actividad
export const crearActividad = async (actividad: ActividadCrear) => {
  const { data, error } = await supabase
    .from('actividades')
    .insert([actividad])
    .select()
    .single()

  if (error) throw error
  return data
}

// Actualizar una actividad
export const actualizarActividad = async (id: string, actividad: ActividadActualizar) => {
  const { data, error } = await supabase
    .from('actividades')
    .update({
      ...actividad,
      fecha_actualizacion: new Date()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Eliminar una actividad
export const eliminarActividad = async (id: string) => {
  const { error } = await supabase
    .from('actividades')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Enviar actividades (cambiar estado a 'enviado')
export const enviarActividades = async (ids: string[]) => {
  const { data, error } = await supabase
    .from('actividades')
    .update({
      estado: 'enviado',
      fecha_actualizacion: new Date()
    })
    .in('id', ids)
    .select()

  if (error) throw error
  return data
}

// Verificar superposición de horarios
export const verificarSuperposicionHorarios = async (
  usuarioId: string,
  fecha: Date,
  horaInicio: string,
  horaFin: string,
  actividadId?: string
) => {
  const fechaStr = fecha.toISOString().split('T')[0]
  
  // Convertir las horas a formato de 24 horas para comparación
  const formatearHora = (hora: string): string => {
    // Si ya está en formato de 24 horas (HH:MM), devolverlo tal cual
    if (/^\d{1,2}:\d{2}$/.test(hora)) {
      return hora.padStart(5, '0'); // Asegurar formato HH:MM
    }
    
    // Si está en formato de 12 horas (HH:MM AM/PM), convertirlo
    const [timePart, modifier] = hora.split(' ');
    let [hours, minutes] = timePart.split(':');
    
    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12';
    } else if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  };
  
  const horaInicioFormateada = formatearHora(horaInicio);
  const horaFinFormateada = formatearHora(horaFin);
  
  // Consulta para verificar superposición
  // Una actividad se superpone si:
  // 1. La hora de inicio está entre la hora de inicio y fin de otra actividad, o
  // 2. La hora de fin está entre la hora de inicio y fin de otra actividad, o
  // 3. La actividad abarca completamente a otra actividad
  let query = supabase
    .from('actividades')
    .select('id, hora_inicio, hora_fin, estado')
    .eq('id_usuario', usuarioId)
    .eq('fecha', fechaStr)
    .neq('estado', 'enviado') // Excluir actividades con estado 'enviado'
    .or(
      `and(hora_inicio.lte.${horaInicioFormateada},hora_fin.gt.${horaInicioFormateada}),` +
      `and(hora_inicio.lt.${horaFinFormateada},hora_fin.gte.${horaFinFormateada}),` +
      `and(hora_inicio.gte.${horaInicioFormateada},hora_fin.lte.${horaFinFormateada})`
    )

  if (actividadId) {
    query = query.neq('id', actividadId)
  }

  const { data, error } = await query

  if (error) throw error
  
  // Para depuración, imprimir las actividades que causan superposición
  if (data && data.length > 0) {
    console.log('Superposición detectada con las siguientes actividades:');
    data.forEach(act => {
      console.log(`ID: ${act.id}, Hora inicio: ${act.hora_inicio}, Hora fin: ${act.hora_fin}, Estado: ${act.estado || 'proceso'}`);
    });
    console.log(`Nueva actividad: Hora inicio: ${horaInicio}, Hora fin: ${horaFin}`);
  } else {
    console.log('No se detectaron superposiciones con actividades en proceso.');
  }
  
  return data && data.length > 0
}

// Obtener actividades de supervisados
export const obtenerActividadesSupervisados = async (
  supervisorId: string,
  fechaInicio?: Date,
  fechaFin?: Date,
  usuarioId?: string,
  proyectoId?: string,
  estado?: string
) => {
  console.log('Buscando actividades supervisadas para el supervisor:', supervisorId);
  console.log('Filtros aplicados:', { 
    fechaInicio: fechaInicio ? fechaInicio.toISOString() : undefined, 
    fechaFin: fechaFin ? fechaFin.toISOString() : undefined, 
    usuarioId, 
    proyectoId, 
    estado 
  });
  
  // Primero verificar si el supervisor tiene usuarios asignados
  const { data: usuariosSupervisados, error: errorUsuarios } = await supabase
    .from('usuarios')
    .select('id, nombres, appaterno')
    .eq('id_supervisor', supervisorId);
    
  if (errorUsuarios) {
    console.error('Error al buscar usuarios supervisados:', errorUsuarios);
    throw errorUsuarios;
  }
  
  console.log(`El supervisor ${supervisorId} tiene ${usuariosSupervisados?.length || 0} usuarios asignados:`, usuariosSupervisados);
  
  if (!usuariosSupervisados || usuariosSupervisados.length === 0) {
    console.log('El supervisor no tiene usuarios asignados, retornando array vacío');
    return [];
  }
  
  // Obtener IDs de los usuarios supervisados
  const idsUsuariosSupervisados = usuariosSupervisados.map(u => u.id);
  console.log('IDs de usuarios supervisados:', idsUsuariosSupervisados);
  
  // Construir la consulta para obtener todas las actividades de los usuarios supervisados
  let query = supabase
    .from('actividades')
    .select(`
      *,
      proyectos(nombre),
      usuarios(id, nombres, appaterno, apmaterno, nombre_usuario)
    `)
    .in('id_usuario', idsUsuariosSupervisados) // Filtrar por los IDs de usuarios supervisados
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: true })

  if (fechaInicio && fechaFin) {
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0]
    const fechaFinStr = fechaFin.toISOString().split('T')[0]
    query = query.gte('fecha', fechaInicioStr).lte('fecha', fechaFinStr)
    console.log(`Filtrando por fecha: ${fechaInicioStr} a ${fechaFinStr}`);
  }

  if (usuarioId) {
    query = query.eq('id_usuario', usuarioId)
    console.log(`Filtrando por usuario: ${usuarioId}`);
  }

  if (proyectoId) {
    query = query.eq('id_proyecto', proyectoId)
    console.log(`Filtrando por proyecto: ${proyectoId}`);
  }
  
  // Filtrar por estado
  if (estado) {
    // Si se proporciona un estado específico, filtrar por ese estado
    query = query.eq('estado', estado)
    console.log(`Filtrando por estado especificado: ${estado}`);
  } else {
    // Por defecto, mostrar solo actividades con estado "enviado"
    query = query.eq('estado', 'enviado')
    console.log('Filtrando por estado predeterminado: enviado');
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener actividades supervisadas:', error);
    throw error;
  }
  
  console.log(`Se encontraron ${data?.length || 0} actividades supervisadas`);
  return data || [];
}

// Interfaz para actividades
export interface IActividad {
  id: string;
  id_usuario: string;
  fecha: Date;
  hora_inicio: string;
  hora_fin: string;
  descripcion: string;
  id_proyecto?: string;
  estado: 'borrador' | 'enviado';
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

// Obtener actividades por proyecto
export const obtenerActividadesPorProyecto = async (proyectoId: string): Promise<IActividad[]> => {
  const { data, error } = await supabase
    .from('actividades')
    .select(`
      *,
      usuarios (
        nombres,
        appaterno
      )
    `)
    .eq('id_proyecto', proyectoId)
    .order('fecha', { ascending: false });

  if (error) throw error;

  return data.map(actividad => ({
    ...actividad,
    usuario: actividad.usuarios ? `${actividad.usuarios.nombres} ${actividad.usuarios.appaterno}` : 'Usuario no encontrado'
  }));
};