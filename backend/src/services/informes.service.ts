import { obtenerUsuarioPorId } from '../models/usuario.model';
import { obtenerActividadesPorRango } from '../models/actividad.model';
import { obtenerProyectoPorId } from '../models/proyecto.model';
import { esSupervisadoPor } from '../models/usuario.model';
// Nota: Es necesario instalar la dependencia exceljs con: npm install exceljs
// import ExcelJS from 'exceljs';
// Usamos require para evitar errores de TypeScript mientras se instala la dependencia
const ExcelJS = require('exceljs');
import { Readable } from 'stream';
import { Cell } from 'exceljs';

// Interfaces
interface InformeSupervisadoParams {
  supervisadoId: string;
  supervisorId: string;
  proyectoId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  formato: 'excel' | 'csv' | 'pdf';
  agruparPor: 'none' | 'day' | 'week' | 'month';
  incluirInactivos: boolean;
  esAdmin: boolean;
}

/**
 * Genera un informe de actividades de un supervisado en formato Excel, CSV o PDF
 */
export const generarInformeSupervisado = async (params: InformeSupervisadoParams): Promise<Buffer> => {
  const {
    supervisadoId,
    supervisorId,
    proyectoId,
    fechaInicio,
    fechaFin,
    formato,
    agruparPor,
    incluirInactivos,
    esAdmin
  } = params;

  // Verificar que el usuario sea supervisado por el supervisor
  if (!esAdmin) {
    const esSupervisado = await esSupervisadoPor(supervisadoId, supervisorId);
    if (!esSupervisado) {
      throw new Error('No tienes permisos para acceder a este informe');
    }
  }

  // Obtener información del supervisado
  const supervisado = await obtenerUsuarioPorId(supervisadoId);
  if (!supervisado) {
    throw new Error('Supervisado no encontrado');
  }

  // Obtener información del supervisor
  const supervisor = await obtenerUsuarioPorId(supervisorId);
  if (!supervisor) {
    throw new Error('Supervisor no encontrado');
  }

  // Obtener información del proyecto si se especificó
  let proyecto = null;
  if (proyectoId) {
    proyecto = await obtenerProyectoPorId(proyectoId);
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    // Si el proyecto no está activo y no se incluyen inactivos, lanzar error
    if (!proyecto.activo && !incluirInactivos) {
      throw new Error('El proyecto seleccionado está inactivo');
    }
  }

  // Definir fechas por defecto si no se especificaron
  const hoy = new Date();
  const fechaInicioReal = fechaInicio || new Date(hoy.getFullYear(), hoy.getMonth(), 1); // Primer día del mes actual
  const fechaFinReal = fechaFin || hoy;

  // Obtener actividades del supervisado en el rango de fechas
  const actividades = await obtenerActividadesPorRango(
    supervisadoId,
    fechaInicioReal,
    fechaFinReal
  );

  // Agregar logs para depuración
  console.log(`Actividades obtenidas: ${actividades.length}`);
  console.log('Estados de actividades:', actividades.map(a => a.estado));
  
  // Filtrar actividades por proyecto si se especificó y solo incluir actividades enviadas
  const actividadesFiltradas = actividades
    .filter(actividad => {
      // Verificar si la actividad tiene estado y si es 'enviada' o 'enviado'
      const estadoValido = actividad.estado === 'enviada' || actividad.estado === 'enviado';
      console.log(`Actividad ${actividad.id}: estado=${actividad.estado}, válido=${estadoValido}`);
      return estadoValido;
    })
    .filter(actividad => {
      // Filtrar por proyecto si se especificó
      const proyectoValido = !proyectoId || actividad.id_proyecto === proyectoId;
      console.log(`Actividad ${actividad.id}: proyecto=${actividad.id_proyecto}, proyectoId=${proyectoId}, válido=${proyectoValido}`);
      return proyectoValido;
    });

  console.log(`Actividades filtradas: ${actividadesFiltradas.length}`);

  // Crear un libro de Excel
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Gestión de Actividades';
  workbook.lastModifiedBy = 'Sistema de Gestión de Actividades';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Crear una hoja de trabajo
  const worksheet = workbook.addWorksheet('Informe de Actividades', {
    properties: {
      tabColor: { argb: '4F81BD' }
    },
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.7, right: 0.7,
        top: 0.75, bottom: 0.75,
        header: 0.3, footer: 0.3
      }
    }
  });

  // Definir colores y estilos
  const colorPrimario = '4F81BD'; // Azul corporativo
  const colorSecundario = 'D0D8E8'; // Azul claro
  const colorTerciario = 'E9EDF4'; // Azul muy claro
  const colorTextoOscuro = '333333'; // Casi negro
  const colorTextoClaro = 'FFFFFF'; // Blanco

  // Función para formatear fechas en formato dd/mm/aaaa
  const formatearFecha = (fecha: Date): string => {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // Título del informe
  const nombreSupervisado = `${supervisado.nombres} ${supervisado.appaterno} ${supervisado.apmaterno}`;
  const nombreProyectoStr = proyecto ? proyecto.nombre : 'Todos los proyectos';
  const periodoStr = `${formatearFecha(fechaInicioReal)} al ${formatearFecha(fechaFinReal)}`;
  
  // Determinar si se debe incluir la columna de proyecto
  const incluirColumnaProyecto = !proyectoId;
  
  // Determinar el número de columnas y el rango de celdas para fusionar
  const numColumnas = incluirColumnaProyecto ? 7 : 6;
  const rangoTitulo = `A1:${String.fromCharCode(64 + numColumnas)}3`; // A1:G3 o A1:F3
  const rangoSubtitulo = `A4:${String.fromCharCode(64 + numColumnas)}4`; // A4:G4 o A4:F4
  
  // Fusionar celdas para el título
  worksheet.mergeCells(rangoTitulo);
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'INFORME DE ACTIVIDADES';
  tituloCell.font = {
    name: 'Calibri',
    size: 24,
    bold: true,
    color: { argb: colorPrimario }
  };
  tituloCell.alignment = {
    vertical: 'middle',
    horizontal: 'center'
  };
  tituloCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF' }
  };
  
  // Información del informe
  worksheet.mergeCells(rangoSubtitulo);
  const subtituloCell = worksheet.getCell('A4');
  subtituloCell.value = `Supervisado: ${nombreSupervisado} | Proyecto: ${nombreProyectoStr} | Período: ${periodoStr}`;
  subtituloCell.font = {
    name: 'Calibri',
    size: 12,
    bold: true,
    color: { argb: colorTextoOscuro }
  };
  subtituloCell.alignment = {
    vertical: 'middle',
    horizontal: 'center'
  };
  subtituloCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colorSecundario }
  };
  
  // Información de generación
  worksheet.mergeCells('A5:C5');
  const fechaGeneracionCell = worksheet.getCell('A5');
  fechaGeneracionCell.value = `Fecha de generación: ${formatearFecha(new Date())}`;
  fechaGeneracionCell.font = {
    name: 'Calibri',
    size: 10,
    italic: true,
    color: { argb: colorTextoOscuro }
  };
  
  const rangoGeneradoPor = incluirColumnaProyecto ? 'E5:G5' : 'D5:F5';
  worksheet.mergeCells(rangoGeneradoPor);
  const generadoPorCell = worksheet.getCell(rangoGeneradoPor.split(':')[0]);
  generadoPorCell.value = `Generado por: ${supervisor.nombres} ${supervisor.appaterno}`;
  generadoPorCell.font = {
    name: 'Calibri',
    size: 10,
    italic: true,
    color: { argb: colorTextoOscuro }
  };
  generadoPorCell.alignment = {
    horizontal: 'right'
  };
  
  // Espacio antes de la tabla
  worksheet.addRow([]);
  
  // Configurar encabezados de la tabla
  let headerColumns = ['Fecha', 'Actividad', 'Tipo', 'Horas', 'Comentarios'];
  
  // Incluir columna de proyecto solo si no se especificó un proyecto
  if (incluirColumnaProyecto) {
    headerColumns.splice(1, 0, 'Proyecto');
  }
  
  const headerRow = worksheet.addRow(headerColumns);
  headerRow.height = 30;
  headerRow.eachCell((cell: Cell) => {
    cell.font = {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: { argb: colorTextoClaro }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colorPrimario }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: colorPrimario } },
      left: { style: 'thin', color: { argb: colorPrimario } },
      bottom: { style: 'thin', color: { argb: colorPrimario } },
      right: { style: 'thin', color: { argb: colorPrimario } }
    };
  });
  
  // Ajustar anchos de columna según si se incluye la columna de proyecto o no
  if (incluirColumnaProyecto) {
    worksheet.columns = [
      { key: 'fecha', width: 15 },
      { key: 'proyecto', width: 20 },
      { key: 'actividad', width: 40 },
      { key: 'tipo', width: 15 },
      { key: 'horas', width: 10 },
      { key: 'comentarios', width: 40 }
    ];
  } else {
    worksheet.columns = [
      { key: 'fecha', width: 15 },
      { key: 'actividad', width: 45 },
      { key: 'tipo', width: 20 },
      { key: 'horas', width: 10 },
      { key: 'comentarios', width: 45 }
    ];
  }

  // Agrupar actividades según el parámetro agruparPor
  let actividadesAgrupadas = actividadesFiltradas;
  
  if (agruparPor !== 'none') {
    // Implementar lógica de agrupación según agruparPor
    // Esta es una implementación básica, se puede mejorar según necesidades
    actividadesAgrupadas.sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      
      if (agruparPor === 'day') {
        return fechaA.getTime() - fechaB.getTime();
      } else if (agruparPor === 'week') {
        const weekA = getWeekNumber(fechaA);
        const weekB = getWeekNumber(fechaB);
        return weekA - weekB;
      } else if (agruparPor === 'month') {
        const monthA = fechaA.getMonth();
        const monthB = fechaB.getMonth();
        return monthA - monthB;
      }
      
      return 0;
    });
  }

  // Agregar datos a la hoja de trabajo
  let rowIndex = 0;
  for (const actividad of actividadesAgrupadas) {
    // Preparar los datos de la fila según si se incluye la columna de proyecto o no
    let rowData = [];
    
    if (incluirColumnaProyecto) {
      rowData = [
        formatearFecha(new Date(actividad.fecha)),
        actividad.nombre_proyecto || 'Sin proyecto',
        actividad.descripcion,
        actividad.nombre_tipo_actividad || 'Sin tipo',
        actividad.horas,
        actividad.comentarios || ''
      ];
    } else {
      rowData = [
        formatearFecha(new Date(actividad.fecha)),
        actividad.descripcion,
        actividad.nombre_tipo_actividad || 'Sin tipo',
        actividad.horas,
        actividad.comentarios || ''
      ];
    }
    
    const dataRow = worksheet.addRow(rowData);
    
    // Aplicar estilos a las filas de datos
    dataRow.eachCell((cell: Cell) => {
      cell.font = {
        name: 'Calibri',
        size: 11,
        color: { argb: colorTextoOscuro }
      };
      cell.alignment = {
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'DDDDDD' } },
        left: { style: 'thin', color: { argb: 'DDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'DDDDDD' } },
        right: { style: 'thin', color: { argb: 'DDDDDD' } }
      };
    });
    
    // Alternar colores de fondo para las filas
    if (rowIndex % 2 === 0) {
      dataRow.eachCell((cell: Cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colorTerciario }
        };
      });
    } else {
      dataRow.eachCell((cell: Cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF' }
        };
      });
    }
    
    // Alineación específica para algunas columnas
    dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }; // Fecha
    
    // Alineación para la columna de horas (posición varía según si se incluye la columna de proyecto)
    const horasColumnIndex = incluirColumnaProyecto ? 5 : 4;
    dataRow.getCell(horasColumnIndex).alignment = { horizontal: 'center', vertical: 'middle' };
    
    rowIndex++;
  }

  // Agregar resumen al final
  worksheet.addRow([]);
  
  const totalHoras = actividadesAgrupadas.reduce((sum, act) => sum + (act.horas || 0), 0);
  const totalActividades = actividadesAgrupadas.length;
  
  // Sección de resumen - Título
  const rangoResumenTitulo = `A${worksheet.rowCount + 1}:${String.fromCharCode(64 + numColumnas)}${worksheet.rowCount + 1}`;
  worksheet.mergeCells(rangoResumenTitulo);
  const resumenTitleCell = worksheet.getCell(`A${worksheet.rowCount}`);
  resumenTitleCell.value = 'RESUMEN';
  resumenTitleCell.font = {
    name: 'Calibri',
    size: 14,
    bold: true,
    color: { argb: colorTextoClaro }
  };
  resumenTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colorPrimario }
  };
  resumenTitleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  
  // Crear una fila para el resumen con un diseño más compacto
  const resumenRow = worksheet.addRow(['', '', '', '']);
  resumenRow.height = 30;
  
  // Dividir la fila en dos secciones
  const columnaMedia = Math.ceil(numColumnas / 2);
  
  // Sección izquierda - Total de horas
  worksheet.mergeCells(`A${worksheet.rowCount}:B${worksheet.rowCount}`);
  const horasLabelCell = worksheet.getCell(`A${worksheet.rowCount}`);
  horasLabelCell.value = 'Total de horas:';
  horasLabelCell.font = {
    name: 'Calibri',
    size: 12,
    bold: true,
    color: { argb: colorTextoOscuro }
  };
  horasLabelCell.alignment = {
    horizontal: 'right',
    vertical: 'middle'
  };
  horasLabelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colorSecundario }
  };
  horasLabelCell.border = {
    top: { style: 'thin', color: { argb: colorPrimario } },
    left: { style: 'thin', color: { argb: colorPrimario } },
    bottom: { style: 'thin', color: { argb: colorPrimario } },
    right: { style: 'thin', color: { argb: colorPrimario } }
  };
  
  worksheet.mergeCells(`C${worksheet.rowCount}:${String.fromCharCode(64 + columnaMedia)}${worksheet.rowCount}`);
  const horasValueCell = worksheet.getCell(`C${worksheet.rowCount}`);
  horasValueCell.value = totalHoras;
  horasValueCell.font = {
    name: 'Calibri',
    size: 14,
    bold: true,
    color: { argb: colorPrimario }
  };
  horasValueCell.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  horasValueCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF' }
  };
  horasValueCell.border = {
    top: { style: 'thin', color: { argb: colorPrimario } },
    left: { style: 'thin', color: { argb: colorPrimario } },
    bottom: { style: 'thin', color: { argb: colorPrimario } },
    right: { style: 'thin', color: { argb: colorPrimario } }
  };
  
  // Sección derecha - Total de actividades
  const letraInicio = String.fromCharCode(64 + columnaMedia + 1);
  const letraFin = String.fromCharCode(64 + columnaMedia + 2);
  worksheet.mergeCells(`${letraInicio}${worksheet.rowCount}:${letraFin}${worksheet.rowCount}`);
  const actividadesLabelCell = worksheet.getCell(`${letraInicio}${worksheet.rowCount}`);
  actividadesLabelCell.value = 'Total de actividades:';
  actividadesLabelCell.font = {
    name: 'Calibri',
    size: 12,
    bold: true,
    color: { argb: colorTextoOscuro }
  };
  actividadesLabelCell.alignment = {
    horizontal: 'right',
    vertical: 'middle'
  };
  actividadesLabelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colorSecundario }
  };
  actividadesLabelCell.border = {
    top: { style: 'thin', color: { argb: colorPrimario } },
    left: { style: 'thin', color: { argb: colorPrimario } },
    bottom: { style: 'thin', color: { argb: colorPrimario } },
    right: { style: 'thin', color: { argb: colorPrimario } }
  };
  
  const letraInicioValor = String.fromCharCode(64 + columnaMedia + 3);
  const letraFinValor = String.fromCharCode(64 + numColumnas);
  worksheet.mergeCells(`${letraInicioValor}${worksheet.rowCount}:${letraFinValor}${worksheet.rowCount}`);
  const actividadesValueCell = worksheet.getCell(`${letraInicioValor}${worksheet.rowCount}`);
  actividadesValueCell.value = totalActividades;
  actividadesValueCell.font = {
    name: 'Calibri',
    size: 14,
    bold: true,
    color: { argb: colorPrimario }
  };
  actividadesValueCell.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  actividadesValueCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF' }
  };
  actividadesValueCell.border = {
    top: { style: 'thin', color: { argb: colorPrimario } },
    left: { style: 'thin', color: { argb: colorPrimario } },
    bottom: { style: 'thin', color: { argb: colorPrimario } },
    right: { style: 'thin', color: { argb: colorPrimario } }
  };
  
  // Agregar pie de página
  worksheet.addRow([]);
  const rangoPiePagina = `A${worksheet.rowCount}:${String.fromCharCode(64 + numColumnas)}${worksheet.rowCount}`;
  worksheet.mergeCells(rangoPiePagina);
  const footerCell = worksheet.getCell(`A${worksheet.rowCount}`);
  footerCell.value = 'Sistema de Gestión de Actividades - Informe generado automáticamente';
  footerCell.font = {
    name: 'Calibri',
    size: 10,
    italic: true,
    color: { argb: '888888' }
  };
  footerCell.alignment = {
    horizontal: 'center'
  };

  // Generar el archivo según el formato solicitado
  let buffer: Buffer;
  
  if (formato === 'csv') {
    buffer = await workbook.csv.writeBuffer() as Buffer;
  } else if (formato === 'pdf') {
    // Para PDF, se podría usar una librería adicional como pdfkit
    // Por ahora, devolvemos Excel como fallback
    buffer = await workbook.xlsx.writeBuffer() as Buffer;
  } else {
    // Excel por defecto
    buffer = await workbook.xlsx.writeBuffer() as Buffer;
  }

  return buffer;
};

// Función auxiliar para obtener el número de semana de una fecha
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
} 