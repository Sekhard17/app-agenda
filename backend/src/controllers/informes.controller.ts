import { Request, Response, NextFunction } from 'express';
import { generarInformeSupervisado } from '../services/informes.service';

/**
 * Exporta un informe de actividades de un supervisado en formato Excel
 */
export const exportarInformeSupervisado = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // ID del supervisado
    const { proyecto, fechaInicio, fechaFin, formato = 'excel', agruparPor = 'none', incluirInactivos = 'true' } = req.query;
    
    // Verificar que el usuario autenticado sea un supervisor
    const usuarioId = req.usuario?.id;
    const esSupervisor = req.usuario?.rol === 'supervisor';
    
    if (!usuarioId) {
      res.status(401).json({
        status: 'error',
        message: 'Usuario no autenticado'
      });
      return;
    }
    
    // Validar parámetros
    if (!id) {
      res.status(400).json({
        status: 'error',
        message: 'Se requiere el ID del supervisado'
      });
      return;
    }
    
    // Convertir parámetros
    const incluirInactivosBoolean = incluirInactivos === 'true';
    
    // Generar el informe
    const informe = await generarInformeSupervisado({
      supervisadoId: id,
      supervisorId: usuarioId,
      proyectoId: proyecto as string | undefined,
      fechaInicio: fechaInicio ? new Date(fechaInicio as string) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin as string) : undefined,
      formato: formato as 'excel' | 'csv' | 'pdf',
      agruparPor: agruparPor as 'none' | 'day' | 'week' | 'month',
      incluirInactivos: incluirInactivosBoolean,
      esAdmin: esSupervisor
    });
    
    // Configurar encabezados según el formato
    let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    let extension = 'xlsx';
    
    if (formato === 'csv') {
      contentType = 'text/csv';
      extension = 'csv';
    } else if (formato === 'pdf') {
      contentType = 'application/pdf';
      extension = 'pdf';
    }
    
    // Configurar encabezados de respuesta
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=informe_supervisado_${id}_${new Date().toISOString().split('T')[0]}.${extension}`);
    
    // Enviar el archivo
    res.send(informe);
  } catch (error) {
    console.error('Error al exportar informe de supervisado:', error);
    
    // Si es un error controlado, devolver el mensaje específico
    if (error instanceof Error) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Error al exportar informe de supervisado'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Error al exportar informe de supervisado'
      });
    }
  }
}; 