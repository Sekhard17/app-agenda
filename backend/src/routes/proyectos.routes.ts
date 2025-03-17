// src/routes/proyectos.routes.ts
// Este archivo define las rutas para los proyectos

import { Router } from 'express'
import { RequestHandler } from 'express'
import { verificarToken, esSupervisor } from '../middlewares/auth.middleware'
import * as proyectosController from '../controllers/proyectos.controller'

const router = Router()

// Todas las rutas de proyectos requieren autenticación
router.use(verificarToken)

// Rutas de proyectos
router.get('/', proyectosController.getProyectos as RequestHandler)
router.get('/estadisticas', proyectosController.getProyectosConEstadisticas as RequestHandler)
router.get('/:id', proyectosController.getProyecto as RequestHandler)
router.post('/', proyectosController.crearProyecto as RequestHandler)
router.put('/:id', proyectosController.actualizarProyecto as RequestHandler)
router.patch('/:id/activar', proyectosController.activarProyecto as RequestHandler)
router.patch('/:id/desactivar', proyectosController.desactivarProyecto as RequestHandler)

// Rutas para asignación de proyectos
router.get('/usuario/:usuarioId', proyectosController.getProyectosDeUsuario as RequestHandler)
router.post('/asignar/:usuarioId', esSupervisor, proyectosController.asignarProyectoAUsuario as RequestHandler)
router.delete('/desasignar/:usuarioId/:proyectoId', esSupervisor, proyectosController.desasignarProyectoDeUsuario as RequestHandler)

export default router
