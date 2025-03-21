import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
  useTheme,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  TablePagination,
  Grid,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Snackbar,
  Alert,
  Slide
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarTodayIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Drafts as DraftsIcon,
  Send as SendIcon,
  QuestionMark as QuestionMarkIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProyectosService from '../../services/proyectos.service';
import ActividadVisualizador from './ActividadVisualizador';
import ActividadEditor from './ActividadEditor';
import { Actividad } from '../../services/actividades.service';
import EliminarActividadModal from './EliminarActividadModal';

// Función para formatear fecha
const formatearFecha = (fecha: string | Date | null | undefined): string => {
  if (!fecha) return 'No definida';
  return format(new Date(fecha), 'dd MMMM yyyy', { locale: es });
};

// Función para formatear hora (quitar segundos)
const formatearHora = (hora: string | null | undefined): string => {
  if (!hora) return '--:--';
  // Si tiene formato HH:MM:SS, quitar los segundos
  if (hora.length === 8 && hora.includes(':')) {
    return hora.substring(0, 5);
  }
  return hora;
};

// Obtener icono según tipo de alerta
const getAlertIcon = (severity: 'success' | 'error' | 'info' | 'warning') => {
  switch(severity) {
    case 'success':
      return <CheckCircleIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'info':
      return <InfoIcon />;
    default:
      return <InfoIcon />;
  }
};

// Transición para Snackbar
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide {...props} direction="up" ref={ref} />;
});

interface ActividadesListaProps {
  proyectoId: string;
  onRegistrarActividad?: () => void;
  shouldRefresh?: boolean;
  actividadIdParaVer?: string | null;
  onCerrarDetalleActividad?: () => void;
}

const ActividadesLista: React.FC<ActividadesListaProps> = ({ 
  proyectoId, 
  onRegistrarActividad,
  shouldRefresh = false,
  actividadIdParaVer = null,
  onCerrarDetalleActividad
}) => {
  const theme = useTheme();
  const [viewType, setViewType] = useState<'table' | 'cards'>(() => {
    const savedView = localStorage.getItem('actividadesViewType');
    return (savedView as 'table' | 'cards') || 'table';
  });
  const [actividades, setActividades] = useState<any[]>([]);
  const [actividadesFiltradas, setActividadesFiltradas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el modal de detalle
  const [actividadSeleccionada, setActividadSeleccionada] = useState<any | null>(null);
  const [verDetalleDialogo, setVerDetalleDialogo] = useState(false);
  
  // Para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Para filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [filtroDescripcion, setFiltroDescripcion] = useState<string>('');

  // Estado para Snackbar (notificaciones toast)
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Estado para modal de edición
  const [editarDialogo, setEditarDialogo] = useState(false);

  // Estado para modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Añadir un nuevo estado para manejar la carga de documentos
  const [cargandoDocumentos, setCargandoDocumentos] = useState(false);

  // Función para mostrar notificaciones
  const mostrarSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
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

  // Manejar ver detalle de actividad
  const handleVerActividad = async (actividad: any) => {
    try {
      console.log("Mostrando detalle de actividad:", actividad.id);
      setCargandoDocumentos(true);
      
      // Obtener los documentos de la actividad antes de mostrar el modal
      const documentos = await ProyectosService.getDocumentosActividad(actividad.id);
      console.log("Documentos cargados:", documentos.length);
      
      // Añadir los documentos al objeto de actividad
      const actividadConDocumentos = {
        ...actividad,
        archivos: documentos.map(doc => ({
          nombre: doc.nombre_archivo,
          url: doc.ruta_archivo,
          tipo: doc.tipo_archivo,
          tamano: doc.tamaño_bytes
        }))
      };
      
      setActividadSeleccionada(actividadConDocumentos);
      setVerDetalleDialogo(true);
      console.log("Modal de detalle abierto");
    } catch (error) {
      console.error('Error al cargar documentos de la actividad:', error);
      mostrarSnackbar('Error al cargar los documentos adjuntos', 'error');
      // Mostrar la actividad sin documentos en caso de error
      setActividadSeleccionada(actividad);
      setVerDetalleDialogo(true);
    } finally {
      setCargandoDocumentos(false);
    }
  };

  // Manejar cierre del modal de detalle
  const handleCerrarDetalle = () => {
    setActividadSeleccionada(null);
    setVerDetalleDialogo(false);
    // Notificar al componente padre que se ha cerrado el modal
    if (onCerrarDetalleActividad) {
      onCerrarDetalleActividad();
    }
  };

  const cargarActividades = async () => {
    if (!proyectoId) {
      setError("No se ha seleccionado un proyecto");
      setCargando(false);
      return;
    }
    
    setCargando(true);
    setError(null);
    
    try {
      const data = await ProyectosService.getActividadesProyecto(proyectoId);
      const actividades = Array.isArray(data) ? data : [];
      setActividades(actividades);
      aplicarFiltros(actividades, filtroEstado, filtroFecha, filtroDescripcion);
      
      // Se eliminó la notificación que aparecía tras actualizar actividades
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setError("Error al cargar las actividades. Intenta de nuevo.");
      // Mantener esta notificación es importante para que el usuario sepa qué pasó si hay un error
      mostrarSnackbar('Error al cargar las actividades', 'error');
    } finally {
      setCargando(false);
    }
  };
  
  // Aplicar filtros a las actividades
  const aplicarFiltros = (actividadesData: any[], estado: string, fecha: string, descripcion: string = '') => {
    let resultado = [...actividadesData];
    
    // Filtrar por estado
    if (estado !== 'todos') {
      resultado = resultado.filter(actividad => actividad.estado === estado);
    }
    
    // Filtrar por descripción
    if (descripcion.trim() !== '') {
      const textoBusqueda = descripcion.toLowerCase().trim();
      resultado = resultado.filter(actividad => 
        actividad.descripcion && actividad.descripcion.toLowerCase().includes(textoBusqueda)
      );
    }
    
    // Filtrar por fecha
    if (fecha) {
      console.log("Aplicando filtro por fecha:", fecha);
      // Crear una fecha sin considerar zona horaria
      const partesFecha = fecha.split('-');
      const yearFiltro = parseInt(partesFecha[0]);
      const monthFiltro = parseInt(partesFecha[1]) - 1; // Meses en JS son 0-11
      const dayFiltro = parseInt(partesFecha[2]);
      
      resultado = resultado.filter(actividad => {
        if (!actividad.fecha) {
          console.log("Actividad sin fecha", actividad);
          return false;
        }
        
        // Obtener partes de la fecha de la actividad
        const fechaAct = new Date(actividad.fecha);
        const yearAct = fechaAct.getFullYear();
        const monthAct = fechaAct.getMonth();
        const dayAct = fechaAct.getDate();
        
        // Comparar año, mes y día directamente en lugar de timestamp
        const coincide = yearAct === yearFiltro && monthAct === monthFiltro && dayAct === dayFiltro;
        
        if (coincide) {
          console.log("Coincide fecha:", actividad.fecha, "con filtro:", fecha);
        }
        
        return coincide;
      });
    }
    
    console.log("Actividades filtradas:", resultado.length);
    setActividadesFiltradas(resultado);
    // Resetear paginación
    setPage(0);
  };
  
  // Cargar actividades al inicio y cuando cambie el proyecto
  useEffect(() => {
    cargarActividades();
  }, [proyectoId]);
  
  // Refrescar actividades cuando shouldRefresh cambie a true
  useEffect(() => {
    if (shouldRefresh) {
      cargarActividades();
    }
  }, [shouldRefresh]);
  
  // Efecto para cargar actividades
  useEffect(() => {
    if (!cargando && actividades.length > 0) {
      // Se eliminó la llamada a mostrarSnackbar aquí
    }
  }, [cargando]);
  
  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros(actividades, filtroEstado, filtroFecha, filtroDescripcion);
  }, [filtroEstado, filtroFecha, filtroDescripcion]);

  // Efecto para abrir el modal de detalle cuando se recibe un actividadIdParaVer
  useEffect(() => {
    const abrirActividadPorId = async () => {
      if (actividadIdParaVer && actividades.length > 0) {
        console.log("Buscando actividad con ID:", actividadIdParaVer);
        console.log("Actividades disponibles:", actividades.length);
        
        const actividadEncontrada = actividades.find(act => act.id === actividadIdParaVer);
        if (actividadEncontrada) {
          console.log("Actividad encontrada:", actividadEncontrada);
          await handleVerActividad(actividadEncontrada);
        } else {
          console.log("No se encontró la actividad con ID:", actividadIdParaVer);
          
          // Solicitar nuevamente las actividades si no se encuentra
          if (!cargando) {
            console.log("Recargando actividades para buscar ID:", actividadIdParaVer);
            await cargarActividades();
          }
        }
      }
    };
    
    if (!cargando) {
      abrirActividadPorId();
    }
  }, [actividadIdParaVer, actividades, cargando]);

  // Cambiar modo de visualización y guardar en localStorage
  const handleViewModeChange = (newMode: 'table' | 'cards') => {
    setViewType(newMode);
    localStorage.setItem('actividadesViewType', newMode);
    // Se eliminó la llamada a mostrarSnackbar aquí
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
  
  // Manejar cambios en los filtros
  const handleEstadoChange = (event: SelectChangeEvent<string>) => {
    setFiltroEstado(event.target.value);
  };
  
  const handleFechaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroFecha(event.target.value);
  };

  const handleDescripcionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroDescripcion(event.target.value);
  };

  // Función para obtener color según estado
  const getColorEstado = (estado: string) => {
    switch(estado) {
      case 'borrador':
        return theme.palette.info.main;
      case 'enviado':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Obtener etiqueta de estado
  const getEtiquetaEstado = (estado: string) => {
    switch(estado) {
      case 'borrador': return 'Borrador';
      case 'enviado': return 'Enviada';
      default: return 'Desconocido';
    }
  };
  
  // Abrir diálogo de edición
  const handleEditarActividad = (actividad: Actividad) => {
    setActividadSeleccionada(actividad);
    setEditarDialogo(true);
  };

  // Cerrar diálogo de edición
  const handleCerrarEdicion = () => {
    setEditarDialogo(false);
  };
  
  // Actualizar el manejador de eliminación
  const handleEliminarActividad = (actividad: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que se propague al handleRowClick
    setSelectedActivityId(actividad.id);
    setShowDeleteModal(true);
  };
  
  // Manejador para hacer clic en la fila
  const handleRowClick = (actividad: any) => {
    // Si está enviada, ver detalles; si no, editar
    if (actividad.estado === 'enviado') {
      handleVerActividad(actividad);
    } else {
      handleEditarActividad(actividad);
    }
  };

  // Función para limpiar filtros sin notificación
  const handleLimpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroFecha('');
    setFiltroDescripcion('');
    // Se eliminó la notificación que aparecía al limpiar filtros
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AssignmentIcon sx={{ color: theme.palette.primary.main }} />
          Actividades del Proyecto
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Botones para cambiar el modo de visualización */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Vista de tabla" arrow>
              <IconButton 
                onClick={() => handleViewModeChange('table')}
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
                onClick={() => handleViewModeChange('cards')}
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
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              fontWeight: 600,
              textTransform: 'none',
              px: 2,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
            onClick={onRegistrarActividad}
            disabled={!onRegistrarActividad}
          >
            Registrar Actividad
          </Button>
        </Box>
      </Box>
      
      {/* Filtros */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3, 
        flexWrap: 'wrap',
        alignItems: 'center',
        p: 2,
        borderRadius: '12px',
        backgroundColor: alpha(theme.palette.background.paper, 0.4),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" />
          <Typography variant="subtitle2">Filtros:</Typography>
        </Box>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="estado-select-label">Estado</InputLabel>
          <Select
            labelId="estado-select-label"
            id="estado-select"
            value={filtroEstado}
            label="Estado"
            onChange={handleEstadoChange}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="borrador">Borrador</MenuItem>
            <MenuItem value="enviado">Enviada</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="Fecha"
          type="date"
          size="small"
          value={filtroFecha}
          onChange={handleFechaChange}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ minWidth: 200 }}
        />
        
        <TextField
          label="Descripción"
          type="text"
          size="small"
          value={filtroDescripcion}
          onChange={handleDescripcionChange}
          placeholder="Buscar por descripción..."
          InputProps={{
            startAdornment: (
              <SearchIcon 
                fontSize="small" 
                sx={{ color: theme.palette.text.secondary, mr: 1 }}
              />
            ),
          }}
          sx={{ 
            minWidth: 250,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '&:hover': {
                '& > fieldset': {
                  borderColor: theme.palette.primary.main,
                }
              },
            }
          }}
        />
        
        {(filtroEstado !== 'todos' || filtroFecha || filtroDescripcion) && (
          <Button 
            size="small" 
            variant="outlined" 
            onClick={handleLimpiarFiltros}
          >
            Limpiar filtros
          </Button>
        )}
      </Box>
      
      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper
          sx={{
            p: 3,
            borderRadius: '16px',
            textAlign: 'center',
            bgcolor: alpha(theme.palette.error.main, 0.05),
            border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
          }}
        >
          <Typography color="error" gutterBottom>{error}</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={cargarActividades}
            sx={{ mt: 2 }}
          >
            Intentar nuevamente
          </Button>
        </Paper>
      ) : actividadesFiltradas.length === 0 ? (
        <Paper
          sx={{
            p: 5,
            borderRadius: '16px',
            textAlign: 'center',
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
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
              margin: '0 auto 24px auto'
            }}
          >
            {filtroEstado !== 'todos' || filtroFecha || filtroDescripcion ? 
              <FilterListIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} /> : 
              <AssignmentIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            }
          </Box>
          <Typography variant="h6" gutterBottom>
            {filtroEstado !== 'todos' || filtroFecha || filtroDescripcion ? 
              'No se encontraron actividades con los filtros seleccionados' : 
              'No hay actividades registradas'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            {filtroEstado !== 'todos' || filtroFecha || filtroDescripcion ? 
              `No hay actividades que coincidan con los criterios: ${filtroEstado !== 'todos' ? `Estado: ${getEtiquetaEstado(filtroEstado)}` : ''}
               ${filtroFecha ? `Fecha: ${formatearFecha(filtroFecha)}` : ''}
               ${filtroDescripcion ? `Descripción: "${filtroDescripcion}"` : ''}` : 
              'Este proyecto aún no tiene actividades registradas. Comienza agregando una nueva actividad.'}
          </Typography>
          {filtroEstado !== 'todos' || filtroFecha || filtroDescripcion ? (
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleLimpiarFiltros}
              sx={{ mr: 2 }}
            >
              Limpiar filtros
            </Button>
          ) : null}
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              fontWeight: 600,
              textTransform: 'none',
              px: 2,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
            onClick={onRegistrarActividad}
            disabled={!onRegistrarActividad}
          >
            Registrar Actividad
          </Button>
        </Paper>
      ) : viewType === 'table' ? (
        <>
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
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell align="center">Acciones</TableCell>
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
                      },
                      '&:not(:last-child)': {
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                      },
                      cursor: 'pointer',
                    }}
                    onClick={() => handleRowClick(actividad)}
                  >
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          color: theme.palette.text.primary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.4
                        }}
                      >
                        {actividad.descripcion}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={
                          actividad.estado === 'borrador' ? 
                            <DraftsIcon fontSize="small" /> : 
                          actividad.estado === 'enviado' ? 
                            <SendIcon fontSize="small" /> : 
                            <QuestionMarkIcon fontSize="small" />
                        }
                        label={getEtiquetaEstado(actividad.estado)}
                        size="small"
                        sx={{ 
                          background: alpha(getColorEstado(actividad.estado), 0.1),
                          color: getColorEstado(actividad.estado),
                          fontWeight: 600,
                          borderRadius: '12px',
                          minWidth: '100px',
                          height: '32px',
                          fontSize: '0.8rem',
                          border: `1px solid ${alpha(getColorEstado(actividad.estado), 0.3)}`,
                          pl: 0.5,
                          '& .MuiChip-icon': {
                            color: 'inherit'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatearFecha(actividad.fecha)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_fin)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-start', 
                        gap: 1, 
                        width: '180px',
                        margin: '0 auto' 
                      }}>
                        {actividad.estado === 'enviado' ? (
                          <Button 
                            size="small"
                            color="primary"
                            variant="outlined"
                            startIcon={<VisibilityIcon fontSize="small" />}
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que se propague al clic de la fila
                              handleVerActividad(actividad);
                            }}
                            sx={{ 
                              borderRadius: '8px',
                              textTransform: 'none',
                              minWidth: '90px',
                              fontSize: '0.75rem',
                              py: 0.5
                            }}
                          >
                            Ver
                          </Button>
                        ) : (
                          <>
                            <Button 
                              size="small"
                              color="primary"
                              variant="outlined"
                              startIcon={<EditIcon fontSize="small" />}
                              onClick={(e) => {
                                e.stopPropagation(); // Evitar que se propague al clic de la fila
                                handleEditarActividad(actividad);
                              }}
                              sx={{ 
                                borderRadius: '8px',
                                textTransform: 'none',
                                minWidth: '90px',
                                fontSize: '0.75rem',
                                py: 0.5
                              }}
                            >
                              Editar
                            </Button>
                            <Button 
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={<DeleteIcon fontSize="small" />}
                              onClick={(e) => {
                                e.stopPropagation(); // Evitar que se propague al clic de la fila
                                handleEliminarActividad(actividad, e);
                              }}
                              sx={{ 
                                borderRadius: '8px',
                                textTransform: 'none',
                                minWidth: '90px',
                                fontSize: '0.75rem',
                                py: 0.5
                              }}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={actividadesFiltradas.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{
              mt: 2,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          />
        </>
      ) : (
        <>
          <Grid container spacing={3}>
            {actividadesFiltradas
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((actividad) => (
              <Grid item xs={12} sm={6} md={4} key={actividad.id}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: `0 8px 28px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleRowClick(actividad)}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '6px',
                      background: alpha(getColorEstado(actividad.estado), 0.8)
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip 
                      icon={
                        actividad.estado === 'borrador' ? 
                          <DraftsIcon fontSize="small" /> : 
                        actividad.estado === 'enviado' ? 
                          <SendIcon fontSize="small" /> : 
                          <QuestionMarkIcon fontSize="small" />
                      }
                      label={getEtiquetaEstado(actividad.estado)}
                      size="small"
                      sx={{ 
                        background: alpha(getColorEstado(actividad.estado), 0.1),
                        color: getColorEstado(actividad.estado),
                        fontWeight: 600,
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        height: '28px',
                        border: `1px solid ${alpha(getColorEstado(actividad.estado), 0.3)}`,
                        pl: 0.5,
                        '& .MuiChip-icon': {
                          color: 'inherit',
                          marginLeft: '4px',
                          marginRight: '-4px'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />
                      {formatearFecha(actividad.fecha)}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4
                    }}
                  >
                    {actividad.descripcion}
                  </Typography>
                  
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_fin)}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        justifyContent: 'flex-end',
                        width: '160px'
                      }}>
                        {actividad.estado === 'enviado' ? (
                          <Button 
                            size="small" 
                            color="primary"
                            variant="outlined"
                            startIcon={<VisibilityIcon fontSize="small" />}
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que se propague al clic de la tarjeta
                              handleVerActividad(actividad);
                            }}
                            sx={{ 
                              borderRadius: '8px',
                              textTransform: 'none',
                              padding: '1px 8px',
                              minWidth: '75px',
                              fontSize: '0.7rem'
                            }}
                          >
                            Ver
                          </Button>
                        ) : (
                          <>
                            <Button 
                              size="small" 
                              color="primary"
                              variant="outlined"
                              startIcon={<EditIcon fontSize="small" />}
                              onClick={(e) => {
                                e.stopPropagation(); // Evitar que se propague al clic de la tarjeta
                                handleEditarActividad(actividad);
                              }}
                              sx={{ 
                                borderRadius: '8px',
                                textTransform: 'none',
                                padding: '1px 8px',
                                minWidth: '75px',
                                fontSize: '0.7rem'
                              }}
                            >
                              Editar
                            </Button>
                            <Button 
                              size="small" 
                              color="error"
                              variant="outlined"
                              startIcon={<DeleteIcon fontSize="small" />}
                              onClick={(e) => {
                                e.stopPropagation(); // Evitar que se propague al clic de la tarjeta
                                handleEliminarActividad(actividad, e);
                              }}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                padding: '1px 8px',
                                minWidth: '75px',
                                fontSize: '0.7rem'
                              }}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <TablePagination
            component="div"
            count={actividadesFiltradas.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[6, 12, 24]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{
              mt: 2,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          />
        </>
      )}

      {/* Snackbar para notificaciones */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={SlideTransition}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          icon={getAlertIcon(snackbar.severity)}
          sx={{ 
            width: '100%', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${alpha(theme.palette[snackbar.severity].main, 0.5)}`,
            '& .MuiAlert-icon': {
              fontSize: '24px'
            },
            '& .MuiAlert-message': {
              fontSize: '0.95rem',
              fontWeight: 500
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modal de detalle de actividad */}
      {actividadSeleccionada && (
        <ActividadVisualizador
          open={verDetalleDialogo}
          onClose={handleCerrarDetalle}
          actividad={actividadSeleccionada}
          onActualizarActividad={() => {
            handleCerrarDetalle();
            handleEditarActividad(actividadSeleccionada);
          }}
          esEditable={true}
          cargandoDocumentos={cargandoDocumentos}
        />
      )}

      {/* Modal de edición de actividad */}
      {actividadSeleccionada && (
        <ActividadEditor
          open={editarDialogo}
          onClose={handleCerrarEdicion}
          actividad={actividadSeleccionada}
          onActualizarActividad={() => {
            handleCerrarEdicion();
            // Refrescar los datos
            cargarActividades();
            setSnackbar({
              open: true,
              severity: 'success',
              message: 'Actividad actualizada correctamente'
            });
          }}
        />
      )}

      {/* Modal de eliminación */}
      <EliminarActividadModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedActivityId(null);
        }}
        actividadId={selectedActivityId!}
        onEliminar={() => {
          cargarActividades();
          mostrarSnackbar('Actividad eliminada correctamente', 'success');
        }}
      />
    </Box>
  );
};

export default ActividadesLista; 