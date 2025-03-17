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
  useMediaQuery,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar
} from '@mui/material';
import { 
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterAlt as FilterAltIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ActividadesService from '../services/actividades.service';
import { Actividad } from '../services/actividades.service';
import ActividadDetalleModal from '../components/ActividadDetalleModal';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_CONFIG } from '../config/api.config';

interface Usuario {
  id: string;
  nombres: string;
  appaterno: string;
  apmaterno: string;
  email: string;
  rol: 'funcionario' | 'supervisor';
}

interface FiltroActividades {
  fechaInicio?: string;
  fechaFin?: string;
  usuario?: string;
  proyecto?: string;
  supervisado?: string;
  busqueda?: string;
}

const RevisionActividades = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  
  // Detección de dispositivo móvil
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estados
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const [verDetalleDialogo, setVerDetalleDialogo] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Configuramos un rango de fechas amplio por defecto (último mes)
  const [filtros, setFiltros] = useState<FiltroActividades>({
    fechaInicio: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    fechaFin: format(new Date(), 'yyyy-MM-dd'),
    busqueda: '', // Inicializamos el campo de búsqueda vacío
    // No filtramos por estado ni usuario ni proyecto por defecto
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Filtrar actividades en tiempo real según la búsqueda
  const actividadesFiltradas = useMemo(() => {
    if (!filtros.busqueda) return actividades;
    
    const busquedaLower = filtros.busqueda.toLowerCase();
    return actividades.filter(actividad => {
      const nombreUsuario = actividad.usuarios ? 
        `${actividad.usuarios.nombres} ${actividad.usuarios.appaterno}`.toLowerCase() : '';
      const nombreProyecto = actividad.proyectos ? actividad.proyectos.nombre.toLowerCase() : '';
      const descripcion = actividad.descripcion ? actividad.descripcion.toLowerCase() : '';
      
      return nombreUsuario.includes(busquedaLower) || 
             nombreProyecto.includes(busquedaLower) || 
             descripcion.includes(busquedaLower) ||
             actividad.fecha.includes(busquedaLower);
    });
  }, [actividades, filtros.busqueda]);

  // Agregar estado para supervisados
  const [supervisados, setSupervisados] = useState<Usuario[]>([]);

  // Cargar actividades
  const cargarActividades = async () => {
    try {
      setCargando(true);
      console.log('Iniciando carga de actividades con filtros:', filtros);
      
      // Crear objeto con los parámetros de filtro
      const filtrosParams: Record<string, string> = {};
      
      // Asegurarse de que las fechas estén en el formato correcto
      if (filtros.fechaInicio) {
        // Asegurarnos de que la fecha esté en formato YYYY-MM-DD
        try {
          const fecha = new Date(filtros.fechaInicio);
          if (!isNaN(fecha.getTime())) {
            filtrosParams.fechaInicio = fecha.toISOString().split('T')[0];
          } else {
            filtrosParams.fechaInicio = filtros.fechaInicio;
          }
        } catch (e) {
          filtrosParams.fechaInicio = filtros.fechaInicio;
        }
        console.log('Filtro fechaInicio:', filtrosParams.fechaInicio);
      }
      
      if (filtros.fechaFin) {
        // Asegurarnos de que la fecha esté en formato YYYY-MM-DD
        try {
          const fecha = new Date(filtros.fechaFin);
          if (!isNaN(fecha.getTime())) {
            filtrosParams.fechaFin = fecha.toISOString().split('T')[0];
          } else {
            filtrosParams.fechaFin = filtros.fechaFin;
          }
        } catch (e) {
          filtrosParams.fechaFin = filtros.fechaFin;
        }
        console.log('Filtro fechaFin:', filtrosParams.fechaFin);
      }
      
      if (filtros.usuario) {
        filtrosParams.usuarioId = filtros.usuario;
        console.log('Filtro usuario:', filtros.usuario);
      }
      
      if (filtros.proyecto) {
        filtrosParams.proyectoId = filtros.proyecto;
        console.log('Filtro proyecto:', filtros.proyecto);
      }
      
      if (filtros.supervisado) {
        filtrosParams.supervisado = filtros.supervisado;
        console.log('Filtro supervisado:', filtros.supervisado);
      }
      
      console.log('Parámetros de filtro preparados:', filtrosParams);
      
      // Usar el servicio de actividades para obtener las actividades supervisadas
      const actividadesSupervisadas = await ActividadesService.getActividadesSupervisadas(filtrosParams);
      
      console.log('Actividades recibidas:', actividadesSupervisadas?.length || 0);
      
      // Filtrar solo las actividades con estado "Enviado"
      const actividadesEnviadas = actividadesSupervisadas?.filter(act => act.estado?.toLowerCase() === 'enviado') || [];
      console.log('Actividades con estado Enviado:', actividadesEnviadas.length);
      
      setActividades(actividadesEnviadas);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setActividades([]); // Establecer array vacío en caso de error
    } finally {
      setCargando(false);
    }
  };

  // Cargar actividades al montar el componente o cambiar filtros
  useEffect(() => {
    if (usuario?.rol === 'supervisor') {
      cargarActividades();
    }
  }, [usuario?.rol, filtros]);

  // Función para obtener supervisados
  const fetchSupervisados = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USUARIOS.SUPERVISADOS}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + Cookies.get('auth_token')
        }
      });
      setSupervisados(response.data.supervisados || []);
    } catch (error) {
      console.error('Error al obtener supervisados:', error);
    }
  };

  // Cargar supervisados al montar el componente
  useEffect(() => {
    fetchSupervisados();
  }, []);

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
    switch (estado) {
      case 'enviado':
        return theme.palette.info.main;
      case 'borrador':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Manejar actualización de filtros
  const actualizarFiltros = (nuevosFiltros: Partial<FiltroActividades>) => {
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      ...nuevosFiltros
    }));
  };


  // Manejar click en ver detalle
  const handleVerDetalle = (actividad: Actividad) => {
    setActividadSeleccionada(actividad);
    setVerDetalleDialogo(true);
  };

  // Manejadores de paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Obtener actividades paginadas
  const actividadesPaginadas = actividadesFiltradas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Diálogo de detalle de actividad
  const renderizarDialogoDetalle = () => {
    if (!actividadSeleccionada) return null;
    
    return (
      <ActividadDetalleModal 
        open={verDetalleDialogo}
        onClose={() => setVerDetalleDialogo(false)}
        actividad={actividadSeleccionada}
      />
    );
  };

  // Panel de filtros
  const renderizarPanelFiltros = () => {
    return (
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
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Fecha inicio"
                type="date"
                fullWidth
                value={filtros.fechaInicio || ''}
                onChange={(e) => actualizarFiltros({ fechaInicio: e.target.value })}
                InputLabelProps={{ 
                  shrink: true,
                  sx: { fontWeight: 500 }
                }}
                InputProps={{
                  sx: {
                    borderRadius: '12px',
                    bgcolor: 'background.paper',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.2),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Fecha fin"
                type="date"
                fullWidth
                value={filtros.fechaFin || ''}
                onChange={(e) => actualizarFiltros({ fechaFin: e.target.value })}
                InputLabelProps={{ 
                  shrink: true,
                  sx: { fontWeight: 500 }
                }}
                InputProps={{
                  sx: {
                    borderRadius: '12px',
                    bgcolor: 'background.paper',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.2),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="Supervisado"
                fullWidth
                value={filtros.supervisado || ''}
                onChange={(e) => actualizarFiltros({ supervisado: e.target.value })}
                InputLabelProps={{ 
                  sx: { fontWeight: 500 }
                }}
                InputProps={{
                  sx: {
                    borderRadius: '12px',
                    bgcolor: 'background.paper',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.2),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  }
                }}
              >
                <MenuItem value="">
                  <em>Todos los supervisados</em>
                </MenuItem>
                {supervisados.map((supervisado) => (
                  <MenuItem key={supervisado.id} value={supervisado.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 24,
                          height: 24,
                          mr: 1,
                          fontSize: '0.75rem',
                          bgcolor: theme.palette.primary.main
                        }}
                      >
                        {supervisado.nombres.charAt(0)}{supervisado.appaterno.charAt(0)}
                      </Avatar>
                      {`${supervisado.nombres} ${supervisado.appaterno}`}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Button 
                fullWidth
                variant="outlined" 
                onClick={() => {
                  setFiltros({
                    fechaInicio: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'),
                    fechaFin: format(new Date(), 'yyyy-MM-dd'),
                  });
                }}
                startIcon={<RefreshIcon />}
                sx={{ 
                  borderRadius: '12px',
                  height: '56px',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderColor: alpha(theme.palette.divider, 0.2),
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              >
                Restablecer
              </Button>
              <Button 
                fullWidth
                variant="contained" 
                onClick={cargarActividades}
                startIcon={<SearchIcon />}
                sx={{ 
                  borderRadius: '12px',
                  height: '56px',
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
    );
  };

  // Obtener el número de actividades filtradas para mostrar en la interfaz
  
  // Función para manejar cambios en el campo de búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros(prev => ({
      ...prev,
      busqueda: event.target.value
    }));
    // Resetear paginación al buscar
    setPage(0);
  };

  return (
    <Box sx={{ flexGrow: 1, width: '100%', pb: 4 }}>
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
              Revisión de Actividades
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
                  Revisión de Actividades
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            width: '100%',
            mb: 3
          }}>
            <TextField
              placeholder="Buscar actividades..."
              variant="outlined"
              size="small"
              value={filtros.busqueda || ''}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
                endAdornment: filtros.busqueda ? (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small"
                      onClick={() => setFiltros(prev => ({ ...prev, busqueda: '' }))}
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
            
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              ml: 'auto'
            }}>
              <Button
                startIcon={<FilterAltIcon />}
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
                startIcon={<DownloadIcon />}
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
                Exportar datos
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Panel de filtros */}
        {renderizarPanelFiltros()}
        
        {/* Contenido principal para dispositivos móviles */}
        {isMobile && filtros.busqueda && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Buscando: "{filtros.busqueda}"
            </Typography>
            <IconButton size="small" onClick={() => setFiltros(prev => ({ ...prev, busqueda: '' }))}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        
        {/* Contenido principal */}
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: '16px',
            height: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}
          elevation={0}
        >
          {cargando ? (
            <Box sx={{ p: 2 }}>
              <Skeleton variant="text" width="60%" height={30} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Skeleton variant="rounded" width={120} height={40} />
                <Skeleton variant="rounded" width={120} height={40} />
              </Box>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '8px' }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Skeleton variant="rounded" width={240} height={40} />
              </Box>
            </Box>
          ) : actividadesFiltradas.length > 0 ? (
            <Fade in={!cargando} timeout={500}>
              <Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Usuario</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Horario</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Proyecto</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {actividadesPaginadas.map((actividad) => {
                        const nombreUsuario = actividad.usuarios ? 
                          `${actividad.usuarios.nombres} ${actividad.usuarios.appaterno}` : 
                          'Usuario desconocido';
                          
                        return (
                          <TableRow 
                            key={actividad.id}
                            hover
                            onClick={() => handleVerDetalle(actividad)}
                            sx={{
                              cursor: 'pointer',
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
                                  {actividad.usuarios?.nombres.charAt(0)}{actividad.usuarios?.appaterno.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" fontWeight={500}>
                                  {nombreUsuario}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ 
                                    width: 24,
                                    height: 24,
                                    mr: 1,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                  }}
                                >
                                  <CalendarTodayIcon sx={{ fontSize: 14 }} />
                                </Avatar>
                                <Typography variant="body2">
                                  {formatearFecha(actividad.fecha)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ 
                                    width: 24,
                                    height: 24,
                                    mr: 1,
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    color: theme.palette.info.main,
                                  }}
                                >
                                  <AccessTimeIcon sx={{ fontSize: 14 }} />
                                </Avatar>
                                <Typography variant="body2">
                                  {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_fin)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ 
                                    width: 24,
                                    height: 24,
                                    mr: 1,
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    color: theme.palette.success.main,
                                  }}
                                >
                                  <FolderIcon sx={{ fontSize: 14 }} />
                                </Avatar>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                  {actividad.proyectos ? actividad.proyectos.nombre : '-'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}
                              >
                                {actividad.descripcion || 'Sin descripción'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={actividad.estado === 'enviado' ? 'Enviado' : 'Borrador'} 
                                size="small"
                                sx={{ 
                                  bgcolor: alpha(obtenerColorEstado(actividad.estado), 0.1),
                                  color: obtenerColorEstado(actividad.estado),
                                  fontWeight: 500,
                                  borderRadius: '6px',
                                  height: '26px',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={actividadesFiltradas.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Filas por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                  sx={{
                    mt: 3,
                    '.MuiTablePagination-toolbar': {
                      padding: '12px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '12px',
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    },
                    '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: '0.85rem',
                    },
                    '.MuiTablePagination-select': {
                      padding: '6px 12px',
                      marginRight: 1,
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      borderRadius: '8px',
                      '&:focus': {
                        borderColor: theme.palette.primary.main
                      }
                    },
                    '.MuiTablePagination-actions': {
                      marginLeft: 2,
                      '& .MuiIconButton-root': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main,
                        borderRadius: '8px',
                        padding: '4px',
                        marginLeft: '8px',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.15),
                          transform: 'translateY(-2px)',
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Fade>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 8,
              px: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.7),
              border: `1px dashed ${theme.palette.divider}`,
              mx: 2
            }}>
              <InfoIcon sx={{ 
                fontSize: 48, 
                color: theme.palette.info.main, 
                opacity: 0.7, 
                mb: 2 
              }} />
              <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                No se encontraron actividades
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                No hay actividades que coincidan con los filtros seleccionados.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                Posibles razones:
              </Typography>
              <Box sx={{ mb: 3, textAlign: 'left', width: '100%', maxWidth: '450px' }}>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  • No tienes usuarios asignados para supervisar
                </Typography>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  • Los usuarios supervisados no tienen actividades en este período
                </Typography>
                <Typography variant="body2" component="div">
                  • Los filtros aplicados son demasiado restrictivos
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => setMostrarFiltros(true)}
                startIcon={<FilterListIcon />}
                sx={{ mb: 1 }}
              >
                Ajustar filtros
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setFiltros({
                    fechaInicio: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
                    fechaFin: format(new Date(), 'yyyy-MM-dd'),
                  });
                  setMostrarFiltros(true);
                }}
                sx={{ mt: 1 }}
              >
                Ver últimos 30 días
              </Button>
            </Box>
          )}
        </Paper>
        
        {/* Diálogo de detalle */}
        {renderizarDialogoDetalle()}
      </Box>
    </Box>
  );
};

export default RevisionActividades;
