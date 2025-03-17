// src/controllers/actividades.controller.ts
// Este controlador maneja las operaciones para actividades

import { Request, Response } from 'express'
import * as actividadesService from '../services/actividades.service'
import { ActividadCrear, ActividadActualizar } from '../types/actividades.types'

// Obtener una actividad por ID
export const getActividad = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const usuarioId = req.usuario?.id
    const esSupervisor = req.usuario?.rol === 'supervisor'
    
    if (!usuarioId) {
      return res.status(401).json({ message: 'No autorizado' })
    }
    
    const actividad = await actividadesService.obtenerActividad(id, usuarioId, esSupervisor)
    res.json({ actividad })
  } catch (error: any) {
    console.error('Error al obtener actividad:', error)
    res.status(404).json({ message: error.message || 'Error al obtener actividad' })
  }
}

// Obtener actividades del usuario actual
export const getActividadesUsuario = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.usuario?.id
    const fecha = req.query.fecha ? new Date(req.query.fecha as string) : undefined
    const estado = req.query.estado as string | undefined
    
    if (!usuarioId) {
      return res.status(401).json({ message: 'No autorizado' })
    }
    
    const actividades = await actividadesService.obtenerActividadesUsuario(usuarioId, fecha, estado)
    res.json({ actividades })
  } catch (error: any) {
    console.error('Error al obtener actividades:', error)
    res.status(500).json({ message: error.message || 'Error al obtener actividades' })
  }
}

// Obtener actividades en un rango de fechas
export const getActividadesPorRango = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.usuario?.id
    const { fechaInicio, fechaFin } = req.params
    const { estado } = req.query
    
    if (!usuarioId) {
      return res.status(401).json({ message: 'No autorizado' })
    }
    
    const actividades = await actividadesService.obtenerActividadesPorRango(
      usuarioId,
      new Date(fechaInicio),
      new Date(fechaFin),
      estado as string
    )
    
    res.json({ actividades })
  } catch (error: any) {
    console.error('Error al obtener actividades por rango:', error)
    res.status(500).json({ message: error.message || 'Error al obtener actividades' })
  }
}

// Crear una nueva actividad
export const crearActividad = async (req: Request, res: Response): Promise<void> => {
  try {
    const actividadData = req.body as ActividadCrear
    const usuarioId = req.usuario?.id
    
    if (!usuarioId) {
      res.status(401).json({ message: 'No autorizado' })
      return
    }
    
    // Asegurar que la actividad se cree para el usuario autenticado
    actividadData.id_usuario = usuarioId
    
    // Validar que las horas sean correctas
    const horaInicio = actividadData.hora_inicio;
    const horaFin = actividadData.hora_fin;

    // Validar formato de horas (opcional, dependiendo de cómo se envíen desde el frontend)
    const validarFormatoHora = (hora: string): boolean => {
      // Aceptar formato 24h (HH:MM) o 12h (HH:MM AM/PM)
      return /^\d{1,2}:\d{2}(\s[AP]M)?$/.test(hora);
    };

    if (!validarFormatoHora(horaInicio) || !validarFormatoHora(horaFin)) {
      res.status(400).json({ message: 'Formato de hora inválido. Use HH:MM o HH:MM AM/PM' });
      return;
    }

    // Validar que hora fin sea posterior a hora inicio
    const compararHoras = (hora1: string, hora2: string): boolean => {
      // Convertir a formato de 24 horas para comparación
      const formatearHora = (hora: string): string => {
        // Si ya está en formato de 24 horas (HH:MM), devolverlo tal cual
        if (!/\s[AP]M$/.test(hora)) {
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

      return formatearHora(hora1) < formatearHora(hora2);
    };

    if (!compararHoras(horaInicio, horaFin)) {
      res.status(400).json({ message: 'La hora de fin debe ser posterior a la hora de inicio' });
      return;
    }
    
    const actividad = await actividadesService.crearActividad(actividadData)
    res.status(201).json({
      message: 'Actividad creada exitosamente',
      actividad
    })
  } catch (error: any) {
    console.error('Error al crear actividad:', error)
    if (!res.headersSent) {
      // Mejorar los mensajes de error para ser más descriptivos
      let mensaje = error.message || 'Error al crear actividad';
      let statusCode = 500;
      let errorCode = null;
      
      if (error.message?.includes('fechas pasadas')) {
        mensaje = 'No se pueden crear actividades para fechas pasadas. La fecha debe ser igual o posterior a hoy.';
        statusCode = 400;
        errorCode = 'fecha_pasada';
      } else if (error.message?.includes('superpone')) {
        mensaje = 'La actividad se superpone con otra actividad existente. Por favor, elija un horario diferente.';
        statusCode = 400;
        errorCode = 'superposicion_horarios';
      }
      
      const respuesta: any = { message: mensaje };
      if (errorCode) {
        respuesta.errorCode = errorCode;
      }
      
      res.status(statusCode).json(respuesta);
    }
  }
}

// Actualizar una actividad
export const actualizarActividad = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const actividadData = req.body as ActividadActualizar
    const usuarioId = req.usuario?.id
    
    if (!usuarioId) {
      return res.status(401).json({ message: 'No autorizado' })
    }
    
    const actividad = await actividadesService.actualizarActividad(id, actividadData, usuarioId)
    res.json({
      message: 'Actividad actualizada exitosamente',
      actividad
    })
  } catch (error: any) {
    console.error('Error al actualizar actividad:', error)
    res.status(400).json({ message: error.message || 'Error al actualizar actividad' })
  }
}

// Eliminar una actividad
export const eliminarActividad = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const usuarioId = req.usuario?.id
    
    if (!usuarioId) {
      return res.status(401).json({ message: 'No autorizado' })
    }
    
    await actividadesService.eliminarActividad(id, usuarioId)
    res.json({ message: 'Actividad eliminada exitosamente' })
  } catch (error: any) {
    console.error('Error al eliminar actividad:', error)
    res.status(400).json({ message: error.message || 'Error al eliminar actividad' })
  }
}

// Enviar actividades
export const enviarActividades = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body
    const usuarioId = req.usuario?.id
    
    if (!usuarioId) {
      return res.status(401).json({ message: 'No autorizado' })
    }
    
    const actividades = await actividadesService.enviarActividades(ids, usuarioId)
    res.json({
      message: 'Actividades enviadas exitosamente',
      actividades
    })
  } catch (error: any) {
    console.error('Error al enviar actividades:', error)
    res.status(400).json({ message: error.message || 'Error al enviar actividades' })
  }
}

// Obtener actividades de supervisados
export const getActividadesSupervisados = async (req: Request, res: Response) => {
  try {
    const supervisorId = req.usuario?.id
    const { fechaInicio, fechaFin, usuarioId, proyectoId, estado } = req.query
    
    if (!supervisorId || req.usuario?.rol !== 'supervisor') {
      return res.status(403).json({ message: 'No tiene permisos para ver actividades de supervisados' })
    }
    
    console.log('Filtros recibidos:', { fechaInicio, fechaFin, usuarioId, proyectoId, estado })
    
    // Si no se especifican fechas, obtener todas las actividades de los últimos 3 meses
    let fechaInicioObj = fechaInicio ? new Date(fechaInicio as string) : new Date();
    let fechaFinObj = fechaFin ? new Date(fechaFin as string) : new Date();
    
    // Si no hay fechas especificadas, usar un rango amplio (últimos 3 meses)
    if (!fechaInicio) {
      fechaInicioObj.setMonth(fechaInicioObj.getMonth() - 3);
      console.log('No se especificó fecha de inicio, usando los últimos 3 meses:', fechaInicioObj.toISOString());
    }
    
    const actividades = await actividadesService.obtenerActividadesSupervisados(
      supervisorId,
      fechaInicioObj,
      fechaFinObj,
      usuarioId as string,
      proyectoId as string,
      estado as string
    )
    
    console.log(`Se encontraron ${actividades.length} actividades con los filtros aplicados`)
    res.json({ actividades })
  } catch (error: any) {
    console.error('Error al obtener actividades de supervisados:', error)
    res.status(500).json({ message: error.message || 'Error al obtener actividades de supervisados' })
  }
}