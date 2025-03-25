import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  Grid,
  Paper,
  Chip,
  FormControlLabel,
  Switch,
  Collapse,
  CircularProgress,
  LinearProgress,
  IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FileDownload as FileDownloadIcon,
  Business as BusinessIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_CONFIG } from '../config/api.config';
import { AxiosError } from 'axios';

// Tips para mostrar en la modal
const TIPS = [
  "Exporta informes de proyecto para realizar seguimiento detallado.",
  "Incluye todos los supervisados para ver el trabajo en equipo completo.",
  "Compara el rendimiento de distintos usuarios en un mismo proyecto.",
  "Filtra por fechas específicas para analizar períodos de alta actividad.",
  "Exporta a Excel para crear gráficos y visualizaciones personalizadas."
];

// Interfaz para las opciones de exportación
interface ExportOptions {
  includeInactive: boolean;
  format: 'excel' | 'csv' | 'pdf';
  groupBy: 'none' | 'day' | 'week' | 'month' | 'user';
  incluirFechas: boolean;
  dateRange: {
    enabled: boolean;
    startDate: Date | null;
    endDate: Date | null;
  };
}

interface InformePorProyectoModalProps {
  open: boolean;
  onClose: () => void;
  proyectoId: string;
  proyectoNombre?: string;
  showProyectoSelector?: boolean;
}

const InformePorProyectoModal: React.FC<InformePorProyectoModalProps> = ({ 
  open, 
  onClose,
  proyectoId,
  proyectoNombre,
  showProyectoSelector = false
}) => {
  const theme = useTheme();
  const token = Cookies.get('auth_token');
  
  // Estados
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<string>(proyectoId);
  const [selectedProyectoNombre, setSelectedProyectoNombre] = useState<string>(proyectoNombre || '');
  const [loadingUsuarios, setLoadingUsuarios] = useState<boolean>(false);
  const [loadingProyectos, setLoadingProyectos] = useState<boolean>(false);
  const [loadingExport, setLoadingExport] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [currentTip] = useState<string>(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [selectedUsuarios, setSelectedUsuarios] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Estado para opciones de exportación
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeInactive: true,
    format: 'excel',
    groupBy: 'user',
    incluirFechas: false,
    dateRange: {
      enabled: false,
      startDate: null,
      endDate: null
    }
  });
  
  // Cargar proyectos si se necesita mostrar el selector
  useEffect(() => {
    if (open && showProyectoSelector) {
      fetchProyectos();
    }
  }, [open, showProyectoSelector]);
  
  // Actualizar el proyecto seleccionado cuando cambia el proyectoId de props
  useEffect(() => {
    if (proyectoId) {
      setSelectedProyecto(proyectoId);
    }
    if (proyectoNombre) {
      setSelectedProyectoNombre(proyectoNombre);
    }
  }, [proyectoId, proyectoNombre]);
  
  // Cargar usuarios cuando cambia el proyecto seleccionado
  useEffect(() => {
    if (open && selectedProyecto) {
      fetchUsuariosProyecto(selectedProyecto);
    }
  }, [open, selectedProyecto]);
  
  // Añadir este useEffect después de los otros useEffect
  // Este efecto especial procesará los datos proporcionados directamente si hay problemas con la API
  useEffect(() => {
    // Solo activar este efecto si tenemos problemas para cargar los proyectos y estamos en desarrollo
    if (open && showProyectoSelector && proyectos.length === 0 && !loadingProyectos) {
      // Datos de proyectos proporcionados manualmente
      try {
        console.log('Intentando cargar datos de proyectos manualmente...');
        
        // Estos son los datos proporcionados por el usuario
        const proyectosData = [
          {
            "id": "c48f659f-d850-4290-88dd-7a1b7e624bd7",
            "nombre": "Proyecto sin nombre",
            "descripcion": "",
            "id_supervisor": "415eb08a-5791-46f3-9e6c-30ec9d1bd7ae",
            "id_externo_rex": null,
            "activo": false,
            "fecha_creacion": "2025-03-14T17:34:10.220719+00:00",
            "fecha_actualizacion": "2025-03-14T18:33:18.47+00:00",
            "estado": "planificado",
            "fecha_inicio": null,
            "fecha_fin": null,
            "responsable_id": null
          },
          {
            "id": "183758bf-2174-4d72-9f07-f7f937aad14b",
            "nombre": "Buenas",
            "descripcion": "",
            "id_supervisor": "415eb08a-5791-46f3-9e6c-30ec9d1bd7ae",
            "id_externo_rex": null,
            "activo": false,
            "fecha_creacion": "2025-03-14T18:13:04.689872+00:00",
            "fecha_actualizacion": "2025-03-14T18:41:51.74+00:00",
            "estado": "planificado",
            "fecha_inicio": null,
            "fecha_fin": null,
            "responsable_id": null
          },
          {
            "id": "3612fb6f-60db-42f3-adbc-2a8a7113506f",
            "nombre": "Implementación a Producción el Módulo de Solicitudes",
            "descripcion": "Implementar el módulo de solicitudes a producción, en conjunto con la base de datos sql.",
            "id_supervisor": "415eb08a-5791-46f3-9e6c-30ec9d1bd7ae",
            "id_externo_rex": null,
            "activo": true,
            "fecha_creacion": "2025-03-13T20:01:17.251627+00:00",
            "fecha_actualizacion": "2025-03-14T18:55:37.839+00:00",
            "estado": "planificado",
            "fecha_inicio": "2025-03-14",
            "fecha_fin": "2025-03-23",
            "responsable_id": null
          },
          {
            "id": "ba507a49-feaa-460f-a2e9-7acdcbbded22",
            "nombre": "Prototipo de Agenda",
            "descripcion": "Desarrollar prototipo inicial para el proyecto de agenta de tareas.",
            "id_supervisor": "415eb08a-5791-46f3-9e6c-30ec9d1bd7ae",
            "id_externo_rex": null,
            "activo": true,
            "fecha_creacion": "2025-03-04T16:56:53.564231+00:00",
            "fecha_actualizacion": "2025-03-13T19:56:06.82+00:00",
            "estado": "planificado",
            "fecha_inicio": "2025-03-03",
            "fecha_fin": "2025-03-07",
            "responsable_id": "31e8db5c-9c95-4891-a19f-1401353437c1"
          },
          {
            "id": "a438f95d-592c-4145-9f78-197763c0e027",
            "nombre": "Simulación del Proyecto",
            "descripcion": "Simulación de entrega para el proyecto.",
            "id_supervisor": "415eb08a-5791-46f3-9e6c-30ec9d1bd7ae",
            "id_externo_rex": null,
            "activo": true,
            "fecha_creacion": "2025-03-21T15:05:04.802491+00:00",
            "fecha_actualizacion": "2025-03-21T15:05:04.802491+00:00",
            "estado": "planificado",
            "fecha_inicio": "2025-03-21",
            "fecha_fin": "2025-04-01",
            "responsable_id": null
          }
        ];
        
        const proyectosActivos = proyectosData.filter(isProyectoActivo);
        console.log('Proyectos activos encontrados manualmente:', proyectosActivos.length);
        
        if (proyectosActivos.length > 0) {
          setProyectos(proyectosActivos);
          
          // Si no hay proyecto seleccionado, seleccionar el primero
          if (!selectedProyecto) {
            setSelectedProyecto(proyectosActivos[0].id);
            setSelectedProyectoNombre(proyectosActivos[0].nombre);
          }
          
          mostrarSnackbar('Se cargaron proyectos de datos de respaldo', 'info');
        } else {
          mostrarSnackbar('No se encontraron proyectos activos en los datos de respaldo', 'info');
        }
      } catch (error) {
        console.error('Error al cargar proyectos manualmente:', error);
      }
    }
  }, [open, showProyectoSelector, proyectos.length, loadingProyectos, selectedProyecto]);
  
  // Función para mostrar snackbar
  const mostrarSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
    
    // Auto-cerrar después de 6 segundos
    setTimeout(() => {
      setSnackbar(prev => ({
        ...prev,
        open: false
      }));
    }, 6000);
  };
  
  // Función para verificar si un proyecto está activo
  const isProyectoActivo = (proyecto: any): boolean => {
    // Verificar si es booleano o string '1', 'true', etc.
    if (typeof proyecto.activo === 'boolean') {
      return proyecto.activo;
    } else if (typeof proyecto.activo === 'string') {
      return proyecto.activo.toLowerCase() === 'true' || proyecto.activo === '1';
    } else if (typeof proyecto.activo === 'number') {
      return proyecto.activo === 1;
    }
    return false;
  };
  
  // Función para cargar proyectos
  const fetchProyectos = async () => {
    setLoadingProyectos(true);
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Respuesta de proyectos (cruda):', response);
      console.log('Estructura de response.data:', response.data);
      let proyectosEncontrados = false;
      let proyectosDataProcesados = [];
      
      // Procesar dependiendo de la estructura de la respuesta
      if (response.data && typeof response.data === 'object') {
        if (response.data.proyectos && Array.isArray(response.data.proyectos)) {
          // Formato: { proyectos: [...] }
          console.log('Formato detectado: { proyectos: [...] }');
          proyectosDataProcesados = response.data.proyectos;
        } else if (Array.isArray(response.data)) {
          // Formato: [...]
          console.log('Formato detectado: [...]');
          proyectosDataProcesados = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Formato: { data: [...] }
          console.log('Formato detectado: { data: [...] }');
          proyectosDataProcesados = response.data.data;
        } else if (response.data.hasOwnProperty('proyectos')) {
          // Puede ser que 'proyectos' sea un objeto con proyectos
          console.log('Formato detectado: { proyectos: {...} }');
          if (typeof response.data.proyectos === 'object' && !Array.isArray(response.data.proyectos)) {
            // Convertir el objeto a array
            proyectosDataProcesados = Object.values(response.data.proyectos);
          }
        } else {
          // Intentar con propiedades directas del objeto
          console.log('Buscando proyectos en las propiedades directas del objeto');
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              console.log(`Encontrado array en propiedad: ${key}`);
              proyectosDataProcesados = response.data[key];
              break;
            }
          }
        }
      }
      
      // Si no se encontró ninguna estructura esperada pero hay un objeto response.data
      if (proyectosDataProcesados.length === 0 && response.data) {
        // Último intento: asumir que response.data ya es un objeto de proyectos
        console.log('Usando response.data directamente');
        proyectosDataProcesados = response.data;
      }
      
      console.log('Datos procesados antes de filtrar:', proyectosDataProcesados);
      
      // Filtrar proyectos activos
      if (Array.isArray(proyectosDataProcesados)) {
        const proyectosActivos = proyectosDataProcesados.filter(isProyectoActivo);
        console.log('Proyectos activos encontrados:', proyectosActivos.length);
        
        if (proyectosActivos.length > 0) {
          setProyectos(proyectosActivos);
          proyectosEncontrados = true;
          
          // Si no hay proyecto seleccionado, seleccionar el primero
          if (!selectedProyecto) {
            setSelectedProyecto(proyectosActivos[0].id);
            setSelectedProyectoNombre(proyectosActivos[0].nombre || 'Proyecto sin nombre');
          }
        } else {
          console.log('No se encontraron proyectos activos entre los datos');
          setProyectos([]);
        }
      } else {
        console.error('Los datos procesados no son un array:', proyectosDataProcesados);
        setProyectos([]);
      }
      
      // Si después de procesar la respuesta no hay proyectos, mostrar mensaje
      if (!proyectosEncontrados) {
        mostrarSnackbar('No se encontraron proyectos activos.', 'info');
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      mostrarSnackbar('Error al cargar proyectos. Por favor, inténtelo de nuevo.', 'error');
      setProyectos([]);
    } finally {
      setLoadingProyectos(false);
    }
  };
  
  // Función para cargar usuarios asignados al proyecto
  const fetchUsuariosProyecto = async (proyectoId: string) => {
    if (!proyectoId) return;
    
    setLoadingUsuarios(true);
    try {
      const usuariosUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}/${proyectoId}/usuarios`;
      console.log('Consultando URL de usuarios:', usuariosUrl);
      
      const response = await axios.get(usuariosUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Respuesta de usuarios del proyecto:', response.data);
      
      if (response.data && Array.isArray(response.data.data)) {
        setUsuarios(response.data.data);
        // Seleccionar todos los usuarios por defecto
        setSelectedUsuarios(response.data.data.map((u: any) => u.id));
      } else if (response.data && Array.isArray(response.data)) {
        // Si la respuesta es directamente un array
        setUsuarios(response.data);
        // Seleccionar todos los usuarios por defecto
        setSelectedUsuarios(response.data.map((u: any) => u.id));
      } else {
        console.log('No se encontraron usuarios o formato de respuesta no reconocido:', response.data);
        setUsuarios([]);
        mostrarSnackbar('No se encontraron usuarios asignados a este proyecto.', 'info');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      mostrarSnackbar('Error al cargar usuarios del proyecto. Por favor, inténtelo de nuevo.', 'error');
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  };
  
  // Manejar cambio de proyecto
  const handleProyectoChange = (event: SelectChangeEvent) => {
    const proyectoId = event.target.value as string;
    setSelectedProyecto(proyectoId);
    
    // Actualizar el nombre del proyecto seleccionado
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (proyecto) {
      setSelectedProyectoNombre(proyecto.nombre);
    }
  };
  
  // Función para manejar cambios en las opciones de exportación
  const handleExportOptionChange = (option: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };
  
  // Función para manejar cambios en el rango de fechas
  const handleDateRangeChange = (field: 'enabled' | 'startDate' | 'endDate', value: any) => {
    setExportOptions(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };
  
  // Función para manejar la selección de usuarios
  const handleUsuarioSelection = (usuarioId: string) => {
    setSelectedUsuarios(prev => {
      if (prev.includes(usuarioId)) {
        return prev.filter(id => id !== usuarioId);
      } else {
        return [...prev, usuarioId];
      }
    });
  };
  
  // Función para seleccionar/deseleccionar todos los usuarios
  const handleSelectAllUsuarios = (select: boolean) => {
    if (select) {
      setSelectedUsuarios(usuarios.map(u => u.id));
    } else {
      setSelectedUsuarios([]);
    }
  };
  
  // Exportar informe
  const handleExport = async () => {
    if (selectedUsuarios.length === 0) {
      mostrarSnackbar('Por favor, seleccione al menos un usuario para generar el informe.', 'error');
      return;
    }
    
    if (!selectedProyecto) {
      mostrarSnackbar('Por favor, seleccione un proyecto para generar el informe.', 'error');
      return;
    }
    
    // Validar rango de fechas si está habilitado
    if (exportOptions.dateRange.enabled) {
      if (!exportOptions.dateRange.startDate || !exportOptions.dateRange.endDate) {
        mostrarSnackbar('Por favor, seleccione un rango de fechas completo.', 'error');
        return;
      }
      
      if (exportOptions.dateRange.startDate > exportOptions.dateRange.endDate) {
        mostrarSnackbar('La fecha de inicio no puede ser posterior a la fecha de fin.', 'error');
        return;
      }
    }
    
    setLoadingExport(true);
    setExportProgress(0);
    
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);
    
    try {
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INFORMES.POR_PROYECTO}/${selectedProyecto}`;
      
      const params = new URLSearchParams();
      
      // Formatear fechas si están habilitadas
      if (exportOptions.dateRange.enabled && exportOptions.dateRange.startDate && exportOptions.dateRange.endDate) {
        // Formatear fechas - Específicamente para la zona horaria de Chile
        const formatearFechaParaChile = (fecha: Date): string => {
          // Clone la fecha para no modificar la original
          const fechaClone = new Date(fecha);
          
          // Para Chile (zona horaria UTC-3/UTC-4), necesitamos compensar específicamente
          // Sumar 1 día para compensar la diferencia de zona horaria
          fechaClone.setDate(fechaClone.getDate() + 1);
          
          // Extraer año, mes y día usando métodos locales
          const año = fechaClone.getFullYear();
          const mes = String(fechaClone.getMonth() + 1).padStart(2, '0');
          const dia = String(fechaClone.getDate()).padStart(2, '0');
          
          // Formato YYYY-MM-DD para la BD
          return `${año}-${mes}-${dia}`;
        };
        
        const fechaInicioStr = formatearFechaParaChile(exportOptions.dateRange.startDate);
        const fechaFinStr = formatearFechaParaChile(exportOptions.dateRange.endDate);
        
        params.append('fechaInicio', fechaInicioStr);
        params.append('fechaFin', fechaFinStr);
      }
      
      // Agregar usuarios seleccionados
      selectedUsuarios.forEach(id => {
        params.append('usuarios', id);
      });
      
      params.append('formato', exportOptions.format);
      params.append('agruparPor', exportOptions.groupBy);
      params.append('incluirInactivos', exportOptions.includeInactive.toString());
      
      // Log de opciones de exportación
      console.log('Opciones de exportación:', {
        formato: exportOptions.format,
        agruparPor: exportOptions.groupBy,
        incluirInactivos: exportOptions.includeInactive,
        usuarios: selectedUsuarios,
        fechas: exportOptions.dateRange.enabled ? {
          inicio: exportOptions.dateRange.startDate,
          fin: exportOptions.dateRange.endDate
        } : 'No habilitadas'
      });
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('URL completa para exportación:', url);
      console.log('Iniciando solicitud de exportación...');
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob',
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Aceptar códigos de estado en ese rango
        }
      });
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      console.log('Respuesta recibida:', {
        status: response.status,
        headers: response.headers,
        contentType: response.headers['content-type'],
        contentLength: response.data.size
      });
      
      // Manejar errores HTTP
      if (response.status !== 200) {
        // Si la respuesta es un objeto JSON de error (no un blob)
        if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
          // Convertir blob a texto para leer el mensaje de error
          const errorText = await response.data.text();
          const errorObj = JSON.parse(errorText);
          throw new Error(errorObj.message || 'Error al generar el informe');
        } else {
          throw new Error(`Error al generar el informe (código: ${response.status})`);
        }
      }
      
      if (response.data.size === 0) {
        console.error('El archivo generado está vacío. Detalles de la respuesta:', {
          status: response.status,
          headers: response.headers,
          contentType: response.headers['content-type']
        });
        throw new Error('No se encontraron actividades para el proyecto con los filtros seleccionados');
      }
      
      let mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      let extension = 'xlsx';
      
      if (exportOptions.format === 'csv') {
        mimeType = 'text/csv';
        extension = 'csv';
      } else if (exportOptions.format === 'pdf') {
        mimeType = 'application/pdf';
        extension = 'pdf';
      }
      
      const blob = new Blob([response.data], { type: mimeType });
      console.log('Tamaño del blob:', blob.size);
      
      if (blob.size < 100) { // Un archivo Excel válido debería ser más grande que esto
        throw new Error('El informe generado está vacío o es inválido. No hay actividades para mostrar.');
      }
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreProyectoFormateado = (selectedProyectoNombre || 'proyecto').replace(/\s+/g, '_');
      
      link.download = `Informe_Proyecto_${nombreProyectoFormateado}_${fechaActual}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      mostrarSnackbar(`Informe exportado correctamente en formato ${exportOptions.format.toUpperCase()}.`, 'success');
      
      setTimeout(() => {
        setLoadingExport(false);
        onClose();
      }, 1500);
    } catch (error) {
      clearInterval(progressInterval);
      setExportProgress(0);
      setLoadingExport(false);
      
      console.error('Error al exportar:', error);
      
      let errorMessage = 'Error al exportar el informe.';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (error instanceof AxiosError) {
        if (error.response) {
          const data = error.response.data;
          errorMessage = (data && data.message) ? data.message : `Error de servidor: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = 'No se recibió respuesta del servidor. Verifique su conexión.';
        }
      }
      
      mostrarSnackbar(errorMessage, 'error');
    }
  };
  
  return (
    <>
      {/* Snackbar para mensajes */}
      {snackbar.open && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 9999,
          borderRadius: '8px',
          padding: '12px 24px',
          backgroundColor: snackbar.severity === 'error' ? '#FFF0F0' : 
                           snackbar.severity === 'success' ? '#F0FFF0' : '#F0F0FF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          maxWidth: '80%',
          borderLeft: `4px solid ${
            snackbar.severity === 'error' ? '#FF0000' : 
            snackbar.severity === 'success' ? '#00AA00' : '#0088FF'
          }`
        }}>
          <Typography variant="body2" fontWeight="medium" color="textPrimary">
            {snackbar.message}
          </Typography>
        </div>
      )}
      
      <Dialog 
        open={open} 
        onClose={() => !loadingExport && onClose()}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 0.5,
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: theme.palette.primary.main,
              fontWeight: 600
            }}>
              <BusinessIcon sx={{ mr: 1 }} />
              Exportar Informe de Proyecto {!showProyectoSelector && selectedProyectoNombre && `- ${selectedProyectoNombre}`}
            </Typography>
            
            <Button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              startIcon={showAdvancedOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              endIcon={<SettingsIcon />}
              size="small"
              color="primary"
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
              }}
            >
              Opciones avanzadas
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {/* Selector de proyecto si showProyectoSelector es true */}
              {showProyectoSelector && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                    Seleccionar Proyecto
                  </Typography>
                  
                  {loadingProyectos ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      height: 100
                    }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : proyectos.length === 0 ? (
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2, 
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" align="center">
                        No hay proyectos disponibles.
                      </Typography>
                    </Paper>
                  ) : (
                    <FormControl fullWidth size="small">
                      <InputLabel>Proyecto</InputLabel>
                      <Select
                        value={selectedProyecto}
                        onChange={handleProyectoChange}
                        label="Proyecto"
                      >
                        {proyectos.map((proyecto) => (
                          <MenuItem key={proyecto.id} value={proyecto.id}>
                            {proyecto.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              )}
              
              {/* Sección de usuarios */}
              <Box sx={{ mt: 2, mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                  Usuarios Asignados al Proyecto
                </Typography>
                
                {loadingUsuarios ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: 100
                  }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : usuarios.length === 0 ? (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2, 
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" align="center">
                      No hay usuarios asignados a este proyecto.
                    </Typography>
                  </Paper>
                ) : (
                  <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        size="small" 
                        onClick={() => handleSelectAllUsuarios(true)}
                        sx={{ mr: 1, textTransform: 'none' }}
                      >
                        Seleccionar todos
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => handleSelectAllUsuarios(false)}
                        sx={{ textTransform: 'none' }}
                      >
                        Deseleccionar todos
                      </Button>
                    </Box>
                    
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}
                    >
                      <Grid container spacing={1}>
                        {usuarios.map((usuario) => (
                          <Grid item xs={12} sm={6} key={usuario.id}>
                            <Chip
                              label={`${usuario.nombres} ${usuario.appaterno}`}
                              variant={selectedUsuarios.includes(usuario.id) ? "filled" : "outlined"}
                              color={selectedUsuarios.includes(usuario.id) ? "primary" : "default"}
                              onClick={() => handleUsuarioSelection(usuario.id)}
                              sx={{ 
                                width: '100%', 
                                justifyContent: 'flex-start',
                                borderRadius: '8px',
                                '& .MuiChip-label': {
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </>
                )}
              </Box>

              {/* Opciones avanzadas de exportación */}
              <Collapse in={showAdvancedOptions}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                    Opciones Avanzadas
                  </Typography>
                  
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2, 
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Formato</InputLabel>
                          <Select
                            value={exportOptions.format}
                            label="Formato"
                            onChange={(e) => handleExportOptionChange('format', e.target.value)}
                          >
                            <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                            <MenuItem value="csv">CSV</MenuItem>
                            <MenuItem value="pdf">PDF</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Agrupar por</InputLabel>
                          <Select
                            value={exportOptions.groupBy}
                            label="Agrupar por"
                            onChange={(e) => handleExportOptionChange('groupBy', e.target.value)}
                          >
                            <MenuItem value="none">Sin agrupación</MenuItem>
                            <MenuItem value="user">Por usuario</MenuItem>
                            <MenuItem value="day">Por día</MenuItem>
                            <MenuItem value="week">Por semana</MenuItem>
                            <MenuItem value="month">Por mes</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Incluir usuarios inactivos */}
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={exportOptions.includeInactive}
                              onChange={(e) => handleExportOptionChange('includeInactive', e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Incluir usuarios inactivos"
                        />
                      </Grid>
                      
                      {/* Rango de fechas */}
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={exportOptions.dateRange.enabled}
                              onChange={(e) => handleDateRangeChange('enabled', e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Filtrar por rango de fechas"
                        />
                      </Grid>
                      
                      {exportOptions.dateRange.enabled && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <DatePicker
                              label="Fecha de inicio"
                              value={exportOptions.dateRange.startDate}
                              onChange={(date) => handleDateRangeChange('startDate', date)}
                              slotProps={{ 
                                textField: { 
                                  fullWidth: true,
                                  size: 'small',
                                  InputProps: {
                                    startAdornment: (
                                      <CalendarIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                                    ),
                                  }
                                } 
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <DatePicker
                              label="Fecha de fin"
                              value={exportOptions.dateRange.endDate}
                              onChange={(date) => handleDateRangeChange('endDate', date)}
                              slotProps={{ 
                                textField: { 
                                  fullWidth: true,
                                  size: 'small',
                                  InputProps: {
                                    startAdornment: (
                                      <CalendarIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                                    ),
                                  }
                                } 
                              }}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Paper>
                </Box>
              </Collapse>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                    Información
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Este informe incluirá todas las actividades del proyecto seleccionado según los filtros configurados.
                  </Typography>
                  
                  <Chip 
                    icon={<DateRangeIcon />}
                    label={exportOptions.dateRange.enabled 
                      ? "Filtrado por fechas específicas"
                      : "Todas las fechas disponibles"
                    }
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" mt={2}>
                    <strong>Tip:</strong> {currentTip}
                  </Typography>
                </Box>
                
                {loadingExport && (
                  <Box sx={{ width: '100%', mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Generando informe... {exportProgress}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={exportProgress} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2
                        }
                      }} 
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={onClose}
            disabled={loadingExport}
            variant="outlined"
            sx={{ 
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleExport}
            variant="contained"
            disabled={usuarios.length === 0 || selectedUsuarios.length === 0 || loadingExport}
            startIcon={loadingExport ? <CircularProgress size={20} /> : <FileDownloadIcon />}
            sx={{ 
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
            }}
          >
            {loadingExport ? 'Exportando...' : `Exportar a ${exportOptions.format.toUpperCase()}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InformePorProyectoModal; 