// src/controllers/auth.controller.ts
// Este controlador maneja la autenticación de usuarios

import { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { UsuarioLogin, UsuarioRegistro } from '../types/usuario.types'

// Controlador para iniciar sesión
export const login = async (req: Request, res: Response) => {
  try {
    const credenciales = req.body as UsuarioLogin
    const resultado = await authService.login(credenciales)
    res.json(resultado)
  } catch (error: any) {
    console.error('Error en login:', error)
    res.status(401).json({ message: error.message || 'Error al iniciar sesión' })
  }
}

// Controlador para registrar un nuevo usuario
export const registro = async (req: Request, res: Response) => {
  try {
    console.log('Recibida solicitud de registro:', { ...req.body, password: '***REDACTED***' })
    const userData = req.body as UsuarioRegistro
    
    // Validar que todos los campos requeridos estén presentes
    const camposRequeridos = ['nombre_usuario', 'email', 'password', 'nombres', 'appaterno', 'rol', 'rut']
    const camposFaltantes = camposRequeridos.filter(campo => !userData[campo as keyof UsuarioRegistro])
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({ 
        message: `Faltan campos requeridos: ${camposFaltantes.join(', ')}`,
        camposFaltantes
      })
    }
    
    const resultado = await authService.registro(userData)
    console.log('Usuario registrado exitosamente:', resultado.usuario.id)
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: resultado.usuario
    })
  } catch (error: any) {
    console.error('Error en registro:', error)
    // Determinar el tipo de error para dar un mensaje más específico
    if (error.message.includes('ya está en uso')) {
      return res.status(409).json({ message: error.message })
    } else if (error.message.includes('RUT inválido')) {
      return res.status(400).json({ message: 'El RUT ingresado no es válido' })
    } else if (error.code === '23505') { // Error de duplicado en PostgreSQL
      return res.status(409).json({ message: 'Ya existe un usuario con ese email o RUT' })
    }
    
    res.status(400).json({ message: error.message || 'Error al registrar usuario' })
  }
}

// Controlador para verificar token y obtener información del usuario actual
export const getUsuarioActual = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.usuario?.id
    if (!usuarioId) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const usuario = await authService.getUsuarioActual(usuarioId)
    res.json({ usuario })
  } catch (error: any) {
    console.error('Error al obtener usuario actual:', error)
    res.status(404).json({ message: error.message || 'Error al obtener información del usuario' })
  }
}

// Controlador para cerrar sesión
export const logout = (req: Request, res: Response) => {
  // En JWT, el cierre de sesión se maneja en el cliente eliminando el token
  res.json({ message: 'Sesión cerrada exitosamente' })
}