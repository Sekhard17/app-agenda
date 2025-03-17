import { Request, Response } from 'express';

// Importar las funciones del servicio directamente para evitar problemas de importación
import { obtenerEstadisticasDiarias, obtenerEstadisticasProyectos, obtenerEstadisticasUsuario } from '../services/estadisticas.service';

// Obtener estadísticas de actividades diarias en un rango de fechas
export const getEstadisticasDiarias = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const usuarioId = req.usuario?.id;
    
    if (!fechaInicio || !fechaFin) {
      res.status(400).json({ 
        error: 'Se requieren los parámetros fechaInicio y fechaFin'
      });
      return;
    }
    
    if (!usuarioId) {
      res.status(401).json({
        error: 'Usuario no autenticado'
      });
      return;
    }
    
    const estadisticas = await obtenerEstadisticasDiarias(
      fechaInicio as string,
      fechaFin as string,
      usuarioId
    );
    
    res.json({ estadisticas });
  } catch (error) {
    console.error('Error al obtener estadísticas diarias:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas diarias'
    });
  }
};

// Obtener estadísticas de actividades por proyecto
export const getEstadisticasProyectos = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    
    if (!usuarioId) {
      res.status(401).json({
        error: 'Usuario no autenticado'
      });
      return;
    }
    
    const estadisticas = await obtenerEstadisticasProyectos(usuarioId);
    
    res.json({ estadisticas });
  } catch (error) {
    console.error('Error al obtener estadísticas por proyecto:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas por proyecto'
    });
  }
};

// Obtener estadísticas de un usuario específico
export const getEstadisticasUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supervisorId = req.usuario?.id;
    
    if (!supervisorId) {
      res.status(401).json({
        error: 'Usuario no autenticado'
      });
      return;
    }
    
    if (!id) {
      res.status(400).json({
        error: 'Se requiere el ID del usuario'
      });
      return;
    }
    
    const estadisticas = await obtenerEstadisticasUsuario(id, supervisorId);
    
    res.json(estadisticas);
  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas del usuario'
    });
  }
};
