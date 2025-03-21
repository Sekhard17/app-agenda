import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  Alert,
  Divider,
  Fade,
  Zoom,
  Grow,
  InputAdornment,
  Avatar,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Collapse
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  Clear as ClearIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { motion } from 'framer-motion';
import ApiService from '../services/api.service';
import { API_CONFIG } from '../config/api.config';
import DualView, { ViewType } from '../components/DualView';

// Importar FilePond y sus plugins
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImageCrop from 'filepond-plugin-image-crop';
import FilePondPluginImageResize from 'filepond-plugin-image-resize';
import FilePondPluginImageTransform from 'filepond-plugin-image-transform';

// Importar estilos de FilePond
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Registrar plugins de FilePond
registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize,
  FilePondPluginImageExifOrientation,
  FilePondPluginImageCrop,
  FilePondPluginImageResize,
  FilePondPluginImageTransform
);

// Definir la interfaz para los proyectos
interface Proyecto {
  id: string;
  nombre: string;
  descripcion?: string;
  id_supervisor: string;
  id_externo_rex?: string;
  activo: boolean;
  estado: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
  fecha_inicio?: Date;
  fecha_fin?: Date;
  responsable_id?: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

// Definir la interfaz para crear/actualizar proyectos
interface ProyectoForm {
  nombre: string;
  descripcion?: string;
  id_supervisor?: string;
  id_externo_rex?: string;
  estado: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
  fecha_inicio?: Date | null;
  fecha_fin?: Date | null;
  responsable_id?: string;
  recursos: any[];
}

// Componente principal
const GestionProyectos = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  const token = Cookies.get('auth_token');
  
  // Estados
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [viewType, setViewType] = useState<ViewType>(() => {
    const savedView = localStorage.getItem('gestionProyectosViewType') as ViewType;
    return savedView || 'table';
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [formMode, setFormMode] = useState<'crear' | 'editar'>('crear');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>('');
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado del formulario
  const [formData, setFormData] = useState<ProyectoForm>({
    nombre: '',
    descripcion: '',
    estado: 'planificado',
    fecha_inicio: null,
    fecha_fin: null,
    recursos: []
  });

  // Estados para validación
  const [errors, setErrors] = useState<{
    nombre?: string;
    descripcion?: string;
    estado?: string;
    fechas?: string;
  }>({});

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Cargar proyectos al iniciar
  useEffect(() => {
    fetchProyectos();
  }, []);

  // Función para obtener los proyectos
  const fetchProyectos = async () => {
    setLoading(true);
    try {
      // Importar la configuración de la API
      const { API_CONFIG } = await import('../config/api.config');
      console.log('URL de la API:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.PROYECTOS.BASE);
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}?activo=true`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Respuesta de proyectos:', response.data);
      setProyectos(response.data.proyectos || []);
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      mostrarSnackbar('Error al cargar los proyectos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar snackbar
  const mostrarSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Abrir diálogo para crear proyecto
  const handleOpenCreateDialog = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      estado: 'planificado',
      fecha_inicio: null,
      fecha_fin: null,
      recursos: []
    });
    setFormMode('crear');
    setOpenDialog(true);
  };

  // Abrir diálogo para editar proyecto
  const handleOpenEditDialog = async (proyecto: Proyecto) => {
    setSelectedProyecto(proyecto);
    setFormData({
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion || '',
      estado: proyecto.estado,
      fecha_inicio: proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio) : null,
      fecha_fin: proyecto.fecha_fin ? new Date(proyecto.fecha_fin) : null,
      recursos: []
    });
    setFormMode('editar');
    setOpenDialog(true);

    try {
      const { API_CONFIG } = await import('../config/api.config');
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECURSOS.BY_PROYECTO(proyecto.id)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.recursos) {
        // Convertir los recursos a formato FilePond
        const recursosFilePond = response.data.recursos.map((recurso: any) => ({
          source: recurso.id,
          options: {
            type: 'local',
            file: {
              name: recurso.nombre,
              size: recurso.tamaño_bytes,
              type: recurso.tipo_archivo
            }
          },
          filename: recurso.nombre
        }));

        setFormData(prev => ({
          ...prev,
          recursos: recursosFilePond
        }));
      }
    } catch (error) {
      console.error('Error al cargar recursos:', error);
      mostrarSnackbar('Error al cargar los recursos del proyecto', 'error');
    }
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProyecto(null);
  };

  // Función de validación
  const validateForm = (): boolean => {
    const newErrors: {
      nombre?: string;
      descripcion?: string;
      estado?: string;
      fechas?: string;
    } = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del proyecto es obligatorio';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar descripción - ahora es obligatoria
    if (!formData.descripcion || !formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción del proyecto es obligatoria';
    } else if (formData.descripcion.trim().length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }

    // Validar estado
    if (!formData.estado) {
      newErrors.estado = 'El estado del proyecto es obligatorio';
    }

    // Validar fechas - ahora son obligatorias
    if (!formData.fecha_inicio) {
      newErrors.fechas = 'La fecha de inicio es obligatoria';
    } else if (!formData.fecha_fin) {
      newErrors.fechas = 'La fecha de fin es obligatoria';
    } else if (formData.fecha_inicio && formData.fecha_fin) {
      if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
        newErrors.fechas = 'La fecha de fin no puede ser anterior a la fecha de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Modificar handleFormChange para validar en tiempo real
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const maxLength = 250; // Límite máximo de caracteres

    // Actualizar el estado con el valor (limitado al máximo)
    const truncatedValue = value.slice(0, maxLength);
    setFormData(prev => ({
      ...prev,
      [name]: truncatedValue
    }));
    
    // Validar el campo específico
    const fieldErrors: any = {};
    
    switch (name) {
      case 'nombre':
        if (!truncatedValue.trim()) {
          fieldErrors.nombre = 'El nombre del proyecto es obligatorio';
        } else if (truncatedValue.trim().length < 3) {
          fieldErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
        } else if (truncatedValue.length >= maxLength) {
          fieldErrors.nombre = `Has alcanzado el límite de ${maxLength} caracteres`;
        } else {
          // Si no hay errores, eliminar cualquier error previo
          fieldErrors.nombre = undefined;
        }
        break;
        
      case 'descripcion':
        // Ahora la descripción es obligatoria
        if (!truncatedValue.trim()) {
          fieldErrors.descripcion = 'La descripción del proyecto es obligatoria';
        } else if (truncatedValue.trim().length < 10) {
          fieldErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
        } else if (truncatedValue.length >= maxLength) {
          fieldErrors.descripcion = `Has alcanzado el límite de ${maxLength} caracteres`;
        } else {
          // Si no hay errores, eliminar cualquier error previo
          fieldErrors.descripcion = undefined;
        }
        break;
    }
    
    // Actualizar solo los errores del campo actual
    setErrors(prev => ({ ...prev, ...fieldErrors }));
  };

  // Manejar cambios en selects
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Modificar handleDateChange para validar fechas
  const handleDateChange = (name: string, date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));

    // Validar fechas
    if (name === 'fecha_inicio') {
      if (!date) {
        setErrors(prev => ({
          ...prev,
          fechas: 'La fecha de inicio es obligatoria'
        }));
      } else if (formData.fecha_fin && date > formData.fecha_fin) {
        setErrors(prev => ({
          ...prev,
          fechas: 'La fecha de inicio no puede ser posterior a la fecha de fin'
        }));
      } else {
        // Solo eliminar el error si también hay fecha de fin
        if (formData.fecha_fin) {
          setErrors(prev => ({ ...prev, fechas: undefined }));
        }
      }
    }

    if (name === 'fecha_fin') {
      if (!date) {
        setErrors(prev => ({
          ...prev,
          fechas: 'La fecha de fin es obligatoria'
        }));
      } else if (formData.fecha_inicio && date < formData.fecha_inicio) {
        setErrors(prev => ({
          ...prev,
          fechas: 'La fecha de fin no puede ser anterior a la fecha de inicio'
        }));
      } else {
        // Solo eliminar el error si también hay fecha de inicio
        if (formData.fecha_inicio) {
          setErrors(prev => ({ ...prev, fechas: undefined }));
        }
      }
    }
  };

  // Manejar archivos de FilePond
  const handleUpdateFiles = (fileItems: any[]) => {
    setFormData(prevData => ({
      ...prevData,
      recursos: fileItems
    }));
  };

  // Guardar proyecto (crear o actualizar)
  const handleSaveProyecto = async () => {
    if (!validateForm()) {
      mostrarSnackbar('Por favor, completa correctamente todos los campos requeridos', 'error');
      return;
    }

    try {
      const { API_CONFIG } = await import('../config/api.config');
      
      if (formMode === 'crear') {
        // Crear el proyecto primero
        const proyectoResponse = await axios.post(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}`,
          {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            estado: formData.estado,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            id_supervisor: usuario?.id
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Si hay recursos, subirlos
        if (formData.recursos && formData.recursos.length > 0) {
          const proyectoId = proyectoResponse.data.proyecto.id;
          
          // Subir cada recurso
          for (const fileItem of formData.recursos) {
            const formDataArchivo = new FormData();
            formDataArchivo.append('archivo', fileItem.file);
            formDataArchivo.append('id_proyecto', proyectoId);
            formDataArchivo.append('nombre', fileItem.filename);
            formDataArchivo.append('descripcion', `Recurso adjunto al crear el proyecto: ${formData.nombre}`);

            await axios.post(
              `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECURSOS.BASE}`,
              formDataArchivo,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
          }
        }

        mostrarSnackbar('Proyecto creado exitosamente', 'success');
      } else {
        // Actualizar proyecto existente
        await axios.put(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.BY_ID(selectedProyecto?.id || '')}`,
          {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            estado: formData.estado,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Si hay nuevos recursos, subirlos
        if (formData.recursos && formData.recursos.length > 0) {
          for (const fileItem of formData.recursos) {
            const formDataArchivo = new FormData();
            formDataArchivo.append('archivo', fileItem.file);
            formDataArchivo.append('id_proyecto', selectedProyecto?.id || '');
            formDataArchivo.append('nombre', fileItem.filename);
            formDataArchivo.append('descripcion', `Recurso adjunto al editar el proyecto: ${formData.nombre}`);

            await axios.post(
              `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECURSOS.BASE}`,
              formDataArchivo,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
          }
        }

        mostrarSnackbar('Proyecto actualizado exitosamente', 'success');
      }
      
      // Cerrar diálogo y recargar proyectos
      handleCloseDialog();
      fetchProyectos();
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
      mostrarSnackbar('Error al guardar el proyecto', 'error');
    }
  };

  // Activar/Desactivar proyecto
  const handleToggleActivoProyecto = async (proyecto: Proyecto) => {
    try {
      const action = proyecto.activo ? 'DESACTIVAR' : 'ACTIVAR';
      const endpoint = API_CONFIG.ENDPOINTS.PROYECTOS[action](proyecto.id);
      
      await ApiService.patch(endpoint);
      
      mostrarSnackbar(`Proyecto ${proyecto.activo ? 'desactivado' : 'activado'} exitosamente`, 'success');
      fetchProyectos();
    } catch (error) {
      console.error('Error al cambiar estado del proyecto:', error);
      mostrarSnackbar('Error al cambiar el estado del proyecto', 'error');
    }
  };

  // Filtrar proyectos
  const proyectosFiltrados = proyectos ? proyectos.filter(proyecto => {
    // Filtrar por búsqueda
    if (filtroBusqueda) {
      const searchTerm = filtroBusqueda.toLowerCase();
      if (!proyecto.nombre.toLowerCase().includes(searchTerm) &&
          !proyecto.descripcion?.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }

    // Filtrar por estado
    if (filtroEstado && proyecto.estado !== filtroEstado) {
      return false;
    }

    // Filtrar por fecha de inicio
    if (filtroFechaInicio && proyecto.fecha_inicio) {
      const fechaInicio = new Date(filtroFechaInicio);
      const proyectoInicio = new Date(proyecto.fecha_inicio);
      if (proyectoInicio < fechaInicio) {
        return false;
      }
    }

    // Filtrar por fecha fin
    if (filtroFechaFin && proyecto.fecha_fin) {
      const fechaFin = new Date(filtroFechaFin);
      const proyectoFin = new Date(proyecto.fecha_fin);
      if (proyectoFin > fechaFin) {
        return false;
      }
    }

    return true;
  }) : [];

  // Renderizar chip de estado
  const renderEstadoChip = (estado: string) => {
    switch (estado) {
      case 'planificado':
        return (
          <Chip 
            label="Planificado" 
            size="small"
            icon={<CalendarTodayIcon />}
            sx={{ 
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.main,
              fontWeight: 500,
              '& .MuiChip-icon': { color: theme.palette.info.main }
            }} 
          />
        );
      case 'en_progreso':
        return (
          <Chip 
            label="En Progreso" 
            size="small"
            icon={<PlayArrowIcon />}
            sx={{ 
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              color: theme.palette.warning.main,
              fontWeight: 500,
              '& .MuiChip-icon': { color: theme.palette.warning.main }
            }} 
          />
        );
      case 'completado':
        return (
          <Chip 
            label="Completado" 
            size="small"
            icon={<CheckCircleIcon />}
            sx={{ 
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main,
              fontWeight: 500,
              '& .MuiChip-icon': { color: theme.palette.success.main }
            }} 
          />
        );
      case 'cancelado':
        return (
          <Chip 
            label="Cancelado" 
            size="small"
            icon={<CancelIcon />}
            sx={{ 
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              fontWeight: 500,
              '& .MuiChip-icon': { color: theme.palette.error.main }
            }} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Fade in={true} timeout={800}>
      <Box>
        {/* Hero Section */}
        <Box
          sx={{
            position: 'relative',
            mb: 4,
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: -32,
              right: -32,
              height: '120px',
              background: `linear-gradient(to bottom right, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              zIndex: -1,
            }
          }}
        >
          {/* Header Content */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              {/* Title */}
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', md: '1.75rem' },
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.5px'
                }}
              >
                Gestión de Proyectos
              </Typography>

              {/* Breadcrumb */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                py: 1,
                px: 2
              }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: theme.palette.primary.dark,
                      transform: 'translateY(-1px)'
                    }
                  }}
                  component="a"
                  href="/"
                >
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'inherit'
                    }}
                  >
                    <HomeIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography
                    sx={{
                      ml: 1,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'inherit'
                    }}
                  >
                    Inicio
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.palette.text.primary
                  }}
                >
                  <Typography sx={{ mx: 1, color: theme.palette.text.secondary }}>/</Typography>
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography
                    sx={{
                      ml: 1,
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    Gestión de Proyectos
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Vista selector y botones de acción */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}>
          {/* Buscador */}
          <TextField
            placeholder="Buscar proyectos..."
            variant="outlined"
            size="small"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
              endAdornment: filtroBusqueda ? (
                <InputAdornment position="end">
                  <IconButton 
                    size="small"
                    onClick={() => setFiltroBusqueda('')}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                height: '40px',
                borderRadius: '8px',
                bgcolor: 'background.paper',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.2),
                  borderWidth: '1px'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: '1px'
                }
              }
            }}
            sx={{ 
              flexGrow: 1,
              minWidth: { xs: '100%', sm: '280px' },
              maxWidth: '400px'
            }}
          />

          {/* Botones de acción y vista */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            alignItems: 'center',
            ml: 'auto'
          }}>
            <Button
              startIcon={<FilterListIcon />}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              variant={mostrarFiltros ? "contained" : "outlined"}
              color="primary"
              size="small"
              sx={{ 
                height: '40px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                minWidth: '120px',
                backgroundColor: mostrarFiltros ? theme.palette.primary.main : 'transparent',
                borderColor: mostrarFiltros ? 'transparent' : alpha(theme.palette.divider, 0.3),
                boxShadow: mostrarFiltros ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                '&:hover': {
                  backgroundColor: mostrarFiltros ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.04),
                  borderColor: mostrarFiltros ? 'transparent' : theme.palette.primary.main,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}
            >
              {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>

            <Button
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              variant="outlined"
              color="primary"
              size="small"
              sx={{ 
                height: '40px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                minWidth: '120px',
                borderColor: alpha(theme.palette.divider, 0.3),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}
            >
              Nuevo Proyecto
            </Button>

            <DualView
              viewType={viewType}
              onViewChange={setViewType}
              storageKey="gestionProyectosViewType"
            />
          </Box>
        </Box>

        {/* Panel de Filtros */}
        <Collapse in={mostrarFiltros} timeout="auto">
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mr: 2,
                }}
              >
                <FilterListIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Filtros avanzados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Refina tu búsqueda usando los siguientes filtros
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtroEstado}
                    label="Estado"
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    sx={{
                      height: '40px',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      }
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="planificado">Planificado</MenuItem>
                    <MenuItem value="en_progreso">En Progreso</MenuItem>
                    <MenuItem value="completado">Completado</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="Fecha inicio desde"
                  value={filtroFechaInicio ? new Date(filtroFechaInicio) : null}
                  onChange={(date) => setFiltroFechaInicio(date ? date.toISOString() : '')}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          height: '40px',
                          borderRadius: '8px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.divider, 0.2),
                          }
                        }
                      }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="Fecha fin hasta"
                  value={filtroFechaFin ? new Date(filtroFechaFin) : null}
                  onChange={(date) => setFiltroFechaFin(date ? date.toISOString() : '')}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          height: '40px',
                          borderRadius: '8px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.divider, 0.2),
                          }
                        }
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* Lista de Proyectos */}
        <Grow in={true} style={{ transformOrigin: '0 0 0' }} timeout={800}>
          {loading ? (
            // Esqueletos de carga
            <Grid container spacing={2}>
              {Array.from(new Array(4)).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    sx={{ 
                      borderRadius: '16px',
                      height: '100%',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    }}
                  >
                    <CardContent>
                      <Skeleton variant="rectangular" width="40%" height={24} sx={{ mb: 2, borderRadius: '8px' }} />
                      <Skeleton variant="rectangular" width="100%" height={20} sx={{ mb: 1, borderRadius: '8px' }} />
                      <Skeleton variant="rectangular" width="80%" height={20} sx={{ mb: 2, borderRadius: '8px' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Skeleton variant="rectangular" width="30%" height={32} sx={{ borderRadius: '8px' }} />
                        <Skeleton variant="rectangular" width="40%" height={32} sx={{ borderRadius: '8px' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : proyectosFiltrados.length === 0 ? (
            // Mensaje cuando no hay proyectos
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  borderRadius: '16px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  textAlign: 'center',
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)',
                }}
              >
                <AssignmentIcon 
                  sx={{ 
                    fontSize: 64,
                    color: alpha(theme.palette.text.secondary, 0.2),
                    mb: 2
                  }} 
                />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No se encontraron proyectos
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  No hay proyectos que coincidan con los filtros seleccionados
                </Typography>
              </Paper>
            </Grid>
          ) : viewType === 'cards' ? (
            // Vista de tarjetas
            <Grid container spacing={2}>
              {proyectosFiltrados.map((proyecto) => (
                <Grid item xs={12} sm={6} md={4} key={proyecto.id}>
                  <Card 
                    component={motion.div}
                    whileHover={{ 
                      translateY: -5,
                      boxShadow: '0 8px 28px rgba(0,0,0,0.1)',
                    }}
                    sx={{ 
                      borderRadius: '16px', 
                      height: '100%',
                      position: 'relative',
                      overflow: 'visible',
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" fontWeight={600}>
                          {proyecto.nombre}
                        </Typography>
                        {renderEstadoChip(proyecto.estado)}
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          minHeight: '40px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {proyecto.descripcion || 'Sin descripción'}
                      </Typography>
                      
                      {(proyecto.fecha_inicio || proyecto.fecha_fin) && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {proyecto.fecha_inicio && (
                            <Chip
                              icon={<CalendarTodayIcon fontSize="small" />}
                              label={`Inicio: ${format(new Date(proyecto.fecha_inicio), 'dd/MM/yyyy', { locale: es })}`}
                              size="small"
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.text.primary,
                                '& .MuiChip-icon': { color: theme.palette.primary.main },
                                borderRadius: '8px',
                              }}
                            />
                          )}
                          
                          {proyecto.fecha_fin && (
                            <Chip
                              icon={<AccessTimeIcon fontSize="small" />}
                              label={`Fin: ${format(new Date(proyecto.fecha_fin), 'dd/MM/yyyy', { locale: es })}`}
                              size="small"
                              sx={{ 
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                color: theme.palette.text.primary,
                                '& .MuiChip-icon': { color: theme.palette.secondary.main },
                                borderRadius: '8px',
                              }}
                            />
                          )}
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <CalendarTodayIcon fontSize="inherit" />
                          {format(new Date(proyecto.fecha_creacion), 'dd/MM/yyyy', { locale: es })}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenEditDialog(proyecto)}
                              sx={{ 
                                color: theme.palette.primary.main,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                                  transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.2s ease-in-out',
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={proyecto.activo ? "Desactivar" : "Activar"}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleToggleActivoProyecto(proyecto)}
                              sx={{ 
                                color: proyecto.activo ? theme.palette.error.main : theme.palette.success.main,
                                bgcolor: alpha(proyecto.activo ? theme.palette.error.main : theme.palette.success.main, 0.1),
                                '&:hover': {
                                  bgcolor: alpha(proyecto.activo ? theme.palette.error.main : theme.palette.success.main, 0.2),
                                  transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.2s ease-in-out',
                              }}
                            >
                              {proyecto.activo ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            // Vista de tabla
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Fecha Inicio</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Fecha Fin</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Última Actualización</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proyectosFiltrados.map((proyecto) => (
                      <TableRow 
                        key={proyecto.id}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                mr: 2,
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                              }}
                            >
                              {proyecto.nombre.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {proyecto.nombre}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{renderEstadoChip(proyecto.estado)}</TableCell>
                        <TableCell>
                          {proyecto.fecha_inicio ? format(new Date(proyecto.fecha_inicio), 'dd/MM/yyyy', { locale: es }) : '-'}
                        </TableCell>
                        <TableCell>
                          {proyecto.fecha_fin ? format(new Date(proyecto.fecha_fin), 'dd/MM/yyyy', { locale: es }) : '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(proyecto.fecha_actualizacion), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleOpenEditDialog(proyecto)}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                  transform: 'translateY(-1px)',
                                  boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                                },
                                transition: 'all 0.2s ease-in-out',
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={proyecto.activo ? <CancelIcon /> : <CheckCircleIcon />}
                              onClick={() => handleToggleActivoProyecto(proyecto)}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                borderColor: alpha(proyecto.activo ? theme.palette.error.main : theme.palette.success.main, 0.3),
                                color: proyecto.activo ? theme.palette.error.main : theme.palette.success.main,
                                '&:hover': {
                                  borderColor: proyecto.activo ? theme.palette.error.main : theme.palette.success.main,
                                  backgroundColor: alpha(proyecto.activo ? theme.palette.error.main : theme.palette.success.main, 0.05),
                                  transform: 'translateY(-1px)',
                                  boxShadow: `0 4px 8px ${alpha(proyecto.activo ? theme.palette.error.main : theme.palette.success.main, 0.15)}`,
                                },
                                transition: 'all 0.2s ease-in-out',
                              }}
                            >
                              {proyecto.activo ? 'Desactivar' : 'Activar'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={proyectosFiltrados.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          )}
        </Grow>

        {/* Diálogo para crear/editar proyecto */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          TransitionComponent={Zoom}
          PaperProps={{
            sx: {
              borderRadius: '20px',
              padding: 0,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
              background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${theme.palette.background.paper})`,
              backdropFilter: 'blur(20px)',
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              p: 3,
              background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 48,
                  height: 48,
                }}
              >
                <AssignmentIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {formMode === 'crear' ? 'Crear Nuevo Proyecto' : 'Editar Proyecto'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formMode === 'crear' ? 'Ingresa los detalles del nuevo proyecto' : 'Modifica los detalles del proyecto'}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            <Box 
              sx={{ 
                mb: 3,
                p: 2.5,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <InfoIcon 
                sx={{ 
                  color: theme.palette.info.main,
                  p: 0.5,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                }} 
              />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Completa la información básica del proyecto. Los campos marcados con * son obligatorios.
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 1,
                    color: theme.palette.info.main,
                  }}
                >
                  <InfoIcon fontSize="inherit" />
                  Tip: El estado del proyecto puede ser modificado posteriormente según su avance
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="nombre"
                  label="Nombre del Proyecto *"
                  fullWidth
                  required
                  value={formData.nombre}
                  onChange={handleFormChange}
                  error={!!errors.nombre}
                  helperText={errors.nombre || `${formData.nombre?.length || 0}/250 caracteres`}
                  inputProps={{ 
                    maxLength: 250,
                    style: { 
                      WebkitTextFillColor: formData.nombre?.length >= 250 ? theme.palette.error.main : 'inherit' 
                    }
                  }}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Avatar sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: alpha(errors.nombre ? theme.palette.error.main : theme.palette.primary.main, 0.1),
                          color: errors.nombre ? theme.palette.error.main : theme.palette.primary.main 
                        }}>
                          <AssignmentIcon fontSize="small" />
                        </Avatar>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: alpha(theme.palette.background.paper, 0.5),
                      '& .MuiInputAdornment-root': {
                        marginRight: '12px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(errors.nombre ? theme.palette.error.main : theme.palette.divider, 0.2),
                      },
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(errors.nombre ? theme.palette.error.main : theme.palette.divider, 0.5),
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: errors.nombre ? theme.palette.error.main : alpha(theme.palette.divider, 0.5),
                          borderWidth: '1px',
                        },
                      },
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="descripcion"
                  label="Descripción del Proyecto"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.descripcion}
                  onChange={handleFormChange}
                  error={!!errors.descripcion}
                  helperText={errors.descripcion || `${formData.descripcion?.length || 0}/250 caracteres`}
                  inputProps={{ 
                    maxLength: 250,
                    style: { 
                      WebkitTextFillColor: (formData.descripcion?.length || 0) >= 250 ? theme.palette.error.main : 'inherit' 
                    }
                  }}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                        <Avatar sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: alpha(errors.descripcion ? theme.palette.error.main : theme.palette.primary.main, 0.1),
                          color: errors.descripcion ? theme.palette.error.main : theme.palette.primary.main 
                        }}>
                          <DescriptionIcon fontSize="small" />
                        </Avatar>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: alpha(theme.palette.background.paper, 0.5),
                      '& .MuiInputAdornment-root': {
                        marginRight: '12px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(errors.descripcion ? theme.palette.error.main : theme.palette.divider, 0.2),
                      },
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(errors.descripcion ? theme.palette.error.main : theme.palette.divider, 0.5),
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: errors.descripcion ? theme.palette.error.main : alpha(theme.palette.divider, 0.5),
                          borderWidth: '1px',
                        },
                      },
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="estado-label">Estado del Proyecto *</InputLabel>
                  <Select
                    labelId="estado-label"
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    label="Estado del Proyecto *"
                    onChange={handleSelectChange}
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <MenuItem value="planificado">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main,
                          }}
                        >
                          <CalendarTodayIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Planificado
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Proyecto en fase de planificación
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                    <MenuItem value="en_progreso">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.main,
                          }}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            En Progreso
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Proyecto en ejecución
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                    <MenuItem value="completado">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                          }}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Completado
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Proyecto finalizado exitosamente
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                    <MenuItem value="cancelado">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            color: theme.palette.error.main,
                          }}
                        >
                          <CancelIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Cancelado
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Proyecto cancelado o suspendido
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Fecha de Inicio"
                  value={formData.fecha_inicio}
                  onChange={(date) => handleDateChange('fecha_inicio', date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }
                    } 
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Fecha de Fin"
                  value={formData.fecha_fin}
                  onChange={(date) => handleDateChange('fecha_fin', date)}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }
                    } 
                  }}
                />
              </Grid>

              {errors.fechas && (
                <Grid item xs={12}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      borderRadius: '12px',
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      color: theme.palette.error.main,
                      border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                    }}
                  >
                    {errors.fechas}
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box
                  sx={{
                    '& .filepond--panel-root': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      borderRadius: '12px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    },
                    '& .filepond--drop-label': {
                      color: theme.palette.text.primary,
                      fontSize: '1rem',
                      fontFamily: theme.typography.fontFamily,
                    },
                    '& .filepond--label-action': {
                      textDecoration: 'none',
                      color: theme.palette.primary.main,
                    },
                    '& .filepond--item-panel': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                    '& .filepond-preview-wrapper': {
                      '& .filepond--item': {
                        borderRadius: '8px',
                        overflow: 'hidden',
                      },
                      '& .filepond--image-preview-wrapper': {
                        borderRadius: '8px',
                        overflow: 'hidden',
                      },
                      '& .filepond--image-preview': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        height: '170px !important',
                      }
                    }
                  }}
                >x
                  <FilePond
                    files={formData.recursos}
                    onupdatefiles={handleUpdateFiles}
                    allowMultiple={true}
                    maxFiles={5}
                    server={{
                      load: async (source, load, error) => {
                        try {
                          const { API_CONFIG } = await import('../config/api.config');
                          const response = await axios.get(
                            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECURSOS.URL_FIRMADA(source)}`,
                            {
                              headers: {
                                Authorization: `Bearer ${token}`
                              }
                            }
                          );
                          
                          if (response.data.signedUrl) {
                            const fileResponse = await fetch(response.data.signedUrl);
                            const blob = await fileResponse.blob();
                            load(blob);
                          }
                        } catch (err) {
                          error('Error al cargar el archivo');
                        }
                      }
                    }}
                    acceptedFileTypes={[
                      'application/pdf',
                      'image/*',
                      'image/webp',
                      'image/jpeg',
                      'image/png',
                      'image/gif',
                      'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    ]}
                    maxFileSize="10MB"
                    labelIdle='Arrastra y suelta archivos o <span class="filepond--label-action">Examinar</span>'
                    labelMaxFileSizeExceeded="El archivo es demasiado grande"
                    labelMaxFileSize="Tamaño máximo: 10MB"
                    labelFileTypeNotAllowed="Tipo de archivo no permitido"
                    fileValidateTypeLabelExpectedTypes="Archivos permitidos: PDF, imágenes, documentos Word"
                    labelFileProcessingComplete="Archivo listo"
                    labelFileProcessing="Subiendo"
                    labelFileProcessingError="Error al subir el archivo"
                    labelFileProcessingRevertError="Error al eliminar el archivo"
                    labelTapToCancel="clic para cancelar"
                    labelTapToRetry="clic para reintentar"
                    labelTapToUndo="clic para deshacer"
                    credits={false}
                    allowImagePreview={true}
                    allowImageExifOrientation={true}
                    imagePreviewMinHeight={170}
                    imagePreviewMaxHeight={256}
                    allowImageTransform={true}
                    imageTransformOutputQuality={80}
                    imagePreviewTransparencyIndicator="grid"
                    stylePanelAspectRatio="1:1"
                    imagePreviewHeight={170}
                    className="filepond-preview-wrapper"
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions 
            sx={{ 
              p: 2.5,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              size="large"
              sx={{ 
                borderRadius: '10px',
                px: 3,
                borderColor: alpha(theme.palette.divider, 0.2),
                color: theme.palette.text.primary,
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.divider, 0.05),
                },
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProyecto}
              variant="contained"
              size="large"
              disabled={
                // Verificar errores
                !!errors.nombre || 
                !!errors.descripcion || 
                !!errors.fechas || 
                // Verificar campos obligatorios
                !formData.nombre.trim() || 
                formData.nombre.trim().length < 3 ||
                !formData.descripcion?.trim() ||
                formData.descripcion.trim().length < 10 ||
                !formData.estado ||
                !formData.fecha_inicio ||
                !formData.fecha_fin
              }
              sx={{ 
                borderRadius: '10px',
                px: 3,
                py: 1.2,
                boxShadow: '0 4px 12px rgba(0, 171, 85, 0.24)',
                background: 'linear-gradient(135deg, #00AB55 0%, #07B963 100%)',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #07B963 0%, #00AB55 100%)',
                  boxShadow: '0 8px 16px rgba(0, 171, 85, 0.32)',
                  transform: 'translateY(-1px)',
                },
                '&.Mui-disabled': {
                  background: alpha(theme.palette.background.paper, 0.8),
                  color: alpha(theme.palette.text.primary, 0.4),
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  boxShadow: 'none',
                },
              }}
            >
              {formMode === 'crear' ? 'Crear Proyecto' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default GestionProyectos;
