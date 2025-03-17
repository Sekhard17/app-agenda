import { useState, useEffect, useMemo } from 'react';
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
  Skeleton,
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Zoom,
} from '@mui/material';

// Importar el componente de modal de detalle
import ActividadDetalleModal from '../components/ActividadDetalleModal';
import { 
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Home as HomeIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
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
        return theme.palette.success.main;
      case 'en_progreso':
      case 'en progreso':
        return theme.palette.info.main;
      case 'pendiente':
        return theme.palette.warning.main;
      case 'enviado':
        return theme.palette.primary.main;
      case 'borrador':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };

  // Obtener color de fondo según estado
  const obtenerColorFondoEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completada':
        return `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.2)}, ${alpha(theme.palette.success.main, 0.1)})`;
      case 'en_progreso':
      case 'en progreso':
        return `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.2)}, ${alpha(theme.palette.info.main, 0.1)})`;
      case 'pendiente':
        return `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.2)}, ${alpha(theme.palette.warning.main, 0.1)})`;
      case 'enviado':
        return `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)})`;
      case 'borrador':
        return `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.2)}, ${alpha(theme.palette.grey[500], 0.1)})`;
      default:
        return `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.2)}, ${alpha(theme.palette.grey[500], 0.1)})`;
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

  // Manejar actualización de actividad
  const handleActividadActualizada = () => {
    cargarActividades();
    setVerDetalleDialogo(false);
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
  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: ViewType) => {
    if (newView !== null) {
      setViewType(newView);
      localStorage.setItem('actividadesViewType', newView);
    }
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
                    label={obtenerEtiquetaEstado(actividad.estado)}
                    size="small"
                    sx={{ 
                      background: obtenerColorFondoEstado(actividad.estado),
                      color: obtenerColorEstado(actividad.estado),
                      fontWeight: 600,
                      borderRadius: '8px',
                      minWidth: '100px',
                      height: '28px',
                      fontSize: '0.8rem',
                      letterSpacing: '0.02em',
                      border: `1px solid ${alpha(obtenerColorEstado(actividad.estado), 0.2)}`,
                      transition: 'all 0.2s ease',
                      boxShadow: `0 2px 4px ${alpha(obtenerColorEstado(actividad.estado), 0.1)}`,
                      backdropFilter: 'blur(8px)',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 8px ${alpha(obtenerColorEstado(actividad.estado), 0.2)}`,
                        background: obtenerColorFondoEstado(actividad.estado),
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
                    className="actions-container"
                    sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      justifyContent: 'flex-end',
                      opacity: 0,
                      transform: 'translateX(10px)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Tooltip title="Editar" arrow TransitionComponent={Zoom}>
                      <IconButton 
                        size="small"
                        onClick={() => handleVerDetalle(actividad)}
                        sx={{
                          color: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          backdropFilter: 'blur(8px)',
                          width: 34,
                          height: 34,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar" arrow TransitionComponent={Zoom}>
                      <IconButton 
                        size="small"
                        sx={{
                          color: theme.palette.error.main,
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          backdropFilter: 'blur(8px)',
                          width: 34,
                          height: 34,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2),
                            transform: 'translateY(-2px)',
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
        .map((actividad) => (
          <Grid item xs={12} sm={6} md={4} key={actividad.id}>
            <Fade in={true} timeout={300}>
              <Paper 
                sx={{ 
                  p: 3,
                  height: '100%',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
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
                    background: `linear-gradient(180deg, 
                      ${alpha(theme.palette.primary.main, 0.02)} 0%, 
                      ${alpha(theme.palette.background.paper, 0)} 100%)`,
                    pointerEvents: 'none'
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    '& .card-actions': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    }
                  }
                }}
                onClick={() => handleVerDetalle(actividad)}
              >
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    mb: 2 
                  }}>
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        lineHeight: 1.3,
                        color: theme.palette.text.primary,
                        mb: 0.5
                      }}
                    >
                      {actividad.nombre}
                    </Typography>
                    
                    <Chip 
                      label={obtenerEtiquetaEstado(actividad.estado)}
                      size="small"
                      sx={{ 
                        background: obtenerColorFondoEstado(actividad.estado),
                        color: obtenerColorEstado(actividad.estado),
                        fontWeight: 600,
                        borderRadius: '8px',
                        height: '28px',
                        fontSize: '0.8rem',
                        letterSpacing: '0.02em',
                        border: `1px solid ${alpha(obtenerColorEstado(actividad.estado), 0.2)}`,
                      }}
                    />
                  </Box>
                  
                  {actividad.descripcion && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: alpha(theme.palette.text.secondary, 0.8),
                        mb: 3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6,
                        flex: 1
                      }}
                    >
                      {actividad.descripcion}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2,
                  mt: 'auto',
                  pt: 3,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main,
                      }}
                    >
                      <CalendarTodayIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                        Fecha
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatearFecha(actividad.fecha)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(theme.palette.info.main, 0.08),
                        color: theme.palette.info.main,
                      }}
                    >
                      <AccessTimeIcon />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                        Horario
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_fin)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {actividad.proyecto_nombre ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: alpha(theme.palette.success.main, 0.08),
                          color: theme.palette.success.main,
                        }}
                      >
                        <FolderIcon />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                          Proyecto
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {actividad.proyecto_nombre}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: alpha(theme.palette.grey[500], 0.08),
                          color: theme.palette.grey[500],
                        }}
                      >
                        <FolderIcon />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                          Proyecto
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: alpha(theme.palette.text.secondary, 0.6), fontStyle: 'italic' }}>
                          Sin proyecto
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box 
                  className="card-actions"
                  sx={{ 
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    display: 'flex',
                    gap: 1,
                    opacity: 0,
                    transform: 'translateY(10px)',
                    transition: 'all 0.3s ease',
                    zIndex: 2,
                  }}
                >
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerDetalle(actividad);
                    }}
                    sx={{
                      color: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      width: 34,
                      height: 34,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      width: 34,
                      height: 34,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        ))}
    </Grid>
  );

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', pb: 4 }}>
      {/* Header y Breadcrumb */}
      <Box 
        sx={{ 
          position: 'relative',
          mb: 4,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -24,
            left: -24,
            right: -24,
            height: '320px',
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.primary.main, 0.15)} 0%, 
              ${alpha(theme.palette.primary.dark, 0.05)} 100%)`,
            filter: 'blur(60px)',
            borderRadius: '0 0 50% 50%',
            pointerEvents: 'none',
            zIndex: 0
          }
        }}
      >
        <Box sx={{ 
          position: 'relative',
          zIndex: 1,
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            pl: 0.5
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
              padding: '4px',
              '& > a, & > div': {
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                '&:not(:last-child):after': {
                  content: '""',
                  display: 'block',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: alpha(theme.palette.text.secondary, 0.4),
                  margin: '0 12px'
                }
              }
            }}>
              <Box 
                component="a" 
                href="/" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 1.5,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.08)
                  }
                }}
              >
                <HomeIcon sx={{ fontSize: 18, mr: 0.75, opacity: 0.8 }} />
                Inicio
              </Box>
              
              <Box sx={{ 
                color: theme.palette.primary.main, 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.85rem',
                py: 0.5,
                px: 1.5,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              }}>
                <FolderIcon sx={{ fontSize: 18, mr: 0.75 }} />
                Mis Actividades
              </Box>
            </Box>
          </Box>

          {/* Cabecera con título y acciones */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexWrap: 'wrap', 
            gap: 2 
          }}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                  mb: 1
                }}
              >
                Mis Actividades
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: alpha(theme.palette.text.secondary, 0.8),
                  maxWidth: '600px'
                }}
              >
                Gestiona y visualiza todas tus actividades registradas. Utiliza los filtros para encontrar actividades específicas.
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              borderRadius: 3,
              padding: '6px',
            }}>
              <ToggleButtonGroup
                value={viewType}
                exclusive
                onChange={handleViewChange}
                size="small"
                sx={{ 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  backgroundColor: 'transparent',
                  '& .MuiToggleButton-root': {
                    border: 'none !important',
                    borderLeft: 'none !important',
                    borderRight: 'none !important',
                    borderTop: 'none !important',
                    borderBottom: 'none !important',
                    outline: 'none !important',
                    px: 2,
                    py: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.18),
                      }
                    },
                    '&:focus': {
                      outline: 'none !important',
                      border: 'none !important',
                    }
                  }
                }}
              >
                <ToggleButton value="cards">
                  <ViewModuleIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="table">
                  <ViewListIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                sx={{ 
                  borderRadius: 2,
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
              
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={cargarActividades}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`
                  }
                }}
              >
                Actualizar
              </Button>
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
        </Box>
      </Box>

      {/* Contenido principal */}
      {cargando ? (
        <Box sx={{ py: 2 }}>
          {viewType === 'table' ? (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {[...Array(6)].map((_, index) => (
                      <TableCell key={index}>
                        <Skeleton variant="text" width={100} />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...Array(3)].map((_, index) => (
                    <TableRow key={index}>
                      {[...Array(6)].map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton variant="text" width={cellIndex === 0 ? 200 : 100} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Grid container spacing={2}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="40%" height={24} />
                    <Box sx={{ mt: 2 }}>
                      <Skeleton variant="text" width="100%" height={60} />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} variant="text" width="80%" height={24} sx={{ mt: 1 }} />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
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
      
      {/* Modal de detalle */}
      {actividadSeleccionada && (
        <ActividadDetalleModal
          open={verDetalleDialogo}
          onClose={handleCerrarDetalle}
          actividad={actividadSeleccionada}
          onActividadActualizada={handleActividadActualizada}
          esEditable={true}
        />
      )}
    </Box>
  );
};

export default MisActividades;
