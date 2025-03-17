// src/controllers/proyectos.controller.ts
// Este controlador maneja las operaciones para proyectos

import { Request, Response, NextFunction } from 'express'
import * as proyectosService from '../services/proyectos.service'
import * as usuariosService from '../services/usuarios.service'
import { ProyectoCrear, ProyectoActualizar } from '../types/proyecto.types'
import { RequestHandler } from 'express'

// Obtener un proyecto por ID
export const getProyecto: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const proyecto = await proyectosService.obtenerProyecto(id)
    res.json({ proyecto })
  } catch (error: any) {
    console.error('Error al obtener proyecto:', error)
    res.status(404).json({ message: error.message || 'Error al obtener proyecto' })
  }
}

// Obtener todos los proyectos
export const getProyectos: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('GET /api/proyectos - Usuario:', req.usuario?.nombre_usuario, 'ID:', req.usuario?.id, 'Rol:', req.usuario?.rol)
    
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined
    console.log('Filtro activo:', activo)
    
    const usuarioId = req.usuario?.id
    
    // Si el usuario es supervisor, obtener sus proyectos
    if (req.usuario?.rol === 'supervisor') {
      console.log('Usuario es supervisor, obteniendo proyectos por supervisor ID:', usuarioId)
      const proyectos = await proyectosService.obtenerProyectosPorSupervisor(usuarioId as string, activo)
      console.log(`Se encontraron ${proyectos?.length || 0} proyectos para el supervisor`)
      res.json({ proyectos })
    } else {
      // Para funcionarios, obtener sus proyectos asignados
      console.log('Usuario es funcionario, obteniendo proyectos asignados al usuario:', usuarioId)
      const proyectos = await proyectosService.obtenerProyectosDeUsuario(usuarioId as string)
      console.log(`Se encontraron ${proyectos?.length || 0} proyectos asignados al funcionario`)
      res.json({ proyectos })
    }
  } catch (error: any) {
    console.error('Error al obtener proyectos:', error)
    res.status(500).json({ message: error.message || 'Error al obtener proyectos' })
  }
}

// Crear un nuevo proyecto
export const crearProyecto: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verificar permisos (solo supervisores pueden crear proyectos)
    if (req.usuario?.rol !== 'supervisor') {
      res.status(403).json({ message: 'No tiene permisos para crear proyectos' })
      return
    }
    
    const proyectoData = req.body as ProyectoCrear
    const proyecto = await proyectosService.crearProyecto(proyectoData)
    
    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      proyecto
    })
  } catch (error: any) {
    console.error('Error al crear proyecto:', error)
    res.status(400).json({ message: error.message || 'Error al crear proyecto' })
  }
}

// Actualizar un proyecto
export const actualizarProyecto: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verificar permisos (solo supervisores pueden actualizar proyectos)
    if (req.usuario?.rol !== 'supervisor') {
      res.status(403).json({ message: 'No tiene permisos para actualizar proyectos' })
      return
    }
    
    const { id } = req.params
    const proyectoData = req.body as ProyectoActualizar
    const proyecto = await proyectosService.actualizarProyecto(id, proyectoData)
    
    res.json({
      message: 'Proyecto actualizado exitosamente',
      proyecto
    })
  } catch (error: any) {
    console.error('Error al actualizar proyecto:', error)
    res.status(400).json({ message: error.message || 'Error al actualizar proyecto' })
  }
}

// Desactivar un proyecto
export const desactivarProyecto: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verificar permisos (solo supervisores pueden desactivar proyectos)
    if (req.usuario?.rol !== 'supervisor') {
      res.status(403).json({ message: 'No tiene permisos para desactivar proyectos' })
      return
    }
    
    const { id } = req.params
    const proyecto = await proyectosService.desactivarProyecto(id)
    
    res.json({
      message: 'Proyecto desactivado exitosamente',
      proyecto
    })
  } catch (error: any) {
    console.error('Error al desactivar proyecto:', error)
    res.status(400).json({ message: error.message || 'Error al desactivar proyecto' })
  }
}

// Activar un proyecto
export const activarProyecto: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verificar permisos (solo supervisores pueden activar proyectos)
    if (req.usuario?.rol !== 'supervisor') {
      res.status(403).json({ message: 'No tiene permisos para activar proyectos' })
      return
    }
    
    const { id } = req.params
    const proyecto = await proyectosService.activarProyecto(id)
    
    res.json({
      message: 'Proyecto activado exitosamente',
      proyecto
    })
  } catch (error: any) {
    console.error('Error al activar proyecto:', error)
    res.status(400).json({ message: error.message || 'Error al activar proyecto' })
  }
}

// Obtener proyectos con estadísticas
export const getProyectosConEstadisticas: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verificar permisos (solo supervisores pueden ver estadísticas)
    if (req.usuario?.rol !== 'supervisor') {
      res.status(403).json({ message: 'No tiene permisos para ver estadísticas de proyectos' })
      return
    }
    
    const fechaInicio = req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined
    const fechaFin = req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined
    
    const proyectos = await proyectosService.obtenerProyectosConEstadisticas(fechaInicio, fechaFin)
    res.json({ proyectos })
  } catch (error: any) {
    console.error('Error al obtener estadísticas de proyectos:', error)
    res.status(500).json({ message: error.message || 'Error al obtener estadísticas de proyectos' })
  }
}

// Obtener proyectos asignados a un usuario
export const getProyectosDeUsuario: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { usuarioId } = req.params
    const supervisorId = req.usuario?.id
    
    // Verificar permisos: solo puede ver sus propios proyectos o los de sus supervisados si es supervisor
    if (usuarioId !== supervisorId && req.usuario?.rol !== 'supervisor') {
      res.status(403).json({ message: 'No tiene permisos para ver los proyectos de este usuario' })
      return
    }
    
    // Si es supervisor, verificar que el usuario sea supervisado por él
    if (usuarioId !== supervisorId && req.usuario?.rol === 'supervisor') {
      const esSupervisado = await usuariosService.esSupervisado(usuarioId, supervisorId as string)
      if (!esSupervisado) {
        res.status(403).json({ message: 'No tiene permisos para ver los proyectos de este usuario' })
        return
      }
    }
    
    const proyectos = await proyectosService.obtenerProyectosDeUsuario(usuarioId)
    res.json({ proyectos })
  } catch (error: any) {
    console.error('Error al obtener proyectos del usuario:', error)
    res.status(500).json({ message: error.message || 'Error al obtener proyectos del usuario' })
  }
}

// Asignar proyecto a usuario
export const asignarProyectoAUsuario: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { usuarioId } = req.params
    const { id_proyecto } = req.body
    const supervisorId = req.usuario?.id
    
    if (!id_proyecto) {
      res.status(400).json({ message: 'El ID del proyecto es requerido' })
      return
    }
    
    // Verificar que el usuario sea supervisado por el supervisor
    const esSupervisado = await usuariosService.esSupervisado(usuarioId, supervisorId as string)
    if (!esSupervisado) {
      res.status(403).json({ message: 'No tiene permisos para asignar proyectos a este usuario' })
      return
    }
    
    // Verificar que el proyecto pertenezca al supervisor
    const proyecto = await proyectosService.obtenerProyecto(id_proyecto)
    if (proyecto.id_supervisor !== supervisorId) {
      res.status(403).json({ message: 'No tiene permisos para asignar este proyecto' })
      return
    }
    
    await proyectosService.asignarProyectoAUsuario(usuarioId, id_proyecto, supervisorId as string)
    res.status(201).json({ message: 'Proyecto asignado exitosamente' })
  } catch (error: any) {
    console.error('Error al asignar proyecto:', error)
    res.status(400).json({ message: error.message || 'Error al asignar proyecto' })
  }
}

// Desasignar proyecto de usuario
export const desasignarProyectoDeUsuario: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { usuarioId, proyectoId } = req.params
    const supervisorId = req.usuario?.id
    
    // Verificar que el usuario sea supervisado por el supervisor
    const esSupervisado = await usuariosService.esSupervisado(usuarioId, supervisorId as string)
    if (!esSupervisado) {
      res.status(403).json({ message: 'No tiene permisos para desasignar proyectos de este usuario' })
      return
    }
    
    // Verificar que el proyecto pertenezca al supervisor
    const proyecto = await proyectosService.obtenerProyecto(proyectoId)
    if (proyecto.id_supervisor !== supervisorId) {
      res.status(403).json({ message: 'No tiene permisos para desasignar este proyecto' })
      return
    }
    
    await proyectosService.desasignarProyectoDeUsuario(usuarioId, proyectoId)
    res.json({ message: 'Proyecto desasignado exitosamente' })
  } catch (error: any) {
    console.error('Error al desasignar proyecto:', error)
    res.status(400).json({ message: error.message || 'Error al desasignar proyecto' })
  }
}