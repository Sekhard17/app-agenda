import { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  IconButton, 
  Tooltip, 
  Button,
  TextField,
  useTheme,
  alpha,
  Skeleton,
  TablePagination,
  Collapse,
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';

// Importar el componente de modal de detalle
import ActividadDetalleModal from '../components/ActividadDetalleModal';
import { 
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ActividadesService from '../services/actividades.service';

// Importamos la interfaz Actividad del servicio
import { Actividad } from '../services/actividades.service';

interface FiltroActividades {
  prioridad?: string;
  busqueda?: string;
}

const ActividadesPendientes = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  
  // Estados
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const [verDetalleDialogo, setVerDetalleDialogo] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtros
  const [filtros, setFiltros] = useState<FiltroActividades>({
    busqueda: '',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Filtrar actividades en tiempo real según la búsqueda
  const actividadesFiltradas = useMemo(() => {
    let filtradas = actividades;
    
    // Filtrar por búsqueda
    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      filtradas = filtradas.filter(actividad => {
        const nombreProyecto = actividad.proyecto_nombre ? actividad.proyecto_nombre.toLowerCase() : '';
        const descripcion = actividad.descripcion ? actividad.descripcion.toLowerCase() : '';
        const nombre = actividad.nombre ? actividad.nombre.toLowerCase() : '';
        
        return nombreProyecto.includes(busquedaLower) || 
               descripcion.includes(busquedaLower) ||
               nombre.includes(busquedaLower);
      });
    }
    
    // Filtrar por prioridad
    if (filtros.prioridad) {
      filtradas = filtradas.filter(actividad => 
        actividad.prioridad?.toLowerCase() === filtros.prioridad?.toLowerCase()
      );
    }
    
    return filtradas;
  }, [actividades, filtros]);
  
  // Agrupar actividades por fecha
  const actividadesAgrupadas = useMemo(() => {
    const grupos: Record<string, Actividad[]> = {};
    
    // Agrupar por fecha
    actividadesFiltradas.forEach(actividad => {
      const fecha = actividad.fecha;
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(actividad);
    });
    
    // Convertir a array y ordenar por fecha (más cercana primero)
    return Object.entries(grupos)
      .sort(([fechaA], [fechaB]) => new Date(fechaA).getTime() - new Date(fechaB).getTime())
      .map(([fecha, actividades]) => ({
        fecha,
        actividades
      }));
  }, [actividadesFiltradas]);

  // Cargar actividades
  const cargarActividades = async () => {
    try {
      setCargando(true);
      console.log('Iniciando carga de actividades pendientes...');
      
      // Usar el servicio de actividades para obtener las actividades del usuario
      const misActividades = await ActividadesService.getActividadesUsuario();
      
      console.log('Actividades recibidas:', misActividades?.length || 0);
      
      // Filtrar solo las actividades pendientes
      const actividadesPendientes = misActividades?.filter(act => 
        act.estado?.toLowerCase() === 'pendiente' || act.estado?.toLowerCase() === 'en_progreso'
      ) || [];
      
      console.log('Actividades pendientes:', actividadesPendientes.length);
      
      // Ordenar por fecha (más cercana primero) y luego por prioridad
      const actividadesOrdenadas = [...actividadesPendientes].sort((a, b) => {
        // Primero por fecha
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        
        if (fechaA !== fechaB) return fechaA - fechaB;
        
        // Si las fechas son iguales, ordenar por prioridad
        const prioridadValor = {
          'alta': 3,
          'media': 2,
          'baja': 1
        };
        
        const valorA = prioridadValor[a.prioridad as keyof typeof prioridadValor] || 0;
        const valorB = prioridadValor[b.prioridad as keyof typeof prioridadValor] || 0;
        
        return valorB - valorA; // Mayor prioridad primero
      });
      
      setActividades(actividadesOrdenadas);
    } catch (error) {
      console.error('Error al cargar actividades pendientes:', error);
      setActividades([]); // Establecer array vacío en caso de error
    } finally {
      setCargando(false);
    }
  };

  // Cargar actividades al montar el componente
  useEffect(() => {
    if (usuario) {
      cargarActividades();
    }
  }, [usuario]);

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    // Verificar si la fecha es hoy
    const hoy = new Date();
    const fechaActividad = new Date(fecha);
    
    if (
      fechaActividad.getDate() === hoy.getDate() &&
      fechaActividad.getMonth() === hoy.getMonth() &&
      fechaActividad.getFullYear() === hoy.getFullYear()
    ) {
      return 'Hoy';
    }
    
    // Verificar si la fecha es mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    
    if (
      fechaActividad.getDate() === manana.getDate() &&
      fechaActividad.getMonth() === manana.getMonth() &&
      fechaActividad.getFullYear() === manana.getFullYear()
    ) {
      return 'Mañana';
    }
    
    // Para otras fechas, usar el formato normal
    return format(fechaActividad, 'EEEE, d MMMM', { locale: es });
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

  // Obtener color según prioridad
  const obtenerColorPrioridad = (prioridad: string) => {
    switch (prioridad.toLowerCase()) {
      case 'alta':
        return theme.palette.error.main;
      case 'media':
        return theme.palette.warning.main;
      case 'baja':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Manejar cambio de página
  const handleChangePage = (_event: unknown, newPage: number) => {
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
      busqueda: '',
    });
    setPage(0);
  };

  // Manejar cambio de estado a "En Progreso"
  const handleIniciarActividad = async (actividad: Actividad) => {
    try {
      const resultado = await ActividadesService.actualizarActividad(actividad.id, {
        estado: 'en_progreso'
      });
      
      if (resultado) {
        cargarActividades();
      }
    } catch (error) {
      console.error('Error al iniciar actividad:', error);
    }
  };

  // Manejar cambio de estado a "Completada"
  const handleCompletarActividad = async (actividad: Actividad) => {
    try {
      const resultado = await ActividadesService.actualizarActividad(actividad.id, {
        estado: 'completada'
      });
      
      if (resultado) {
        cargarActividades();
      }
    } catch (error) {
      console.error('Error al completar actividad:', error);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Actividades Pendientes
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            sx={{ borderRadius: 2 }}
          >
            Filtros
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarActividades}
            sx={{ borderRadius: 2 }}
          >
            Actualizar
          </Button>
        </Box>
      </Box>
      
      {/* Panel de filtros */}
      <Collapse in={mostrarFiltros}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2, 
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)'
          }}
        >
          <Typography variant="h6" gutterBottom>Filtros</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Prioridad"
                name="prioridad"
                value={filtros.prioridad || ''}
                onChange={handleChangeFiltro}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
                <MenuItem value="media">Media</MenuItem>
                <MenuItem value="baja">Baja</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleLimpiarFiltros}
                startIcon={<ClearIcon />}
                fullWidth
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
        placeholder="Buscar actividades..."
        variant="outlined"
        name="busqueda"
        value={filtros.busqueda}
        onChange={handleChangeFiltro}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: filtros.busqueda ? (
            <InputAdornment position="end">
              <IconButton onClick={() => setFiltros(prev => ({ ...prev, busqueda: '' }))}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: { borderRadius: 2 }
        }}
      />
      
      {/* Lista de actividades */}
      {cargando ? (
        // Skeleton para carga
        <Box>
          {[...Array(3)].map((_, index) => (
            <Paper 
              key={index} 
              sx={{ 
                p: 2, 
                mb: 2, 
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="60%" height={24} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Skeleton variant="rounded" width={100} height={32} />
                <Skeleton variant="rounded" width={120} height={32} />
              </Box>
            </Paper>
          ))}
        </Box>
      ) : actividadesFiltradas.length === 0 ? (
        // Mensaje cuando no hay actividades
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)'
          }}
        >
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No tienes actividades pendientes
          </Typography>
          <Typography variant="body1" color="textSecondary">
            ¡Buen trabajo! Puedes registrar nuevas actividades desde la sección "Registrar Actividad"
          </Typography>
        </Paper>
      ) : (
        // Lista de actividades agrupadas por fecha
        <Box>
          {actividadesAgrupadas
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map(({ fecha, actividades }) => (
              <Box key={fecha} sx={{ mb: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    textTransform: 'capitalize',
                    fontWeight: 'bold',
                    color: theme.palette.text.primary
                  }}
                >
                  {formatearFecha(fecha)}
                </Typography>
                
                <Grid container spacing={2}>
                  {actividades.map((actividad) => (
                    <Grid item xs={12} sm={6} md={4} key={actividad.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 2,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          },
                          position: 'relative',
                          overflow: 'visible'
                        }}
                      >
                        {/* Indicador de prioridad */}
                        {actividad.prioridad && (
                          <Box 
                            sx={{ 
                              position: 'absolute',
                              top: -8,
                              right: 16,
                              backgroundColor: obtenerColorPrioridad(actividad.prioridad),
                              color: '#fff',
                              borderRadius: '12px',
                              px: 1.5,
                              py: 0.5,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              boxShadow: 2,
                              zIndex: 1
                            }}
                          >
                            <FlagIcon fontSize="small" />
                            {actividad.prioridad.toUpperCase()}
                          </Box>
                        )}
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {actividad.nombre}
                          </Typography>
                          
                          {actividad.descripcion && (
                            <Typography 
                              variant="body2" 
                              color="textSecondary" 
                              sx={{ 
                                mb: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {actividad.descripcion}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                              <Typography variant="body2" color="textSecondary">
                                {formatearHora(actividad.hora_inicio || '')} - {formatearHora(actividad.hora_fin || '')}
                              </Typography>
                            </Box>
                            
                            {actividad.proyecto_nombre && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <FolderIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                                <Typography variant="body2" color="textSecondary">
                                  {actividad.proyecto_nombre}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                        
                        <Divider />
                        
                        <CardActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
                          <Button 
                            size="small" 
                            onClick={() => handleVerDetalle(actividad)}
                            startIcon={<InfoIcon />}
                          >
                            Detalles
                          </Button>
                          
                          <Box>
                            {actividad.estado === 'pendiente' ? (
                              <Tooltip title="Iniciar Actividad">
                                <IconButton 
                                  color="primary" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIniciarActividad(actividad);
                                  }}
                                >
                                  <PlayArrowIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Marcar como Completada">
                                <IconButton 
                                  color="success" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompletarActividad(actividad);
                                  }}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          
          {/* Paginación */}
          <TablePagination
            component="div"
            count={actividadesAgrupadas.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Grupos por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Box>
      )}
      
      {/* Modal de detalle de actividad */}
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

export default ActividadesPendientes;
