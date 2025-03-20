import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Skeleton,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  Tab,
  Tabs,
  Avatar,
  AvatarGroup,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  Collapse,
  MenuItem,
  Menu,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  FolderSpecial as FolderSpecialIcon,
  ViewModule as ViewModuleIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarMonthIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  ArrowBack as ArrowBackIcon,
  Today as TodayIcon,
  ArrowForward as ArrowForwardIcon,
  Home as HomeIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  SortByAlpha as SortByAlphaIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ExpandMore as ExpandMoreIcon,
  ViewList as ViewListIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProyectosService, { Proyecto, ProyectoFiltros } from '../services/proyectos.service';
import ProyectoCard from '../components/proyectos/ProyectoCard';
import NoDataMessage from '../components/NoDataMessage';
import { format, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, startOfWeek, endOfWeek, addMonths, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

// Funciones auxiliares para estados
const getColorEstado = (estado: string) => {
  switch(estado) {
    case 'planificado':
      return '#1976d2'; // Azul
    case 'en_progreso':
      return '#2e7d32'; // Verde
    case 'completado':
      return '#1976d2'; // Azul
    case 'cancelado':
      return '#d32f2f'; // Rojo
    default:
      return '#757575'; // Gris
  }
};

const getEtiquetaEstado = (estado: string) => {
  switch(estado) {
    case 'planificado': return 'Planificado';
    case 'en_progreso': return 'En Progreso';
    case 'completado': return 'Completado';
    case 'cancelado': return 'Cancelado';
    default: return 'Desconocido';
  }
};

// Opciones de vista para los proyectos
const opcionesVista = [
  { value: 'tarjetas', label: 'Mis Proyectos', icon: <ViewModuleIcon /> },
  { value: 'calendario', label: 'Calendario', icon: <CalendarMonthIcon /> },
  { value: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> }
];

// Tipo para el modo de visualización
type ViewModeType = 'cards' | 'table';

const PortalProyectos: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  
  // Estados para los datos y la UI
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [vistaActual, setVistaActual] = useState<string>('tarjetas');
  // Estado para el modo de visualización (tarjetas/tabla)
  const [viewMode, setViewMode] = useState<ViewModeType>(() => {
    const savedViewMode = localStorage.getItem('proyectosViewMode');
    return (savedViewMode as ViewModeType) || 'cards';
  });
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtros, setFiltros] = useState<ProyectoFiltros>({
    estado: '',
    busqueda: '',
    fechaInicio: '',
    fechaFin: '',
    ordenarPor: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [ordenAnchorEl, setOrdenAnchorEl] = useState<null | HTMLElement>(null);
  const ordenMenuAbierto = Boolean(ordenAnchorEl);
  
  // Opciones para ordenamiento
  const opcionesOrdenamiento = [
    { value: 'nombre_asc', label: 'Nombre (A-Z)', icon: <SortByAlphaIcon fontSize="small" /> },
    { value: 'nombre_desc', label: 'Nombre (Z-A)', icon: <SortByAlphaIcon fontSize="small" sx={{ transform: 'scaleY(-1)' }} /> },
    { value: 'fecha_inicio_asc', label: 'Fecha inicio (antigua)', icon: <ArrowUpwardIcon fontSize="small" /> },
    { value: 'fecha_inicio_desc', label: 'Fecha inicio (reciente)', icon: <ArrowDownwardIcon fontSize="small" /> },
    { value: 'fecha_fin_asc', label: 'Fecha fin (próxima)', icon: <CalendarMonthIcon fontSize="small" /> },
    { value: 'progreso_asc', label: 'Progreso (menor primero)', icon: <ArrowUpwardIcon fontSize="small" /> },
    { value: 'progreso_desc', label: 'Progreso (mayor primero)', icon: <ArrowDownwardIcon fontSize="small" /> }
  ];
  
  // Cargar proyectos al montar el componente
  useEffect(() => {
    cargarProyectos();
  }, [usuario]);
  
  // Función para cargar los proyectos del usuario
  const cargarProyectos = async () => {
    if (!usuario) return;
    
    setCargando(true);
    try {
      const proyectosData = await ProyectosService.getProyectosPorUsuario(usuario.id);
      
      // Enriquecer los datos con información adicional (esto normalmente vendría de la API)
      const proyectosEnriquecidos = proyectosData.map(proyecto => ({
        ...proyecto,
        progreso: Math.floor(Math.random() * 100), // Simulado - normalmente vendría del backend
        total_actividades: Math.floor(Math.random() * 20) + 5, // Simulado
        actividades_completadas: Math.floor(Math.random() * 15), // Simulado
        usuarios_asignados: Array(Math.floor(Math.random() * 5) + 1).fill(null).map((_, i) => ({
          id: `user_${i}`,
          nombres: ['Ana', 'Juan', 'Pedro', 'María', 'Luis', 'Sofía'][Math.floor(Math.random() * 6)],
          appaterno: ['Gómez', 'López', 'Martínez', 'Pérez', 'García', 'Rodríguez'][Math.floor(Math.random() * 6)],
          rol: 'funcionario',
          rut: '12345678-9',
          email: 'usuario@example.com'
        }))
      }));
      
      setProyectos(proyectosEnriquecidos);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    } finally {
      setCargando(false);
    }
  };
  
  // Aplicar filtros a los proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter(proyecto => {
      // Filtrar por búsqueda en nombre o descripción
      if (filtros.busqueda && !proyecto.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) && 
          !(proyecto.descripcion && proyecto.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase()))) {
        return false;
      }
      
      // Filtrar por estado
      if (filtros.estado && proyecto.estado !== filtros.estado) {
        return false;
      }
      
      // Filtrar por fecha de inicio
      if (filtros.fechaInicio && proyecto.fecha_inicio && 
          new Date(proyecto.fecha_inicio) < new Date(filtros.fechaInicio)) {
        return false;
      }
      
      // Filtrar por fecha de fin
      if (filtros.fechaFin && proyecto.fecha_fin && 
          new Date(proyecto.fecha_fin) > new Date(filtros.fechaFin)) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Aplicar ordenamiento
      if (!filtros.ordenarPor) return 0;
      
      switch(filtros.ordenarPor) {
        case 'nombre_asc':
          return a.nombre.localeCompare(b.nombre);
        case 'nombre_desc':
          return b.nombre.localeCompare(a.nombre);
        case 'fecha_inicio_asc':
          return new Date(a.fecha_inicio || 0).getTime() - new Date(b.fecha_inicio || 0).getTime();
        case 'fecha_inicio_desc':
          return new Date(b.fecha_inicio || 0).getTime() - new Date(a.fecha_inicio || 0).getTime();
        case 'fecha_fin_asc':
          return new Date(a.fecha_fin || 0).getTime() - new Date(b.fecha_fin || 0).getTime();
        case 'progreso_asc':
          return (a.progreso || 0) - (b.progreso || 0);
        case 'progreso_desc':
          return (b.progreso || 0) - (a.progreso || 0);
        default:
          return 0;
      }
    });
  }, [proyectos, filtros]);
  
  // Función para manejar el cambio de vista
  const handleVistaChange = (_: React.SyntheticEvent, newValue: string) => {
    setVistaActual(newValue);
  };
  
  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltros({
      estado: '',
      busqueda: '',
      fechaInicio: '',
      fechaFin: '',
      ordenarPor: ''
    });
  };
  
  // Función para ir al detalle de un proyecto
  const verDetalleProyecto = (id: string) => {
    navigate(`/proyecto/${id}`);
  };
  
  // Handlers para ordenamiento
  const handleOpenOrdenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setOrdenAnchorEl(event.currentTarget);
  };
  
  const handleCloseOrdenMenu = () => {
    setOrdenAnchorEl(null);
  };
  
  const handleSelectOrden = (orden: string) => {
    setFiltros(prev => ({ ...prev, ordenarPor: orden }));
    handleCloseOrdenMenu();
  };
  
  // Encontrar la etiqueta actual de ordenamiento
  const ordenActualLabel = opcionesOrdenamiento.find(opt => opt.value === filtros.ordenarPor)?.label || 'Ordenar por';
  
  // Función para cambiar el modo de visualización
  const handleViewModeChange = (newViewMode: ViewModeType) => {
    setViewMode(newViewMode);
    localStorage.setItem('proyectosViewMode', newViewMode);
  };
  
  // Manejar cambio de página
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  return (
    <Box sx={{ flexGrow: 1, width: '100%', pb: 4 }}>
      {/* Encabezado con título y acciones */}
      <Box 
        sx={{ 
          position: 'relative',
          mb: 4
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}>
            {/* Título */}
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                color: theme.palette.text.primary,
                letterSpacing: '-0.5px'
              }}
            >
              Portal de Proyectos
            </Typography>

            {/* Breadcrumb y Botones */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 2
            }}>
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
                    <HomeIcon />
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
                    <FolderSpecialIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography
                    sx={{
                      ml: 1,
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    Proyectos
                  </Typography>
                </Box>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto' }} />

              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Controlador de cambio de vista (tabla/cards) */}
                <Tooltip title="Vista de tabla" arrow>
                  <IconButton 
                    onClick={() => handleViewModeChange('table')}
                    sx={{ 
                      borderRadius: '12px',
                      backgroundColor: viewMode === 'table' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      color: viewMode === 'table' ? theme.palette.primary.main : theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: viewMode === 'table' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Vista de tarjetas" arrow>
                  <IconButton 
                    onClick={() => handleViewModeChange('cards')}
                    sx={{ 
                      borderRadius: '12px',
                      backgroundColor: viewMode === 'cards' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      color: viewMode === 'cards' ? theme.palette.primary.main : theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: viewMode === 'cards' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <ViewModuleIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Refrescar proyectos">
                  <IconButton
                    onClick={cargarProyectos}
                    disabled={cargando}
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: 'transparent',
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    {cargando ? (
                      <CircularProgress size={24} color="primary" />
                    ) : (
                      <RefreshIcon />
                    )}
                  </IconButton>
                </Tooltip>
                
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  sx={{ 
                    borderRadius: '12px',
                    borderWidth: 1,
                    px: 2,
                    py: 1,
                    backgroundColor: mostrarFiltros ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    borderColor: mostrarFiltros ? theme.palette.primary.main : alpha(theme.palette.divider, 0.2),
                    color: mostrarFiltros ? theme.palette.primary.main : theme.palette.text.primary,
                    '&:hover': {
                      borderWidth: 1,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
                    }
                  }}
                >
                  Filtros
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Panel de filtros */}
      <Collapse in={mostrarFiltros}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3, 
            backgroundColor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.primary.main, 0.02)} 0%, 
                ${alpha(theme.palette.background.paper, 0)} 100%)`,
              pointerEvents: 'none'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0
              }}
            >
              Filtros de Búsqueda
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Mostrando {proyectosFiltrados.length} de {proyectos.length} proyectos
              </Typography>
              
              <Button
                variant="outlined"
                onClick={handleOpenOrdenMenu}
                size="small"
                startIcon={<SortByAlphaIcon />}
                endIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  px: 1.5,
                  borderColor: alpha(theme.palette.divider, 0.5),
                  color: filtros.ordenarPor ? theme.palette.primary.main : theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.04)
                  }
                }}
              >
                {ordenActualLabel}
              </Button>
              
              <Menu
                anchorEl={ordenAnchorEl}
                open={ordenMenuAbierto}
                onClose={handleCloseOrdenMenu}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: '12px',
                    boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
                    minWidth: '220px'
                  }
                }}
              >
                {opcionesOrdenamiento.map((opcion) => (
                  <MenuItem
                    key={opcion.value}
                    selected={filtros.ordenarPor === opcion.value}
                    onClick={() => handleSelectOrden(opcion.value)}
                    sx={{
                      py: 1,
                      px: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderRadius: '8px',
                      mx: 0.5,
                      my: 0.2,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08)
                      },
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.16)
                        }
                      }
                    }}
                  >
                    <Box sx={{ 
                      color: filtros.ordenarPor === opcion.value ? theme.palette.primary.main : theme.palette.text.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24
                    }}>
                      {opcion.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: filtros.ordenarPor === opcion.value ? 600 : 400
                      }}
                    >
                      {opcion.label}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Fecha Inicio"
                type="date"
                name="fechaInicio"
                value={filtros.fechaInicio || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                    '&.Mui-focused': {
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.primary.main}`,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Fecha Fin"
                type="date"
                name="fechaFin"
                value={filtros.fechaFin || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                    '&.Mui-focused': {
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.primary.main}`,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Estado"
                name="estado"
                value={filtros.estado || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                    '&.Mui-focused': {
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.primary.main}`,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    }
                  }
                }}
              >
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value="planificado">Planificado</MenuItem>
                <MenuItem value="en_progreso">En Progreso</MenuItem>
                <MenuItem value="completado">Completado</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={limpiarFiltros}
                startIcon={<ClearIcon />}
                fullWidth
                sx={{ 
                  borderRadius: 2,
                  height: '56px',
                  borderWidth: 1,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    borderWidth: 1,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
                  }
                }}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
        
      {/* Barra de búsqueda */}
      <TextField
        fullWidth
        placeholder="Buscar por nombre de proyecto o descripción..."
        variant="outlined"
        name="busqueda"
        value={filtros.busqueda}
        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
        sx={{ 
          mb: 4,
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.2s ease',
            padding: '4px 8px',
            '&:hover': {
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            },
            '&.Mui-focused': {
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              border: `1px solid ${theme.palette.primary.main}`,
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
            }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: theme.palette.text.secondary, ml: 1 }} />
            </InputAdornment>
          ),
          endAdornment: filtros.busqueda ? (
            <InputAdornment position="end">
              <IconButton 
                onClick={() => setFiltros(prev => ({ ...prev, busqueda: '' }))}
                edge="end"
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  }
                }}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null
        }}
      />

      {/* Selector de vistas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={vistaActual}
          onChange={handleVistaChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            style: {
              backgroundColor: theme.palette.primary.main,
              height: 3,
              borderRadius: '3px'
            }
          }}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
              minHeight: 48,
              borderRadius: '8px 8px 0 0'
            }
          }}
        >
          {opcionesVista.map((opcion) => (
            <Tab
              key={opcion.value}
              value={opcion.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {opcion.icon}
                  <span>{opcion.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Contenido principal según la vista seleccionada */}
      {cargando ? (
        // Esqueletos para proyectos en carga
        <Grid container spacing={3}>
          {Array.from(new Array(8)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton
                variant="rectangular"
                height={280}
                sx={{ borderRadius: '16px' }}
              />
            </Grid>
          ))}
        </Grid>
      ) : proyectosFiltrados.length === 0 ? (
        // Mensaje cuando no hay proyectos
        <Box sx={{ py: 5 }}>
          <NoDataMessage
            message="No se encontraron proyectos"
            subMessage={
              filtros.busqueda || filtros.estado || filtros.fechaInicio || filtros.fechaFin
                ? "Prueba a modificar los filtros de búsqueda"
                : "Aún no tienes proyectos asignados"
            }
            withAnimation={true}
          />
        </Box>
      ) : (
        // Renderizar la vista seleccionada
        <>
          {vistaActual === 'tarjetas' && (
            viewMode === 'cards' ? (
              <Grid container spacing={3}>
                {proyectosFiltrados.map((proyecto) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={proyecto.id}>
                    <ProyectoCard
                      proyecto={proyecto}
                      onClick={verDetalleProyecto}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              // Vista de tabla para proyectos
              <Box>
                <TableContainer 
                  component={Paper}
                  sx={{ 
                    borderRadius: 3,
                    overflow: 'hidden',
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.08)}`,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '100%',
                      background: `linear-gradient(180deg, 
                        ${alpha(theme.palette.primary.main, 0.03)} 0%, 
                        ${alpha(theme.palette.background.paper, 0)} 100%)`,
                      pointerEvents: 'none'
                    },
                    '& .MuiTableCell-root': {
                      borderColor: alpha(theme.palette.divider, 0.08),
                      padding: '16px',
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          background: `linear-gradient(90deg, 
                            ${alpha(theme.palette.primary.main, 0.08)} 0%, 
                            ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                          '& th': {
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                            py: 2,
                          },
                        }}
                      >
                        <TableCell>Nombre</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Fechas</TableCell>
                        <TableCell>Progreso</TableCell>
                        <TableCell>Equipo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proyectosFiltrados
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((proyecto) => (
                        <TableRow
                          key={proyecto.id}
                          sx={{
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.03),
                              transform: 'scale(1.002)',
                              boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.04)}`,
                            },
                            '&:not(:last-child)': {
                              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                            },
                            cursor: 'pointer',
                          }}
                          onClick={() => verDetalleProyecto(proyecto.id)}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: theme.palette.text.primary,
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '1rem',
                                }}
                              >
                                {proyecto.nombre}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{
                                  color: alpha(theme.palette.text.secondary, 0.8),
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.4,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {proyecto.descripcion}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getEtiquetaEstado(proyecto.estado)}
                              size="small"
                              sx={{ 
                                background: alpha(getColorEstado(proyecto.estado), 0.1),
                                color: getColorEstado(proyecto.estado),
                                fontWeight: 600,
                                borderRadius: '12px',
                                minWidth: '100px',
                                height: '32px',
                                fontSize: '0.85rem',
                                border: `1px solid ${alpha(getColorEstado(proyecto.estado), 0.3)}`,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  Inicio: {proyecto.fecha_inicio ? format(new Date(proyecto.fecha_inicio), 'dd/MM/yyyy', { locale: es }) : '-'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  Fin: {proyecto.fecha_fin ? format(new Date(proyecto.fecha_fin), 'dd/MM/yyyy', { locale: es }) : '-'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ width: '100%', maxWidth: 200 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {proyecto.progreso || 0}%
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={proyecto.progreso || 0} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  bgcolor: alpha(getColorEstado(proyecto.estado), 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: getColorEstado(proyecto.estado),
                                  }
                                }} 
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {proyecto.usuarios_asignados && proyecto.usuarios_asignados.length > 0 ? (
                              <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.8rem' } }}>
                                {proyecto.usuarios_asignados.map((usuario, i) => (
                                  <Tooltip key={i} title={`${usuario.nombres} ${usuario.appaterno}`}>
                                    <Avatar>{usuario.nombres[0]}</Avatar>
                                  </Tooltip>
                                ))}
                              </AvatarGroup>
                            ) : (
                              <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.6), fontStyle: 'italic' }}>
                                Sin asignaciones
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Paginación para la tabla */}
                <TablePagination
                  component="div"
                  count={proyectosFiltrados.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Filas por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                  sx={{
                    mt: 2,
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                />
              </Box>
            )
          )}
          
          {vistaActual === 'calendario' && (
            <VistaCalendario proyectos={proyectosFiltrados} />
          )}
          
          {vistaActual === 'dashboard' && (
            <Box
              sx={{
                p: 5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: '50%',
                  mb: 3
                }}
              >
                <DashboardIcon />
              </Box>
              <Typography variant="h6" gutterBottom>
                Vista de Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
                Esta visualización está en desarrollo. Pronto podrás disfrutar de un dashboard completo con métricas y gráficos.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setVistaActual('tarjetas')}
                startIcon={<ViewModuleIcon />}
              >
                Volver a vista de tarjetas
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// Componente para la vista de calendario profesional
const VistaCalendario: React.FC<{ proyectos: Proyecto[] }> = ({ proyectos }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [mesActual, setMesActual] = useState(new Date());
  const [modoVista, setModoVista] = useState<'mes' | 'agenda'>('mes');
  
  // Obtener todos los días que se muestran en la vista del calendario (incluye días de meses anteriores/siguientes)
  const diasCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    const inicioPrimerSemana = startOfWeek(inicioMes, { weekStartsOn: 1 }); // Lunes como inicio de semana
    const finUltimaSemana = endOfWeek(finMes, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: inicioPrimerSemana, end: finUltimaSemana });
  }, [mesActual]);
  
  // Agrupar días por semanas para el grid
  const semanas = useMemo(() => {
    const result: Date[][] = [];
    let semanaActual: Date[] = [];
    
    diasCalendario.forEach((dia, index) => {
      semanaActual.push(dia);
      
      if (index % 7 === 6) {
        result.push(semanaActual);
        semanaActual = [];
      }
    });
    
    return result;
  }, [diasCalendario]);
  
  // Proyectos por día
  const proyectosPorDia = useMemo(() => {
    const lookup: Record<string, Proyecto[]> = {};
    
    diasCalendario.forEach(dia => {
      const fechaKey = format(dia, 'yyyy-MM-dd');
      lookup[fechaKey] = [];
    });
    
    proyectos.forEach(proyecto => {
      if (!proyecto.fecha_inicio || !proyecto.fecha_fin) return;
      
      const fechaInicio = new Date(proyecto.fecha_inicio);
      const fechaFin = new Date(proyecto.fecha_fin);
      
      // Para cada día en el rango del proyecto
      eachDayOfInterval({ start: fechaInicio, end: fechaFin }).forEach(dia => {
        const fechaKey = format(dia, 'yyyy-MM-dd');
        if (lookup[fechaKey]) {
          lookup[fechaKey].push(proyecto);
        }
      });
    });
    
    return lookup;
  }, [diasCalendario, proyectos]);
  
  // Proyectos agrupados por día para Vista Agenda
  const proyectosAgrupados = useMemo(() => {
    // Obtener el rango de días para la vista agenda (1 mes antes y 2 meses después del mes actual)
    const inicioRango = addMonths(startOfMonth(mesActual), -1);
    const finRango = addMonths(endOfMonth(mesActual), 2);
    
    // Crear un objeto para almacenar proyectos por fecha
    const grupos: {[key: string]: Proyecto[]} = {};
    
    proyectos.forEach(proyecto => {
      if (!proyecto.fecha_inicio) return;
      
      const fechaInicio = new Date(proyecto.fecha_inicio);
      const fechaFin = proyecto.fecha_fin ? new Date(proyecto.fecha_fin) : fechaInicio;
      
      // Para cada día en el rango del proyecto
      eachDayOfInterval({ 
        start: isAfter(fechaInicio, inicioRango) ? fechaInicio : inicioRango,
        end: isBefore(fechaFin, finRango) ? fechaFin : finRango
      }).forEach(dia => {
        const fechaKey = format(dia, 'yyyy-MM-dd');
        if (!grupos[fechaKey]) {
          grupos[fechaKey] = [];
        }
        
        // Solo agregar si no existe ya (evitar duplicados)
        if (!grupos[fechaKey].some(p => p.id === proyecto.id)) {
          grupos[fechaKey].push(proyecto);
        }
      });
    });
    
    // Convertir a array ordenado
    return Object.entries(grupos)
      .map(([fechaKey, proyectos]) => ({
        fecha: new Date(fechaKey),
        proyectos: proyectos.sort((a, b) => {
          // Ordenar por estado (en progreso primero) y luego por progreso descendente
          if (a.estado === 'en_progreso' && b.estado !== 'en_progreso') return -1;
          if (a.estado !== 'en_progreso' && b.estado === 'en_progreso') return 1;
          return (b.progreso || 0) - (a.progreso || 0);
        })
      }))
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .filter(grupo => {
        // Mostrar solo grupos para fechas relevantes
        return isWithinInterval(grupo.fecha, { start: inicioRango, end: finRango });
      });
  }, [proyectos, mesActual]);
  
  const cambiarMes = (incremento: number) => {
    setMesActual(addMonths(mesActual, incremento));
  };
  
  return (
    <Box>
      {/* Encabezado del calendario */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '12px',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.05)}`
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {format(mesActual, 'MMMM yyyy', { locale: es })}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => cambiarMes(-1)}
              variant="outlined"
              size="small"
            >
              Anterior
            </Button>
            <Button 
              startIcon={<TodayIcon />} 
              onClick={() => setMesActual(new Date())}
              variant="contained"
              size="small"
            >
              Hoy
            </Button>
            <Button 
              endIcon={<ArrowForwardIcon />} 
              onClick={() => cambiarMes(1)}
              variant="outlined"
              size="small"
            >
              Siguiente
            </Button>
          </Box>
          
          <Box>
            <Tabs 
              value={modoVista} 
              onChange={(_, newValue) => setModoVista(newValue)}
              sx={{ minHeight: '42px' }}
            >
              <Tab 
                label="Vista Mes" 
                value="mes" 
                sx={{ minHeight: '42px', textTransform: 'none' }} 
              />
              <Tab 
                label="Vista Agenda" 
                value="agenda" 
                sx={{ minHeight: '42px', textTransform: 'none' }} 
              />
            </Tabs>
          </Box>
        </Box>
      </Paper>
      
      {modoVista === 'mes' ? (
        /* Vista Mes - Calendario date-fns profesional */
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: '12px',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.05)}`,
            overflow: 'hidden'
          }}
        >
          {/* Cabecera de días */}
          <Box 
            sx={{ 
              display: 'flex', 
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
              <Box 
                key={dia} 
                sx={{ 
                  flex: '1 0 14.28%', 
                  py: 1.5,
                  textAlign: 'center',
                  borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  '&:last-child': {
                    borderRight: 'none'
                  }
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                  }}
                >
                  {dia}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Grid del calendario */}
          <Box>
            {semanas.map((semana, indexSemana) => (
              <Box 
                key={`semana-${indexSemana}`} 
                sx={{ 
                  display: 'flex',
                  borderBottom: indexSemana < semanas.length - 1 ? 
                    `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                }}
              >
                {semana.map(dia => {
                  const esMismoMes = isSameMonth(dia, mesActual);
                  const esHoy = isToday(dia);
                  const fechaKey = format(dia, 'yyyy-MM-dd');
                  const proyectosDia = proyectosPorDia[fechaKey] || [];
                  
                  return (
                    <Box 
                      key={fechaKey}
                      sx={{ 
                        flex: '1 0 14.28%',
                        height: 130,
                        p: 1,
                        position: 'relative',
                        bgcolor: !esMismoMes 
                          ? alpha(theme.palette.background.default, 0.5)
                          : esHoy
                            ? alpha(theme.palette.primary.main, 0.05)
                            : 'transparent',
                        borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:last-child': {
                          borderRight: 'none'
                        },
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.03)
                        }
                      }}
                    >
                      {/* Número del día */}
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 6,
                          right: 8,
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          bgcolor: esHoy ? theme.palette.primary.main : 'transparent',
                          color: esHoy ? theme.palette.primary.contrastText : 
                                 esMismoMes ? theme.palette.text.primary : theme.palette.text.disabled,
                          fontWeight: esHoy ? 600 : 400,
                          fontSize: '0.8125rem'
                        }}
                      >
                        {format(dia, 'd')}
                      </Box>
                      
                      {/* Proyectos del día */}
                      <Box 
                        sx={{ 
                          mt: 4,
                          maxHeight: 90,
                          overflowY: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '4px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: alpha(theme.palette.primary.main, 0.2),
                            borderRadius: '4px',
                          },
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.75
                        }}
                      >
                        {proyectosDia.slice(0, 3).map(proyecto => (
                          <Tooltip
                            key={proyecto.id}
                            title={
                              <Box sx={{ p: 0.5 }}>
                                <Typography variant="subtitle2">{proyecto.nombre}</Typography>
                                <Typography variant="caption" display="block">
                                  {format(new Date(proyecto.fecha_inicio!), 'd MMM yyyy', { locale: es })} - 
                                  {format(new Date(proyecto.fecha_fin!), 'd MMM yyyy', { locale: es })}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={proyecto.progreso || 0} 
                                    sx={{ 
                                      width: 60, 
                                      height: 4, 
                                      borderRadius: 2,
                                      bgcolor: alpha(getColorEstado(proyecto.estado), 0.2),
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: getColorEstado(proyecto.estado),
                                      }
                                    }} 
                                  />
                                  <Typography variant="caption">
                                    {proyecto.progreso || 0}%
                                  </Typography>
                                </Box>
                                <Chip
                                  label={getEtiquetaEstado(proyecto.estado)}
                                  size="small"
                                  sx={{
                                    mt: 0.5,
                                    height: 20,
                                    fontSize: '0.7rem',
                                    bgcolor: alpha(getColorEstado(proyecto.estado), 0.1),
                                    color: getColorEstado(proyecto.estado),
                                    '& .MuiChip-label': { px: 1 }
                                  }}
                                />
                              </Box>
                            }
                            arrow
                            placement="top"
                          >
                            <Box
                              onClick={() => navigate(`/proyecto/${proyecto.id}`)}
                              sx={{
                                p: '4px 8px',
                                borderRadius: '4px',
                                borderLeft: `3px solid ${getColorEstado(proyecto.estado)}`,
                                bgcolor: alpha(getColorEstado(proyecto.estado), 0.08),
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minWidth: 0,
                                width: '100%',
                                '&:hover': {
                                  bgcolor: alpha(getColorEstado(proyecto.estado), 0.15),
                                  transform: 'translateX(2px)'
                                }
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                  lineHeight: 1.2,
                                  maxHeight: '2.4rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}
                              >
                                {proyecto.nombre}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ))}
                        
                        {proyectosDia.length > 3 && (
                          <Box
                            sx={{ 
                              textAlign: 'center',
                              mt: 0.5
                            }}
                            onClick={() => navigate('/proyectos', { 
                              state: { 
                                fecha: format(dia, 'yyyy-MM-dd'),
                                filtrarPorFecha: true 
                              } 
                            })}
                          >
                            <Chip 
                              label={`+${proyectosDia.length - 3} más`} 
                              size="small"
                              sx={{ 
                                fontSize: '0.625rem', 
                                height: 20,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                }
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Navegación rápida por meses */}
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', overflowX: 'auto' }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const mesNav = addMonths(new Date(), i - 2);
              const esActual = isSameMonth(mesNav, mesActual);
              
              return (
                <Button
                  key={i}
                  variant={esActual ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setMesActual(mesNav)}
                  sx={{ mx: 0.5, minWidth: 120 }}
                >
                  {format(mesNav, 'MMMM yyyy', { locale: es })}
                </Button>
              );
            })}
          </Paper>
          
          {/* Proyectos agrupados por fecha */}
          {proyectosAgrupados.length > 0 ? (
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              {proyectosAgrupados.map(({ fecha, proyectos }) => (
                <Paper
                  key={fecha.toISOString()}
                  elevation={0}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: isToday(fecha) 
                      ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                      : `0 4px 6px ${alpha(theme.palette.divider, 0.2)}`,
                  }}
                >
                  {/* Cabecera del día */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: isToday(fecha) 
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.04),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 45,
                          height: 45,
                          borderRadius: '50%',
                          bgcolor: isToday(fecha) 
                            ? theme.palette.primary.main 
                            : alpha(theme.palette.text.secondary, 0.1),
                          color: isToday(fecha) 
                            ? theme.palette.primary.contrastText 
                            : theme.palette.text.primary,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <Typography variant="caption" sx={{ lineHeight: 1 }}>
                          {format(fecha, 'EEE', { locale: es })}
                        </Typography>
                        <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 600 }}>
                          {format(fecha, 'd')}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      >
                        {format(fecha, 'EEEE', { locale: es })}
                        <Typography 
                          component="span" 
                          variant="subtitle1" 
                          sx={{ ml: 1, color: 'text.secondary' }}
                        >
                          {format(fecha, 'd MMMM yyyy', { locale: es })}
                        </Typography>
                      </Typography>
                    </Box>
                    
                    {isToday(fecha) && (
                      <Chip 
                        label="Hoy" 
                        color="primary" 
                        size="small" 
                        sx={{ fontWeight: 600 }} 
                      />
                    )}
                  </Box>
                  
                  {/* Lista de proyectos del día */}
                  <Box sx={{ p: 2 }}>
                    {proyectos.map((proyecto, idx) => (
                      <React.Fragment key={proyecto.id}>
                        <Box
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            position: 'relative',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              transform: 'translateY(-2px)'
                            }
                          }}
                          onClick={() => navigate(`/proyecto/${proyecto.id}`)}
                        >
                          {/* Decorador lateral según estado */}
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: 12,
                              bottom: 12,
                              width: 4,
                              borderRadius: '0 4px 4px 0',
                              bgcolor: getColorEstado(proyecto.estado)
                            }}
                          />
                          
                          <Box sx={{ display: 'flex' }}>
                            {/* Icono de estado */}
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                bgcolor: alpha(getColorEstado(proyecto.estado), 0.1)
                              }}
                            >
                              {proyecto.estado === 'en_progreso' && <PlayArrowIcon sx={{ color: getColorEstado(proyecto.estado) }} />}
                              {proyecto.estado === 'completado' && <CheckCircleIcon sx={{ color: getColorEstado(proyecto.estado) }} />}
                              {proyecto.estado === 'planificado' && <RadioButtonUncheckedIcon sx={{ color: getColorEstado(proyecto.estado) }} />}
                              {proyecto.estado === 'cancelado' && <CancelIcon sx={{ color: getColorEstado(proyecto.estado) }} />}
                            </Box>
                            
                            {/* Información del proyecto */}
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                                <Box>
                                  <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                      fontWeight: 600,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {proyecto.nombre}
                                  </Typography>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Chip
                                      label={getEtiquetaEstado(proyecto.estado)}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.75rem',
                                        bgcolor: alpha(getColorEstado(proyecto.estado), 0.1),
                                        color: getColorEstado(proyecto.estado)
                                      }}
                                    />
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      {proyecto.fecha_inicio && format(new Date(proyecto.fecha_inicio), 'd MMM', { locale: es })}
                                      {proyecto.fecha_fin && ` - ${format(new Date(proyecto.fecha_fin), 'd MMM', { locale: es })}`}
                                    </Typography>
                                  </Box>
                                </Box>
                                
                                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.8rem' } }}>
                                  {proyecto.usuarios_asignados?.map((usuario, i) => (
                                    <Tooltip key={i} title={`${usuario.nombres} ${usuario.appaterno}`}>
                                      <Avatar>{usuario.nombres[0]}</Avatar>
                                    </Tooltip>
                                  ))}
                                </AvatarGroup>
                              </Box>
                              
                              <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">Progreso</Typography>
                                  <Typography variant="caption" color="text.secondary">{proyecto.progreso || 0}%</Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={proyecto.progreso || 0}
                                  sx={{
                                    height: 5,
                                    borderRadius: 5,
                                    bgcolor: alpha(getColorEstado(proyecto.estado), 0.1),
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: getColorEstado(proyecto.estado)
                                    }
                                  }}
                                />
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                        {idx < proyectos.length - 1 && <Divider sx={{ my: 1, opacity: 0.6 }} />}
                      </React.Fragment>
                    ))}
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <NoDataMessage 
              message="No hay proyectos en este período" 
              subMessage="Intenta cambiar de mes o agregar nuevos proyectos" 
              withAnimation={true}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default PortalProyectos; 