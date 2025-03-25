import React, { useState } from 'react';
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
  MenuItem,
  Grid,
  Paper,
  Chip,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  FormLabel,
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
  CheckCircle as CheckCircleIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_CONFIG } from '../config/api.config';
import { AxiosError } from 'axios';

// Tips para mostrar en la modal
const TIPS = [
  "Exporta informes periódicamente para analizar tendencias de actividad.",
  "Utiliza diferentes agrupaciones para visualizar patrones de trabajo.",
  "Compara períodos similares para identificar mejoras en la productividad.",
  "Exporta a Excel para crear gráficos personalizados y análisis detallados.",
  "Usa filtros por proyecto para análisis específicos de cada área."
];

// Interfaz para las opciones de exportación
interface ExportOptions {
  includeInactive: boolean;
  format: 'excel' | 'csv' | 'pdf';
  groupBy: 'none' | 'day' | 'week' | 'month';
  selectedProyecto: string;
}

interface InformePorFechasModalProps {
  open: boolean;
  onClose: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
  initialProyectoId?: string;
}

const InformePorFechasModal: React.FC<InformePorFechasModalProps> = ({ 
  open, 
  onClose,
  initialStartDate,
  initialEndDate,
  initialProyectoId
}) => {
  const theme = useTheme();
  const token = Cookies.get('auth_token');
  
  // Estados
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate ? new Date(initialStartDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate ? new Date(initialEndDate) : null);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loadingProyectos, setLoadingProyectos] = useState<boolean>(false);
  const [loadingExport, setLoadingExport] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [currentTip] = useState<string>(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
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
    groupBy: 'none',
    selectedProyecto: initialProyectoId || ''
  });

  // Cargar proyectos al abrir la modal
  React.useEffect(() => {
    if (open) {
      fetchProyectos();
    }
  }, [open]);

  // Obtener proyectos
  const fetchProyectos = async () => {
    setLoadingProyectos(true);
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      
      const proyectosData = Array.isArray(response.data) 
        ? response.data 
        : (response.data && response.data.proyectos && Array.isArray(response.data.proyectos)) 
          ? response.data.proyectos 
          : [];
      
      setProyectos(proyectosData);
      
      if (proyectosData.length > 0) {
        mostrarSnackbar('Seleccione un rango de fechas para generar el informe.', 'info');
      }
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      setProyectos([]);
      mostrarSnackbar('Error al cargar los proyectos. Por favor, inténtelo de nuevo.', 'error');
    } finally {
      setLoadingProyectos(false);
    }
  };

  // Mostrar snackbar
  const mostrarSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Función para manejar cambios en las opciones de exportación
  const handleExportOptionChange = (option: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  // Exportar informe
  const handleExport = async () => {
    if (!startDate || !endDate) {
      mostrarSnackbar('Por favor, seleccione un rango de fechas completo.', 'error');
      return;
    }

    if (startDate > endDate) {
      mostrarSnackbar('La fecha de inicio no puede ser posterior a la fecha de fin.', 'error');
      return;
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
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INFORMES.POR_FECHAS}`;
      
      // Log de la URL base
      console.log('URL base para exportación:', url);
      
      const params = new URLSearchParams();
      
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
      
      const fechaInicioStr = formatearFechaParaChile(startDate);
      const fechaFinStr = formatearFechaParaChile(endDate);
      
      params.append('fechaInicio', fechaInicioStr);
      params.append('fechaFin', fechaFinStr);
      
      // Log de fechas
      console.log('Fechas para exportación:', {
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr,
        startDateOriginal: startDate.toISOString(),
        endDateOriginal: endDate.toISOString()
      });
      
      if (exportOptions.selectedProyecto !== '') {
        params.append('proyecto', exportOptions.selectedProyecto);
        console.log('Proyecto seleccionado:', exportOptions.selectedProyecto);
      }
      
      params.append('formato', exportOptions.format);
      params.append('agruparPor', exportOptions.groupBy);
      params.append('incluirInactivos', exportOptions.includeInactive.toString());
      
      // Log de opciones de exportación
      console.log('Opciones de exportación:', {
        formato: exportOptions.format,
        agruparPor: exportOptions.groupBy,
        incluirInactivos: exportOptions.includeInactive
      });
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Log de URL completa
      console.log('URL completa para exportación:', url);

      console.log('Iniciando solicitud de exportación...');
      
      const response = await axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + token
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
        throw new Error('No se encontraron actividades en el período seleccionado');
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

      // Log del tipo MIME y extensión
      console.log('Tipo de archivo:', { mimeType, extension });

      const blob = new Blob([response.data], { type: mimeType });
      console.log('Tamaño del blob:', blob.size);

      if (blob.size < 100) { // Un archivo Excel válido debería ser más grande que esto
        throw new Error('El informe generado está vacío o es inválido. No hay actividades para mostrar.');
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const fechaInicio = startDate.toISOString().split('T')[0];
      const fechaFin = endDate.toISOString().split('T')[0];
      
      let nombreProyecto = 'todos';
      if (exportOptions.selectedProyecto !== '') {
        const proyecto = proyectos.find(p => p.id === exportOptions.selectedProyecto);
        if (proyecto) {
          nombreProyecto = proyecto.nombre.replace(/\s+/g, '_');
        }
      }

      link.download = `Informe_${fechaInicio}_${fechaFin}_${nombreProyecto}.${extension}`;
      
      // Log del nombre del archivo
      console.log('Nombre del archivo:', link.download);

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
      
      // Mejorar el manejo de errores
      console.error('Error al exportar:', error);
      
      let errorMessage = 'Error al exportar el informe.';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (error instanceof AxiosError) {
        if (error.response) {
          // El servidor respondió con un código de estado diferente de 2xx
          const data = error.response.data;
          errorMessage = (data && data.message) ? data.message : `Error de servidor: ${error.response.status}`;
        } else if (error.request) {
          // La solicitud se hizo pero no se recibió respuesta
          errorMessage = 'No se recibió respuesta del servidor. Verifique su conexión.';
        }
      }
      
      mostrarSnackbar(errorMessage, 'error');
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DateRangeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Informe por Fechas
            </Typography>
          </Box>
          <Chip 
            label="Exportación a Excel" 
            color="primary" 
            size="small"
            sx={{ 
              fontWeight: 500,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }} 
          />
        </DialogTitle>

        <DialogContent sx={{ pt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ mt: 2, mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                  Seleccionar Rango de Fechas
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Fecha de inicio"
                      value={startDate}
                      onChange={(date) => setStartDate(date)}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          size: "small",
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
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          size: "small",
                          InputProps: {
                            startAdornment: (
                              <CalendarIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                            ),
                          }
                        } 
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Opciones avanzadas de exportación */}
              <Box sx={{ mt: 3, mb: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 2,
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SettingsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Opciones avanzadas de exportación
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    {showAdvancedOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Collapse in={showAdvancedOptions}>
                  <Paper sx={{ p: 2, borderRadius: '12px', mb: 3 }}>
                    <Grid container spacing={2}>
                      {/* Formato de exportación */}
                      <Grid item xs={12} sm={6}>
                        <FormControl component="fieldset">
                          <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>
                            Formato de exportación
                          </FormLabel>
                          <RadioGroup
                            row
                            value={exportOptions.format}
                            onChange={(e) => handleExportOptionChange('format', e.target.value)}
                          >
                            <FormControlLabel 
                              value="excel" 
                              control={<Radio size="small" />} 
                              label="Excel" 
                            />
                            <FormControlLabel 
                              value="csv" 
                              control={<Radio size="small" />} 
                              label="CSV" 
                            />
                            <FormControlLabel 
                              value="pdf" 
                              control={<Radio size="small" />} 
                              label="PDF" 
                            />
                          </RadioGroup>
                        </FormControl>
                      </Grid>

                      {/* Agrupar por */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Agrupar por</InputLabel>
                          <Select
                            value={exportOptions.groupBy}
                            label="Agrupar por"
                            onChange={(e) => handleExportOptionChange('groupBy', e.target.value)}
                          >
                            <MenuItem value="none">Sin agrupación</MenuItem>
                            <MenuItem value="day">Por día</MenuItem>
                            <MenuItem value="week">Por semana</MenuItem>
                            <MenuItem value="month">Por mes</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Selección de proyecto */}
                      <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Proyecto</InputLabel>
                          <Select
                            value={exportOptions.selectedProyecto}
                            label="Proyecto"
                            onChange={(e) => handleExportOptionChange('selectedProyecto', e.target.value)}
                            disabled={loadingProyectos}
                          >
                            <MenuItem value="">Todos los proyectos</MenuItem>
                            {proyectos.map((proyecto) => (
                              <MenuItem 
                                key={proyecto.id} 
                                value={proyecto.id}
                                sx={{
                                  color: !proyecto.activo ? alpha(theme.palette.text.primary, 0.6) : 'inherit',
                                  fontStyle: !proyecto.activo ? 'italic' : 'normal',
                                }}
                              >
                                {proyecto.nombre}
                                {!proyecto.activo && (
                                  <Typography 
                                    component="span" 
                                    variant="caption" 
                                    sx={{ 
                                      ml: 1, 
                                      color: theme.palette.error.main,
                                      fontWeight: 500,
                                    }}
                                  >
                                    (Inactivo)
                                  </Typography>
                                )}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Incluir proyectos inactivos */}
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={exportOptions.includeInactive}
                              onChange={(e) => handleExportOptionChange('includeInactive', e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Incluir proyectos inactivos"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Collapse>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              {/* Sección "¿Qué incluye este informe?" */}
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  ¿Qué incluye este informe?
                </Typography>
                <Box component={Paper} sx={{ 
                  p: 2, 
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.background.paper, 0.7),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="body2">Resumen de actividades por fecha</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="body2">Horas totales por período</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="body2">Distribución por proyecto</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="body2">Análisis de productividad</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Consejo útil */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Consejo útil
                </Typography>
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                }}>
                  <Typography variant="body2" sx={{ color: theme.palette.info.main }}>
                    {currentTip}
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          {loadingExport && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                Generando informe... {exportProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={exportProgress} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }}
              />
            </Box>
          )}

          <Button 
            onClick={onClose}
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
            disabled={!startDate || !endDate || loadingExport}
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

export default InformePorFechasModal; 