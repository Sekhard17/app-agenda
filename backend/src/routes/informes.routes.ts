import express, { Router, Request, Response, NextFunction } from 'express';
import { verificarToken } from '../middlewares/auth.middleware';
import { exportarInformeSupervisado } from '../controllers/informes.controller';
import { RequestHandler } from 'express';

const router: Router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use((req: Request, res: Response, next: NextFunction) => {
  try {
    verificarToken(req, res, next);
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(401).json({ message: 'Error de autenticación' });
  }
});

// Ruta para exportar informe por supervisado
router.get('/supervisado/:id/excel', exportarInformeSupervisado as RequestHandler);

export default router; 