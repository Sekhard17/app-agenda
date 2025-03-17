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
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Paper,
  alpha,
  useTheme,
  Chip,
  IconButton,
  Zoom,
  Grid,
  Snackbar,
  Alert,
  LinearProgress,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormLabel,
  Collapse,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Lightbulb as LightbulbIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_CONFIG } from '../config/api.config';

// Interfaces
interface Usuario {
  id: string;
  rut: string;
  nombres: string;
  appaterno: string;
  apmaterno: string;
  email: string;
  rol: 'funcionario' | 'supervisor';
  id_supervisor?: string;
  nombre_usuario: string;
}

interface Proyecto {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
  activo: boolean;
}

interface InformeSupervisadoModalProps {
  open: boolean;
  onClose: () => void;
}

// Tips para mostrar en la modal
const TIPS = [
  "Exporta informes regularmente para hacer seguimiento del progreso de tus supervisados.",
  "Filtra por proyecto específico para análisis detallados de rendimiento.",
  "Compara informes mensuales para identificar tendencias de productividad.",
  "Utiliza los informes en reuniones de retroalimentación con tus supervisados.",
  "Exporta a Excel para crear gráficos personalizados y análisis avanzados."
];

// Nueva interfaz para las opciones de exportación
interface ExportOptions {
  includeInactive: boolean;
  dateRange: {
    enabled: boolean;
    startDate: Date | null;
    endDate: Date | null;
  };
  format: 'excel' | 'csv' | 'pdf';
  groupBy: 'none' | 'day' | 'week' | 'month';
}

const InformeSupervisadoModal: React.FC<InformeSupervisadoModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const token = Cookies.get('auth_token');
  
  // Estados
  const [supervisados, setSupervisados] = useState<Usuario[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedSupervisado, setSelectedSupervisado] = useState<string>('');
  const [selectedProyecto, setSelectedProyecto] = useState<string>('');
  const [loadingSupervisados, setLoadingSupervisados] = useState<boolean>(false);
  const [loadingProyectos, setLoadingProyectos] = useState<boolean>(false);
  const [loadingExport, setLoadingExport] = useState<boolean>(false);
  const [currentTip, setCurrentTip] = useState<string>(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Nuevos estados para opciones avanzadas
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeInactive: true,
    dateRange: {
      enabled: false,
      startDate: null,
      endDate: null,
    },
    format: 'excel',
    groupBy: 'none',
  });

  // Cargar supervisados al abrir la modal
  useEffect(() => {
    if (open) {
      fetchSupervisados();
      fetchProyectos();
      // Seleccionar un tip aleatorio
      setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }
  }, [open]);

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

  // Obtener supervisados
  const fetchSupervisados = async () => {
    setLoadingSupervisados(true);
    try {
      // Usar la misma estructura que en Supervisados.tsx
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USUARIOS.SUPERVISADOS}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      
      // Verificar la estructura de la respuesta
      console.log('Respuesta de supervisados:', response.data);
      
      // Acceder a los supervisados correctamente
      // La respuesta puede tener los supervisados directamente o dentro de una propiedad 'supervisados'
      const supervisadosData = Array.isArray(response.data) 
        ? response.data 
        : (response.data && response.data.supervisados && Array.isArray(response.data.supervisados)) 
          ? response.data.supervisados 
          : [];
      
      setSupervisados(supervisadosData);
      
      // Ya no seleccionamos automáticamente el primer supervisado
      // Dejamos el valor vacío para que se muestre "Seleccione un Supervisado"
    } catch (error) {
      console.error('Error al obtener supervisados:', error);
      setSupervisados([]);
      mostrarSnackbar('Error al cargar los supervisados. Por favor, inténtelo de nuevo.', 'error');
    } finally {
      setLoadingSupervisados(false);
    }
  };

  // Obtener proyectos
  const fetchProyectos = async () => {
    setLoadingProyectos(true);
    try {
      // Usar la misma estructura que en GestionProyectos.tsx
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      
      // Verificar la estructura de la respuesta
      console.log('Respuesta de proyectos:', response.data);
      
      // Acceder a los proyectos correctamente
      // La respuesta puede tener los proyectos directamente o dentro de una propiedad 'proyectos'
      const proyectosData = Array.isArray(response.data) 
        ? response.data 
        : (response.data && response.data.proyectos && Array.isArray(response.data.proyectos)) 
          ? response.data.proyectos 
          : [];
      
      // Incluir todos los proyectos, pero marcar los inactivos
      setProyectos(proyectosData);
      
      if (supervisados.length > 0 && proyectosData.length > 0) {
        mostrarSnackbar('Datos cargados correctamente. Seleccione un supervisado y un proyecto para generar el informe.', 'info');
      }
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      setProyectos([]);
      mostrarSnackbar('Error al cargar los proyectos. Por favor, inténtelo de nuevo.', 'error');
    } finally {
      setLoadingProyectos(false);
    }
  };

  // Manejar cambio de supervisado
  const handleSupervisadoChange = (event: SelectChangeEvent) => {
    setSelectedSupervisado(event.target.value);
  };

  // Manejar cambio de proyecto
  const handleProyectoChange = (event: SelectChangeEvent) => {
    setSelectedProyecto(event.target.value);
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

  // Exportar a Excel con opciones avanzadas
  const handleExportToExcel = async () => {
    if (!selectedSupervisado) {
      mostrarSnackbar('Por favor, seleccione un supervisado para generar el informe.', 'error');
      return;
    }
    
    if (selectedSupervisado === '') {
      mostrarSnackbar('Por favor, seleccione un supervisado para generar el informe.', 'error');
      return;
    }
    
    if (selectedProyecto === '') {
      mostrarSnackbar('Por favor, seleccione un proyecto o la opción "Todos los proyectos".', 'error');
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
    
    // Simulación de progreso (en un caso real, esto vendría del backend)
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
      // Construir la URL con los parámetros
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INFORMES.SUPERVISADO_EXCEL(selectedSupervisado)}`;
      
      // Construir los parámetros de consulta
      const params = new URLSearchParams();
      
      if (selectedProyecto !== 'todos' && selectedProyecto !== '') {
        params.append('proyecto', selectedProyecto);
      }
      
      if (exportOptions.dateRange.enabled && exportOptions.dateRange.startDate && exportOptions.dateRange.endDate) {
        params.append('fechaInicio', exportOptions.dateRange.startDate.toISOString().split('T')[0]);
        params.append('fechaFin', exportOptions.dateRange.endDate.toISOString().split('T')[0]);
      }
      
      params.append('formato', exportOptions.format);
      params.append('agruparPor', exportOptions.groupBy);
      params.append('incluirInactivos', exportOptions.includeInactive.toString());
      
      // Agregar los parámetros a la URL
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Realizar la solicitud para descargar el archivo
      const response = await axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + token
        },
        responseType: 'blob'
      });
      
      // Detener la simulación de progreso
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Verificar si la respuesta es válida
      if (response.status !== 200) {
        throw new Error('Error al generar el informe');
      }
      
      // Verificar si el blob tiene contenido
      if (response.data.size === 0) {
        throw new Error('El archivo generado está vacío');
      }
      
      // Determinar el tipo MIME según el formato
      let mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      let extension = 'xlsx';
      
      if (exportOptions.format === 'csv') {
        mimeType = 'text/csv';
        extension = 'csv';
      } else if (exportOptions.format === 'pdf') {
        mimeType = 'application/pdf';
        extension = 'pdf';
      }
      
      // Crear un objeto URL para el blob
      const blob = new Blob([response.data], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Crear un enlace y hacer clic en él para descargar
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Obtener el nombre del supervisado seleccionado
      const supervisado = supervisados.find(s => s.id === selectedSupervisado);
      const nombreSupervisado = supervisado ? 
        `${supervisado.nombres || 'Usuario'}_${supervisado.appaterno || 'Supervisado'}` : 
        'supervisado';
      
      // Obtener el nombre del proyecto si se seleccionó uno específico
      let nombreProyecto = 'todos';
      if (selectedProyecto !== 'todos') {
        const proyecto = proyectos.find(p => p.id === selectedProyecto);
        if (proyecto) {
          nombreProyecto = proyecto.nombre.replace(/\s+/g, '_');
        }
      }
      
      // Nombre del archivo
      const fechaActual = new Date().toISOString().split('T')[0];
      link.download = `Informe_${nombreSupervisado}_${nombreProyecto}_${fechaActual}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar el objeto URL
      window.URL.revokeObjectURL(downloadUrl);
      
      // Mostrar mensaje de éxito
      mostrarSnackbar(`Informe exportado correctamente en formato ${exportOptions.format.toUpperCase()}.`, 'success');
      
      // Cerrar la modal después de la descarga
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error al exportar el informe:', error);
      clearInterval(progressInterval);
      setExportProgress(0);
      mostrarSnackbar('Error al exportar el informe. Por favor, inténtelo de nuevo más tarde.', 'error');
    } finally {
      setLoadingExport(false);
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
            <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Informe por Supervisado
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
                  Seleccionar Supervisado
                </Typography>
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <InputLabel id="supervisado-label">Seleccionar Supervisado</InputLabel>
                  <Select
                    labelId="supervisado-label"
                    id="supervisado-select"
                    value={selectedSupervisado}
                    label="Seleccionar Supervisado"
                    onChange={handleSupervisadoChange}
                    disabled={loadingSupervisados}
                    displayEmpty
                    startAdornment={
                      loadingSupervisados ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : (
                        <PersonIcon sx={{ ml: 1, mr: 1, color: theme.palette.text.secondary }} />
                      )
                    }
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione un Supervisado</em>
                    </MenuItem>
                    {supervisados && supervisados.length > 0 ? (
                      supervisados.map((supervisado) => (
                        <MenuItem key={supervisado.id} value={supervisado.id}>
                          {`${supervisado.nombres} ${supervisado.appaterno} ${supervisado.apmaterno}`}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No hay supervisados disponibles</MenuItem>
                    )}
                  </Select>
                </FormControl>
                
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                  Seleccionar Proyecto
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="proyecto-label">Seleccionar Proyecto</InputLabel>
                  <Select
                    labelId="proyecto-label"
                    id="proyecto-select"
                    value={selectedProyecto}
                    label="Seleccionar Proyecto"
                    onChange={handleProyectoChange}
                    disabled={loadingProyectos}
                    displayEmpty
                    startAdornment={
                      loadingProyectos ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : (
                        <AssignmentIcon sx={{ ml: 1, mr: 1, color: theme.palette.text.secondary }} />
                      )
                    }
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione un Proyecto</em>
                    </MenuItem>
                    <MenuItem value="todos">Todos los proyectos</MenuItem>
                    {proyectos && proyectos.length > 0 ? (
                      proyectos.map((proyecto) => (
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
                      ))
                    ) : (
                      <MenuItem disabled>No hay proyectos disponibles</MenuItem>
                    )}
                  </Select>
                </FormControl>
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
                    <Typography variant="body2">Actividades completadas y pendientes</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="body2">Horas registradas por actividad</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="body2">Distribución de tiempo por proyecto</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="body2">Estadísticas de rendimiento</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Consejo útil */}
              <Zoom in={true}>
                <Box component={Paper} sx={{ 
                  p: 2.5, 
                  borderRadius: '16px',
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LightbulbIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                      Consejo útil
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {currentTip}
                  </Typography>
                </Box>
              </Zoom>
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
            onClick={handleExportToExcel}
            variant="contained"
            disabled={!selectedSupervisado || selectedProyecto === '' || loadingExport}
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

      {/* Snackbar para notificaciones */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InformeSupervisadoModal; 