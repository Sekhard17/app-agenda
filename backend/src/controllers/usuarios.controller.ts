// src/controllers/usuarios.controller.ts
// Este controlador maneja las operaciones para usuarios

import { Request, Response, NextFunction } from 'express'
import * as usuariosService from '../services/usuarios.service'
import { UsuarioActualizar } from '../types/usuario.types'
import { RequestHandler } from 'express'

// Obtener un usuario por ID
export const getUsuario: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const usuarioId = req.usuario?.id
    const esSupervisor = req.usuario?.rol === 'supervisor'
    
    if (!usuarioId) {
      res.status(401).json({ message: 'No autorizado' })
      return
    }
    
    const usuario = await usuariosService.obtenerUsuario(id, usuarioId, esSupervisor)
    res.json({ usuario })
  } catch (error: any) {
    console.error('Error al obtener usuario:', error)
    res.status(404).json({ message: error.message || 'Error al obtener usuario' })
  }
}

// Actualizar un usuario
export const actualizarUsuario: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const usuarioData = req.body as UsuarioActualizar
    const usuarioId = req.usuario?.id
    const esSupervisor = req.usuario?.rol === 'supervisor'
    
    if (!usuarioId) {
      res.status(401).json({ message: 'No autorizado' })
      return
    }
    
    const usuario = await usuariosService.actualizarUsuario(id, usuarioData, usuarioId, esSupervisor)
    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario
    })
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    res.status(400).json({ message: error.message || 'Error al actualizar usuario' })
  }
}

// Obtener supervisados
export const getSupervisados: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supervisorId = req.usuario?.id
    
    if (!supervisorId || req.usuario?.rol !== 'supervisor') {
      res.status(403).json({ message: 'No tiene permisos para ver supervisados' })
      return
    }
    
    const supervisados = await usuariosService.obtenerSupervisados(supervisorId)
    res.json({ supervisados })
  } catch (error: any) {
    console.error('Error al obtener supervisados:', error)
    res.status(500).json({ message: error.message || 'Error al obtener supervisados' })
  }
}

// Obtener detalles de un usuario
export const getUsuarioDetalle: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const usuarioId = req.usuario?.id
    const rol = req.usuario?.rol
    
    if (!usuarioId) {
      res.status(401).json({ message: 'No autorizado' })
      return
    }
    
    // Verificar permisos: solo puede ver sus propios detalles o los de sus supervisados si es supervisor
    if (id !== usuarioId && !(rol === 'supervisor' && await usuariosService.esSupervisado(id, usuarioId))) {
      res.status(403).json({ message: 'No tiene permisos para ver los detalles de este usuario' })
      return
    }
    
    const usuario = await usuariosService.obtenerUsuario(id, usuarioId, rol === 'supervisor')
    
    // Obtener información adicional según el rol
    let detalles: any = {
      ...usuario,
      departamento: usuario.departamento || 'No asignado',
      cargo: usuario.cargo || 'No asignado'
    }
    
    // Para supervisores, obtener lista de supervisados
    if (usuario.rol === 'supervisor') {
      const supervisados = await usuariosService.obtenerSupervisados(id)
      detalles.supervisados = supervisados
    }
    
    res.json(detalles)
  } catch (error: any) {
    console.error('Error al obtener detalles del usuario:', error)
    res.status(500).json({ message: error.message || 'Error al obtener detalles del usuario' })
  }
}