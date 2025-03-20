import { useState, useEffect, useMemo, ReactElement } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  IconButton, 
  Button,
  TextField,
  useTheme,
  alpha,
  TablePagination,
  Collapse,
  MenuItem,
  InputAdornment,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Zoom,
  Avatar,
  Grow,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

// Importar el componente de modal de detalle
import ActividadDetalleModal from '../components/ActividadDetalleModal';
import { 
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Home as HomeIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  PlayCircle as PlayCircleIcon,
  Pending as PendingIcon,
  Send as SendIcon,
  Note as NoteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ActividadesService from '../services/actividades.service';

// Importamos la interfaz Actividad del servicio
import { Actividad } from '../services/actividades.service';

interface FiltroActividades {
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  busqueda?: string;
}

// Tipo de vista
type ViewType = 'cards' | 'table';

const MisActividades = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  
  // Estados
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const [verDetalleDialogo, setVerDetalleDialogo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [actividadAEliminar, setActividadAEliminar] = useState<Actividad | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [notificacion, setNotificacion] = useState<{
    abierta: boolean;
    mensaje: string;
    tipo: 'success' | 'error' | 'info' | 'warning';
  }>({
    abierta: false,
    mensaje: '',
    tipo: 'info'
  });
  
  // Estado para el tipo de vista (cards/tabla)
  const [viewType, setViewType] = useState<ViewType>(() => {
    const savedView = localStorage.getItem('actividadesViewType');
    return (savedView as ViewType) || 'cards';
  });
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [filtros, setFiltros] = useState<FiltroActividades>({
    fechaInicio: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    fechaFin: format(new Date(), 'yyyy-MM-dd'),
    busqueda: '',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Filtrar actividades en tiempo real según la búsqueda
  const actividadesFiltradas = useMemo(() => {
    if (!filtros.busqueda) return actividades;
    
    const busquedaLower = filtros.busqueda.toLowerCase();
    return actividades.filter(actividad => {
      const nombreProyecto = actividad.proyecto_nombre ? actividad.proyecto_nombre.toLowerCase() : '';
      const descripcion = actividad.descripcion ? actividad.descripcion.toLowerCase() : '';
      const nombre = actividad.nombre ? actividad.nombre.toLowerCase() : '';
      
      return nombreProyecto.includes(busquedaLower) || 
             descripcion.includes(busquedaLower) ||
             nombre.includes(busquedaLower) ||
             actividad.fecha.includes(busquedaLower);
    });
  }, [actividades, filtros.busqueda]);

  // Cargar actividades
  const cargarActividades = async () => {
    try {
      setCargando(true);
      console.log('Iniciando carga de mis actividades...');
      
      // Usar el servicio de actividades para obtener las actividades del usuario
      const misActividades = await ActividadesService.getActividadesUsuario();
      
      console.log('Actividades recibidas:', misActividades?.length || 0);
      
      // Filtrar por estado si es necesario
      if (filtros.estado) {
        const actividadesFiltradas = misActividades?.filter(act => 
          act.estado?.toLowerCase() === filtros.estado?.toLowerCase()
        ) || [];
        setActividades(actividadesFiltradas);
      } else {
        setActividades(misActividades);
      }
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setActividades([]); // Establecer array vacío en caso de error
    } finally {
      setCargando(false);
    }
  };

  // Cargar actividades al montar el componente o cambiar filtros
  useEffect(() => {
    if (usuario) {
      cargarActividades();
    }
  }, [usuario, filtros.estado]);

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), 'dd MMM yyyy', { locale: es });
  };

  // Formatear hora sin segundos
  const formatearHora = (hora: string) => {
    if (!hora) return '';
    
    // Si la hora viene en formato HH:MM:SS, extraemos solo HH:MM
    const partes = hora.split(':');
    if (partes.length >= 2) {
      return `${partes[0]}:${partes[1]}`;
    }
    
    return hora;
  };

  // Obtener color según estado
  const obtenerColorEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completada':
        return '#2e7d32'; // Verde más vibrante
      case 'en_progreso':
      case 'en progreso':
        return '#1976d2'; // Azul más vibrante
      case 'pendiente':
        return '#ed6c02'; // Naranja más vibrante
      case 'enviado':
        return '#00c853'; // Verde brillante
      case 'borrador':
        return '#9e9e9e'; // Gris más suave
      default:
        return '#757575';
    }
  };

  // Obtener color de fondo según estado
  const obtenerColorFondoEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completada':
        return `linear-gradient(135deg, ${alpha('#2e7d32', 0.15)}, ${alpha('#2e7d32', 0.05)})`;
      case 'en_progreso':
      case 'en progreso':
        return `linear-gradient(135deg, ${alpha('#1976d2', 0.15)}, ${alpha('#1976d2', 0.05)})`;
      case 'pendiente':
        return `linear-gradient(135deg, ${alpha('#ed6c02', 0.15)}, ${alpha('#ed6c02', 0.05)})`;
      case 'enviado':
        return `linear-gradient(135deg, ${alpha('#00c853', 0.15)}, ${alpha('#00c853', 0.05)})`;
      case 'borrador':
        return `linear-gradient(135deg, ${alpha('#9e9e9e', 0.15)}, ${alpha('#9e9e9e', 0.05)})`;
      default:
        return `linear-gradient(135deg, ${alpha('#757575', 0.15)}, ${alpha('#757575', 0.05)})`;
    }
  };

  // Obtener etiqueta legible del estado
  const obtenerEtiquetaEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completada':
        return 'Completada';
      case 'en_progreso':
      case 'en progreso':
        return 'En Progreso';
      case 'pendiente':
        return 'Pendiente';
      case 'enviado':
        return 'Enviado';
      case 'borrador':
        return 'Borrador';
      default:
        return estado;
    }
  };

  // Obtener ícono según estado
  const obtenerIconoEstado = (estado: string): ReactElement => {
    switch (estado.toLowerCase()) {
      case 'completada':
        return <CheckCircleIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
      case 'en_progreso':
      case 'en progreso':
        return <PlayCircleIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
      case 'pendiente':
        return <PendingIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
      case 'enviado':
        return <SendIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
      case 'borrador':
        return <NoteIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
      default:
        return <NoteIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
    }
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

  // Manejar clic en actividad para ver detalles
  const handleVerDetalle = (actividad: Actividad) => {
    setActividadSeleccionada(actividad);
    setVerDetalleDialogo(true);
  };

  // Manejar cierre del diálogo de detalle
  const handleCerrarDetalle = () => {
    setVerDetalleDialogo(false);
  };

  // Manejar editar actividad
  const handleEditarActividad = (actividad: Actividad) => {
    setActividadSeleccionada(actividad);
    setVerDetalleDialogo(true);
  };

  // Manejar eliminar actividad
  const handleEliminarActividad = (actividad: Actividad) => {
    if (!actividad) {
      setNotificacion({
        abierta: true,
        mensaje: 'No se puede eliminar una actividad inválida',
        tipo: 'error'
      });
      return;
    }
    setActividadAEliminar(actividad);
    setMostrarConfirmacion(true);
  };

  // Confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!actividadAEliminar) return;

    try {
      setEliminando(true);
      const eliminado = await ActividadesService.eliminarActividad(actividadAEliminar.id);
      
      if (eliminado) {
        setActividades(prevActividades => 
          prevActividades.filter(actividad => actividad.id !== actividadAEliminar.id)
        );
        setNotificacion({
          abierta: true,
          mensaje: 'Actividad eliminada con éxito',
          tipo: 'success'
        });
      } else {
        setNotificacion({
          abierta: true,
          mensaje: 'No se pudo eliminar la actividad',
          tipo: 'error'
        });
      }
    } catch (error) {
      console.error('Error al eliminar actividad:', error);
      setNotificacion({
        abierta: true,
        mensaje: 'Ocurrió un error al eliminar la actividad',
        tipo: 'error'
      });
    } finally {
      setEliminando(false);
      setMostrarConfirmacion(false);
      setActividadAEliminar(null);
    }
  };

  // Cerrar notificación
  const handleCerrarNotificacion = () => {
    setNotificacion(prev => ({ ...prev, abierta: false }));
  };

  // Manejar cambio en filtros
  const handleChangeFiltro = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
    
    // Resetear página al cambiar filtros
    setPage(0);
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      fechaInicio: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
      fechaFin: format(new Date(), 'yyyy-MM-dd'),
      busqueda: '',
    });
    setPage(0);
  };

  // Cambiar tipo de vista y guardar en localStorage
  const handleViewChange = (newView: ViewType) => {
    setViewType(newView);
    localStorage.setItem('actividadesViewType', newView);
  };

  // Renderizar vista de tabla
  const renderTableView = () => (
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
            <TableCell>Fecha</TableCell>
            <TableCell>Horario</TableCell>
            <TableCell>Proyecto</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {actividadesFiltradas
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((actividad) => (
              <TableRow
                key={actividad.id}
                sx={{
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                    transform: 'scale(1.002)',
                    boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.04)}`,
                    '& .actions-container': {
                      opacity: 1,
                      transform: 'translateX(0)',
                    }
                  },
                  '&:not(:last-child)': {
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                  },
                  cursor: 'pointer',
                }}
              >
                <TableCell 
                  onClick={() => handleVerDetalle(actividad)}
                  sx={{ 
                    maxWidth: '300px',
                  }}
                >
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
                    {actividad.nombre}
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
                    {actividad.descripcion}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    icon={obtenerIconoEstado(actividad.estado)}
                    label={obtenerEtiquetaEstado(actividad.estado)}
                    size="small"
                    sx={{ 
                      background: obtenerColorFondoEstado(actividad.estado),
                      color: obtenerColorEstado(actividad.estado),
                      fontWeight: 600,
                      borderRadius: '12px',
                      minWidth: '130px',
                      height: '36px',
                      fontSize: '0.85rem',
                      letterSpacing: '0.02em',
                      border: `2px solid ${alpha(obtenerColorEstado(actividad.estado), 0.3)}`,
                      transition: 'all 0.2s ease',
                      boxShadow: `0 2px 8px ${alpha(obtenerColorEstado(actividad.estado), 0.15)}`,
                      backdropFilter: 'blur(8px)',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(obtenerColorEstado(actividad.estado), 0.25)}`,
                        background: obtenerColorFondoEstado(actividad.estado),
                        border: `2px solid ${alpha(obtenerColorEstado(actividad.estado), 0.5)}`,
                      },
                      '& .MuiChip-icon': {
                        color: 'inherit',
                        marginLeft: '8px',
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main,
                      }}
                    >
                      <CalendarTodayIcon fontSize="small" />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatearFecha(actividad.fecha)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(theme.palette.info.main, 0.08),
                        color: theme.palette.info.main,
                      }}
                    >
                      <AccessTimeIcon fontSize="small" />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_fin)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {actividad.proyecto_nombre ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: alpha(theme.palette.success.main, 0.08),
                          color: theme.palette.success.main,
                        }}
                      >
                        <FolderIcon fontSize="small" />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {actividad.proyecto_nombre}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.6), fontStyle: 'italic' }}>
                      Sin proyecto
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      justifyContent: 'flex-end',
                      opacity: 1,
                      transform: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Tooltip title="Editar" arrow TransitionComponent={Zoom}>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditarActividad(actividad);
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          backdropFilter: 'blur(8px)',
                          width: 36,
                          height: 36,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar" arrow TransitionComponent={Zoom}>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarActividad(actividad);
                        }}
                        sx={{
                          color: theme.palette.error.main,
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          backdropFilter: 'blur(8px)',
                          width: 36,
                          height: 36,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Renderizar vista de cards
  const renderCardsView = () => (
    <Grid container spacing={3}>
      {actividadesFiltradas
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((actividad, index) => (
          <Grid item xs={12} sm={6} md={4} key={actividad.id}>
            <Grow 
              in={true} 
              timeout={300 + (index % 5) * 100}
              style={{ transformOrigin: '50% 10%' }}
            >
              <Paper 
                sx={{ 
                  height: '100%',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.6)})`
                    : `linear-gradient(145deg, ${alpha('#fff', 0.95)}, ${alpha('#fafafa', 0.85)})`,
                  backdropFilter: 'blur(10px)',
                  border: theme.palette.mode === 'dark'
                    ? `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    : `1px solid ${alpha(theme.palette.primary.main, 0.05)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `0 10px 30px -5px ${alpha(theme.palette.common.black, 0.1)}`,
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: `0 20px 40px -10px ${alpha(theme.palette.common.black, 0.15)}`,
                    '& .card-actions': {
                      opacity: 1,
                    },
                    '& .card-state-indicator': {
                      height: '100%',
                      opacity: 0.07,
                    },
                    '& .card-content': {
                      transform: 'translateY(-5px)',
                    }
                  },
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `radial-gradient(circle at 50% 0%, ${alpha(obtenerColorEstado(actividad.estado), 0.1)}, transparent 70%)`,
                    opacity: 0.8,
                    zIndex: 0,
                    transition: 'opacity 0.5s ease',
                  },
                }}
                onClick={() => handleVerDetalle(actividad)}
              >
                {/* Indicador de estado como línea lateral */}
                <Box 
                  className="card-state-indicator"
                  sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '6px',
                    height: '30%',
                    background: obtenerColorEstado(actividad.estado),
                    borderRadius: '3px',
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: 0.6,
                    zIndex: 1,
                  }}
                />

                {/* Contenido de la tarjeta */}
                <Box 
                  className="card-content"
                  sx={{ 
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    height: '100%',
                    p: 3,
                  }}
                >
                  {/* Header con nombre y estado */}
                  <Box sx={{ mb: 2.5 }}>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1.5
                    }}>
                      <Chip 
                        icon={obtenerIconoEstado(actividad.estado)}
                        label={obtenerEtiquetaEstado(actividad.estado)}
                        size="small"
                        sx={{ 
                          background: theme.palette.mode === 'dark'
                            ? alpha(obtenerColorEstado(actividad.estado), 0.15)
                            : alpha(obtenerColorEstado(actividad.estado), 0.12),
                          color: obtenerColorEstado(actividad.estado),
                          fontWeight: 600,
                          borderRadius: '12px',
                          height: '24px',
                          fontSize: '0.7rem',
                          border: `1px solid ${alpha(obtenerColorEstado(actividad.estado), 0.3)}`,
                          backdropFilter: 'blur(5px)',
                          mb: 1,
                          '& .MuiChip-icon': {
                            color: 'inherit',
                            marginLeft: '4px',
                            fontSize: '0.9rem',
                          },
                          '& .MuiChip-label': {
                            px: 1,
                            fontWeight: 700,
                          }
                        }}
                      />
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem',
                          color: alpha(theme.palette.text.secondary, 0.7),
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />
                        {formatearFecha(actividad.fecha)}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        lineHeight: 1.4,
                        mb: 1,
                        color: theme.palette.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {actividad.nombre}
                    </Typography>
                    
                    {actividad.descripcion && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: alpha(theme.palette.text.secondary, 0.9),
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          transition: 'all 0.3s ease',
                          mb: 0.5
                        }}
                      >
                        {actividad.descripcion}
                      </Typography>
                    )}
                  </Box>
                  
                  <Divider sx={{ 
                    my: 1.5, 
                    opacity: 0.5,
                    background: `linear-gradient(90deg, ${alpha(theme.palette.divider, 0.05)}, ${alpha(theme.palette.divider, 0.7)}, ${alpha(theme.palette.divider, 0.05)})` 
                  }} />
                  
                  {/* Detalles: Horario y Proyecto */}
                  <Box sx={{ mt: 'auto' }}>
                    {/* Horario */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      gap: 1.5,
                    }}>
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}
                      >
                        <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.7),
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'block',
                            mb: 0.2
                          }}
                        >
                          Horario
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: theme.palette.text.primary
                          }}
                        >
                          {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_fin)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Proyecto */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}>
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          backgroundColor: actividad.proyecto_nombre
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.grey[500], 0.1),
                          color: actividad.proyecto_nombre
                            ? theme.palette.success.main
                            : theme.palette.grey[500],
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}
                      >
                        <FolderIcon sx={{ fontSize: '1rem' }} />
                      </Avatar>
                      <Box sx={{ 
                        maxWidth: 'calc(100% - 50px)',
                        overflow: 'hidden'
                      }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: alpha(theme.palette.text.secondary, 0.7),
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'block',
                            mb: 0.2
                          }}
                        >
                          Proyecto
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: theme.palette.text.primary,
                            fontStyle: actividad.proyecto_nombre ? 'normal' : 'italic',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {actividad.proyecto_nombre || "Sin proyecto"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Espacio para separar los botones de acción */}
                    <Box sx={{ mt: 2.5, pt: 1.5, position: 'relative' }}>
                      <Divider sx={{ 
                        opacity: 0.3,
                        background: `linear-gradient(90deg, ${alpha(theme.palette.divider, 0.05)}, ${alpha(theme.palette.divider, 0.5)}, ${alpha(theme.palette.divider, 0.05)})`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0
                      }} />
                      
                      {/* Botones de acción */}
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end',
                          gap: 1.5
                        }}
                      >
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditarActividad(actividad);
                          }}
                          startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
                          sx={{
                            borderRadius: '8px',
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            color: theme.palette.primary.main,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            px: 1.5,
                            py: 0.5,
                            minWidth: 0,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.15),
                              boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.2)}`,
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarActividad(actividad);
                          }}
                          startIcon={<DeleteIcon sx={{ fontSize: '0.9rem' }} />}
                          sx={{
                            borderRadius: '8px',
                            backgroundColor: alpha(theme.palette.error.main, 0.08),
                            color: theme.palette.error.main,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                            px: 1.5,
                            py: 0.5,
                            minWidth: 0,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.15),
                              boxShadow: `0 4px 10px ${alpha(theme.palette.error.main, 0.2)}`,
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grow>
          </Grid>
        ))}
    </Grid>
  );

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ width: '100%', minHeight: '100vh', pb: 4 }}>
        {/* Header y Breadcrumb */}
        <Box 
          sx={{ 
            position: 'relative',
            mb: 4
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
                Mis Actividades
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
                      Mis Actividades
                    </Typography>
                  </Box>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto' }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Vista de tabla" arrow>
                    <IconButton 
                      onClick={() => handleViewChange('table')}
                      sx={{ 
                        borderRadius: '12px',
                        backgroundColor: viewType === 'table' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        color: viewType === 'table' ? theme.palette.primary.main : theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: viewType === 'table' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <ViewListIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Vista de tarjetas" arrow>
                    <IconButton 
                      onClick={() => handleViewChange('cards')}
                      sx={{ 
                        borderRadius: '12px',
                        backgroundColor: viewType === 'cards' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        color: viewType === 'cards' ? theme.palette.primary.main : theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: viewType === 'cards' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <ViewModuleIcon />
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
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 3
              }}
            >
              Filtros de Búsqueda
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Fecha Inicio"
                  type="date"
                  name="fechaInicio"
                  value={filtros.fechaInicio || ''}
                  onChange={handleChangeFiltro}
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
                  onChange={handleChangeFiltro}
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
                  onChange={handleChangeFiltro}
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
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="en_progreso">En Progreso</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="enviado">Enviado</MenuItem>
                  <MenuItem value="borrador">Borrador</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={handleLimpiarFiltros}
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
          placeholder="Buscar por nombre, descripción o proyecto..."
          variant="outlined"
          name="busqueda"
          value={filtros.busqueda}
          onChange={handleChangeFiltro}
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

      {/* Contenido principal */}
      <Grow in={true} style={{ transformOrigin: '0 0 0' }} timeout={800}>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : actividadesFiltradas.length === 0 ? (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No se encontraron actividades
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Intenta cambiar los filtros o crear una nueva actividad
            </Typography>
          </Paper>
        ) : (
          <Box>
            {viewType === 'table' ? renderTableView() : renderCardsView()}
            
            {/* Paginación */}
            <TablePagination
              component="div"
              count={actividadesFiltradas.length}
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
        )}
      </Grow>
        
        {/* Modal de detalle */}
        {actividadSeleccionada && (
          <ActividadDetalleModal
            open={verDetalleDialogo}
            onClose={handleCerrarDetalle}
            actividad={actividadSeleccionada}
            esEditable={true}
          />
        )}

        {/* Modal de confirmación de eliminación */}
        <Dialog
          open={mostrarConfirmacion}
          onClose={() => setMostrarConfirmacion(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              minWidth: 400,
              maxWidth: 500,
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: theme.palette.error.main,
            pb: 1
          }}>
            <DeleteIcon />
            Confirmar Eliminación
          </DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas eliminar la actividad "{actividadAEliminar?.descripcion || ''}"?
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={() => setMostrarConfirmacion(false)}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1,
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.grey[500], 0.08),
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmarEliminacion}
              disabled={eliminando}
              startIcon={eliminando ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1,
                background: `linear-gradient(45deg, ${theme.palette.error.main} 30%, ${theme.palette.error.dark} 90%)`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.3)}`,
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: alpha(theme.palette.error.main, 0.5),
                }
              }}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notificaciones */}
        <Snackbar
          open={notificacion.abierta}
          autoHideDuration={6000}
          onClose={handleCerrarNotificacion}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCerrarNotificacion} 
            severity={notificacion.tipo}
            sx={{ 
              borderRadius: 2,
              minWidth: '300px',
              boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
            }}
          >
            {notificacion.mensaje}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default MisActividades;
