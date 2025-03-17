// src/routes/actividades.routes.ts
// Este archivo define las rutas para las actividades

import { Router } from 'express'
import * as actividadesController from '../controllers/actividades.controller'
import { verificarToken } from '../middlewares/auth.middleware'
import { validarFechaActividad } from '../middlewares/validacion.middleware'
import { Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express';

const router = Router()

// Aplicar middleware de autenticación a todas las rutas
router.use((req: Request, res: Response, next: NextFunction) => {
  try {
    verificarToken(req, res, next);
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(401).json({ message: 'Error de autenticación' });
  }
});

// Rutas de actividades
// Importante: La ruta /supervisados debe ir antes que /:id para evitar conflictos
router.get('/supervisados', actividadesController.getActividadesSupervisados as RequestHandler);
router.get('/usuario', actividadesController.getActividadesUsuario as RequestHandler);
router.get('/rango/:fechaInicio/:fechaFin', actividadesController.getActividadesPorRango as RequestHandler);
router.get('/:id', actividadesController.getActividad as RequestHandler);

// Rutas POST y PUT
router.post('/', 
  validarFechaActividad,
  actividadesController.crearActividad as RequestHandler
);

router.put('/:id', 
  validarFechaActividad,
  actividadesController.actualizarActividad as RequestHandler
);

router.delete('/:id', actividadesController.eliminarActividad as RequestHandler);

// Esta ruta debe ir después de la ruta POST / para evitar conflictos
router.post('/enviar', actividadesController.enviarActividades as RequestHandler);

export default router
