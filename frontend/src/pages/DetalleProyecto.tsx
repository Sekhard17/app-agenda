import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Skeleton,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
  useTheme,
  Dialog,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Slide,
  CircularProgress,
  Select,
  MenuItem
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Inventory as InventoryIcon,
  Comment as CommentIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Update as UpdateIcon,
  CheckCircleOutline as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import ProyectosService, { Proyecto } from '../services/proyectos.service';
import { motion } from 'framer-motion';
import CrearActividad from '../components/actividades/CrearActividad';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ActividadesLista from '../components/actividades/ActividadesLista';
import { TransitionProps } from '@mui/material/transitions';
import DocumentosVisualizador from '../components/documentos/DocumentosVisualizador';
import ComentariosActividad from '../components/comentarios/ComentariosActividad';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Función para formatear fecha
const formatearFecha = (fecha: string | Date | null | undefined): string => {
  if (!fecha) return 'No definida';
  return format(new Date(fecha), 'dd MMMM yyyy', { locale: es });
};

// Tipos
type TabContentProps = {
  proyecto: Proyecto;
};

// Componentes
const CargandoProyecto: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Skeleton variant="text" width={250} height={40} />
      </Box>
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '16px', mb: 3 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '16px' }} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '16px' }} />
        </Grid>
      </Grid>
    </Box>
  );
};

const ProyectoNoEncontrado: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" color="error" gutterBottom>
        Proyecto no encontrado
      </Typography>
      <Button 
        variant="contained" 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/portal-proyectos')}
        sx={{ mt: 2 }}
      >
        Volver a Proyectos
      </Button>
    </Box>
  );
};

const ActividadesTab: React.FC<TabContentProps & { 
  onRegistrarActividad: () => void;
  shouldRefresh: boolean;
  actividadIdParaVer?: string | null;
  onCerrarDetalleActividad?: () => void;
}> = ({ proyecto, onRegistrarActividad, shouldRefresh, actividadIdParaVer, onCerrarDetalleActividad }) => {
  return (
    <ActividadesLista 
      proyectoId={proyecto.id} 
      onRegistrarActividad={onRegistrarActividad}
      shouldRefresh={shouldRefresh}
      actividadIdParaVer={actividadIdParaVer}
      onCerrarDetalleActividad={onCerrarDetalleActividad}
    />
  );
};

const DocumentosTab: React.FC<TabContentProps> = ({ proyecto }) => {
  const [cargando, setCargando] = useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  
  // Manejador para subir documentos
  const handleSubirDocumento = () => {
    // Implementar lógica para subir documentos
    // Aquí iría el código para abrir un modal de subida de documentos
  };
  
  // Cargar documentos cuando se monta el componente o cambia el proyecto
  useEffect(() => {
    let isMounted = true; // Para prevenir actualización de estado si el componente se desmonta
    
    const cargarDocumentos = async () => {
      if (!proyecto || !proyecto.id) return;
      
      setCargando(true);
      try {
        const docs = await ProyectosService.getDocumentosProyecto(proyecto.id);
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          setDocumentos(docs);
          setCargando(false);
        }
      } catch (error) {
        if (isMounted) {
          setCargando(false);
        }
      }
    };
    
    cargarDocumentos();
    
    // Cleanup function para prevenir memory leaks
    return () => {
      isMounted = false;
    };
  }, [proyecto?.id]); // Solo dependemos de proyecto.id en lugar de todo el objeto proyecto
  
  return (
    <DocumentosVisualizador 
      documentos={documentos}
      cargando={cargando}
      onSubirDocumento={handleSubirDocumento}
      titulo="Documentos del Proyecto"
      mensajeVacio="Este proyecto aún no tiene documentos adjuntos. Puedes subir nuevos documentos usando el botón de arriba."
    />
  );
};

const RecursosTab: React.FC<TabContentProps> = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Recursos del Proyecto
      </Typography>
      <Typography color="text.secondary">
        Contenido de recursos en desarrollo.
      </Typography>
    </Box>
  );
};

const ComentariosTab: React.FC<TabContentProps> = ({ proyecto }) => {
  const [actividadSeleccionada, setActividadSeleccionada] = useState<string | null>(null);
  const [actividades, setActividades] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { usuario } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const cargarActividades = async () => {
      try {
        setCargando(true);
        const actividadesData = await ProyectosService.getActividadesProyecto(proyecto.id);
        
        // Mejorar la detección de actividades permitidas
        const actividadesUsuario = actividadesData.filter(actividad => {
          // Si el usuario es supervisor, puede ver todas las actividades
          if (usuario?.rol === 'supervisor') return true;
          
          // Para usuarios normales, comprobar todas las posibles relaciones
          // 1. Es el creador de la actividad
          const esCreador = actividad.creador_id === usuario?.id;
          
          // 2. Es el usuario principal de la actividad
          const esUsuarioPrincipal = actividad.id_usuario === usuario?.id;
          
          // 3. Está en la lista de usuarios asignados
          let estaAsignado = false;
          if (actividad.usuarios_asignados) {
            if (Array.isArray(actividad.usuarios_asignados)) {
              estaAsignado = actividad.usuarios_asignados.some((u: any) => u.id === usuario?.id);
            } else if (typeof actividad.usuarios_asignados === 'object') {
              // Si es un solo objeto y no un array
              estaAsignado = actividad.usuarios_asignados.id === usuario?.id;
            }
          }
          
          console.log(`Actividad ${actividad.id}: creador=${esCreador}, principal=${esUsuarioPrincipal}, asignado=${estaAsignado}`);
          
          return esCreador || esUsuarioPrincipal || estaAsignado;
        });
        
        console.log(`Proyecto ${proyecto.id}: ${actividadesData.length} actividades totales, ${actividadesUsuario.length} filtradas para el usuario ${usuario?.id}`);
        
        setActividades(actividadesUsuario);
        if (actividadesUsuario.length > 0) {
          setActividadSeleccionada(actividadesUsuario[0].id);
        }
      } catch (error) {
        console.error('Error al cargar actividades:', error);
        setError('No se pudieron cargar las actividades asignadas a tu usuario');
      } finally {
        setCargando(false);
      }
    };

    cargarActividades();
  }, [proyecto.id, usuario]);

  const handleComentarioError = (mensaje: string) => {
    // Mostrar mensaje de error
    setError(mensaje);
    
    // Si es un error de permisos, desactivar la actividad seleccionada
    if (mensaje.includes('No tiene permisos')) {
      console.log(`Error de permisos detectado para la actividad ${actividadSeleccionada}: ${mensaje}`);
      
      // Eliminar la actividad sin permisos de la lista
      if (actividadSeleccionada) {
        const actividadesActualizadas = actividades.filter(act => act.id !== actividadSeleccionada);
        setActividades(actividadesActualizadas);
        
        // Seleccionar la primera actividad disponible o ninguna si no hay
        if (actividadesActualizadas.length > 0) {
          setActividadSeleccionada(actividadesActualizadas[0].id);
        } else {
          setActividadSeleccionada(null);
        }
      }
    }
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (actividades.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          bgcolor: alpha(theme.palette.info.main, 0.05),
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          textAlign: 'center'
        }}
      >
        <ChatIcon sx={{ fontSize: '2.5rem', color: alpha(theme.palette.info.main, 0.3), mb: 1 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No hay actividades disponibles
        </Typography>
        <Typography color="textSecondary" variant="body2">
          No tienes actividades asignadas en este proyecto o no tienes permisos para ver sus comentarios.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {error && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '12px',
            bgcolor: alpha(theme.palette.error.main, 0.08),
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
          }}
        >
          <Typography color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon fontSize="small" />
            {error}
          </Typography>
        </Paper>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Seleccionar Actividad:
        </Typography>
        <Select
          fullWidth
          value={actividadSeleccionada || ''}
          onChange={(e) => {
            setActividadSeleccionada(e.target.value);
            setError(null); // Limpiar error al cambiar de actividad
          }}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            }
          }}
        >
          {actividades.map((actividad) => (
            <MenuItem key={actividad.id} value={actividad.id}>
              {actividad.titulo || actividad.descripcion}
              {actividad.creador_id === usuario?.id && (
                <Chip 
                  label="Creada por ti" 
                  size="small" 
                  sx={{ 
                    ml: 1,
                    height: 20,
                    fontSize: '0.7rem', 
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main
                  }}
                />
              )}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {actividadSeleccionada && (
        <ErrorBoundary 
          fallback={
            <Box p={2}>
              <Typography color="error">
                No tienes permisos para ver los comentarios de esta actividad.
              </Typography>
            </Box>
          }
        >
          <ComentariosActividad 
            idActividad={actividadSeleccionada}
            onError={handleComentarioError}
          />
        </ErrorBoundary>
      )}
    </Box>
  );
};

// Funciones de utilidad para cálculos
const calcularDiasTranscurridos = (fechaInicio?: string | Date | null): number => {
  if (!fechaInicio) return 0;
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  return Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
};

const calcularDiasRestantes = (fechaFin?: string | Date | null): number => {
  if (!fechaFin) return 0;
  const fin = new Date(fechaFin);
  const hoy = new Date();
  return Math.max(0, Math.floor((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));
};

const calcularPromedioHorasDiarias = (horasRegistradas: number, fechaInicio?: string | Date | null): number => {
  const diasTranscurridos = calcularDiasTranscurridos(fechaInicio);
  return diasTranscurridos > 0 ? Math.round((horasRegistradas / diasTranscurridos) * 10) / 10 : horasRegistradas;
};

// Añadir componente para la vista de Resumen
const ResumenTab: React.FC<{ 
  proyecto: Proyecto;
  formatearFecha: (fecha: string | Date | null | undefined) => string;
  colorEstado: string;
  getEtiquetaEstado: (estado: string) => string;
  onVerDetalleActividad: (actividadId: string) => void;
}> = ({ proyecto, formatearFecha, colorEstado, getEtiquetaEstado, onVerDetalleActividad }) => {
  const theme = useTheme();
  
  return (
    <Box>
      {/* Hero Section más compacta */}
      <Box 
        sx={{ 
          position: 'relative',
          mb: 3,
          p: 3,
          borderRadius: '20px',
          background: `linear-gradient(145deg, 
            ${alpha(theme.palette.background.paper, 0.95)}, 
            ${alpha(theme.palette.background.paper, 0.85)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header Info más compacto */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: '280px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Chip
                  label={getEtiquetaEstado(proyecto?.estado)}
                  size="small"
                  sx={{
                    bgcolor: alpha(colorEstado, 0.1),
                    color: colorEstado,
                    fontWeight: 600,
                    borderRadius: '6px',
                    height: '24px'
                  }}
                />
                <Tooltip title="Última actualización" arrow>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    <CalendarTodayIcon sx={{ fontSize: '0.9rem' }} />
                    {formatearFecha(proyecto?.fecha_actualizacion)}
                  </Typography>
                </Tooltip>
              </Box>
              
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800,
                  mb: 1.5,
                  background: `linear-gradient(135deg, 
                    ${theme.palette.text.primary}, 
                    ${alpha(theme.palette.text.primary, 0.8)})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1
                }}
              >
                {proyecto?.nombre}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.6,
                  maxWidth: '700px',
                  mb: 2
                }}
              >
                {proyecto.descripcion || 'Sin descripción disponible'}
              </Typography>
            </Box>

            {/* Team Section más compacto */}
            {proyecto?.usuarios_asignados && proyecto.usuarios_asignados.length > 0 && (
              <Box sx={{ 
                p: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                borderRadius: '12px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                minWidth: '220px'
              }}>
                <Tooltip title="Equipo asignado al proyecto" arrow>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    👥 Equipo del Proyecto
                  </Typography>
                </Tooltip>
                <AvatarGroup
                  max={5}
                  sx={{
                    justifyContent: 'center',
                    '& .MuiAvatar-root': {
                      width: 35,
                      height: 35,
                      fontSize: '0.9rem',
                      border: `2px solid ${theme.palette.background.paper}`,
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        zIndex: 2
                      }
                    }
                  }}
                >
                  {proyecto.usuarios_asignados.map((usuario) => (
                    <Tooltip
                      key={usuario.id}
                      title={`${usuario.nombres} ${usuario.appaterno}`}
                      arrow
                    >
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {usuario.nombres[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
                <Tooltip title="Total de miembros en el equipo" arrow>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      textAlign: 'center',
                      mt: 1,
                      color: theme.palette.text.secondary
                    }}
                  >
                    {proyecto.usuarios_asignados.length} miembros
                  </Typography>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Quick Stats más compactos */}
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 2,
              mb: 3
            }}
          >
            <Tooltip title="Total de actividades enviadas" arrow>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <CheckCircleIcon sx={{ color: theme.palette.primary.main, mb: 0.5, fontSize: '1.2rem' }} />
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {proyecto.actividades_completadas || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Actividades Enviadas
                </Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Porcentaje general de avance del proyecto" arrow>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: alpha(colorEstado, 0.08),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <TrendingUpIcon sx={{ color: colorEstado, mb: 0.5, fontSize: '1.2rem' }} />
                <Typography variant="h5" fontWeight="bold" sx={{ color: colorEstado }}>
                  {proyecto.progreso || 0}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Progreso General
                </Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Total de horas registradas en el proyecto" arrow>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <AccessTimeIcon sx={{ color: theme.palette.info.main, mb: 0.5, fontSize: '1.2rem' }} />
                <Typography variant="h5" fontWeight="bold" color="info.main">
                  {proyecto.horas_registradas || 0}h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Horas Registradas
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Timeline y Progress Sections más compactos */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              mb: 2
            }}
          >
            <Tooltip title="Línea de tiempo del proyecto con fechas clave" arrow>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <TimelineIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
                Línea de Tiempo
              </Typography>
            </Tooltip>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Tooltip title="Fecha de inicio del proyecto" arrow>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Inicio
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatearFecha(proyecto.fecha_inicio)}
                  </Typography>
                </Box>
              </Tooltip>
              
              <Box sx={{ flex: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={proyecto.progreso || 0}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha(colorEstado, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 2,
                      bgcolor: colorEstado
                    }
                  }}
                />
              </Box>
              
              <Tooltip title="Fecha estimada de término" arrow>
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Término
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatearFecha(proyecto.fecha_fin)}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Tooltip title="Tiempo transcurrido desde el inicio del proyecto" arrow>
                <Chip
                  label={`${calcularDiasTranscurridos(proyecto.fecha_inicio)} días en curso`}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    height: '22px',
                    fontSize: '0.75rem'
                  }}
                />
              </Tooltip>
              <Tooltip title="Días restantes hasta la fecha de término" arrow>
                <Chip
                  label={`${calcularDiasRestantes(proyecto.fecha_fin)} días restantes`}
                  size="small"
                  sx={{
                    bgcolor: alpha(colorEstado, 0.1),
                    color: colorEstado,
                    height: '22px',
                    fontSize: '0.75rem'
                  }}
                />
              </Tooltip>
            </Box>
          </Box>

          {/* Progress Details más compacto */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Tooltip title="Detalles del progreso y métricas clave" arrow>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <SpeedIcon sx={{ color: colorEstado, fontSize: '1.2rem' }} />
                Detalles de Progreso
              </Typography>
            </Tooltip>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Tooltip title="Actividades en estado borrador" arrow>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      bgcolor: alpha(theme.palette.background.paper, 0.4)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <AssignmentIcon sx={{ color: theme.palette.text.secondary, fontSize: '1rem' }} />
                      <Typography variant="caption" color="text.secondary">
                        Actividades Borrador
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="medium">
                      {(proyecto.total_actividades || 0) - (proyecto.actividades_completadas || 0)}
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Tooltip title="Promedio de horas trabajadas por día" arrow>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      bgcolor: alpha(theme.palette.background.paper, 0.4)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <ScheduleIcon sx={{ color: theme.palette.text.secondary, fontSize: '1rem' }} />
                      <Typography variant="caption" color="text.secondary">
                        Promedio Horas/Día
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="medium">
                      {calcularPromedioHorasDiarias(proyecto.horas_registradas || 0, proyecto.fecha_inicio)}h
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={80}
                      sx={{
                        mt: 1,
                        height: 3,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 1.5,
                          bgcolor: theme.palette.info.main
                        }
                      }}
                    />
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Side Panel más compacto */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              height: '100%'
            }}
          >
            <Tooltip title="Resumen de actividades recientes y próximos hitos" arrow>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <UpdateIcon sx={{ color: theme.palette.secondary.main, fontSize: '1.2rem' }} />
                Resumen de Actividad
              </Typography>
            </Tooltip>

            <Box>
              <Tooltip title="Última actividad registrada en el proyecto" arrow>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  gutterBottom 
                  display="block"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                  Última Actividad
                </Typography>
              </Tooltip>
              {proyecto.ultima_actividad ? (
                <Box
                  onClick={() => {
                    if (proyecto.ultima_actividad?.id) {
                      console.log("Activando ID:", proyecto.ultima_actividad.id);
                      onVerDetalleActividad(proyecto.ultima_actividad.id);
                    }
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: '10px',
                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    mb: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
                    }
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    {proyecto.ultima_actividad.descripcion}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatearFecha(proyecto.ultima_actividad.fecha)} • {proyecto.ultima_actividad.usuario}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay actividades registradas
                </Typography>
              )}
            </Box>

            <Box>
              <Tooltip title="Próximos hitos importantes del proyecto" arrow>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  gutterBottom 
                  display="block"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <FlagIcon sx={{ fontSize: '1rem' }} />
                  Próximos Hitos
                </Typography>
              </Tooltip>
              {proyecto.fecha_fin ? (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '10px',
                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    mb: 1.5
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    Fecha de Término del Proyecto
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatearFecha(proyecto.fecha_fin)} ({calcularDiasRestantes(proyecto.fecha_fin)} días restantes)
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay hitos próximos
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
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

// Componente principal
const DetalleProyecto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Estados
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [seccionActual, setSeccionActual] = useState<string>('resumen');
  const [modalActividadAbierto, setModalActividadAbierto] = useState<boolean>(false);
  const [refreshActividades, setRefreshActividades] = useState<boolean>(false);
  const [activeActividadId, setActiveActividadId] = useState<string | null>(null);
  
  // Estado para las notificaciones toast
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

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
  
  // Definición de secciones
  const secciones = [
    {
      id: 'resumen',
      icon: <AssignmentIcon />,
      texto: 'Resumen',
      color: theme.palette.primary.dark
    },
    {
      id: 'actividades',
      icon: <AssignmentIcon />,
      texto: 'Actividades',
      color: theme.palette.primary.main
    },
    {
      id: 'documentos',
      icon: <DescriptionIcon />,
      texto: 'Documentos',
      color: theme.palette.info.main
    },
    {
      id: 'recursos',
      icon: <InventoryIcon />,
      texto: 'Recursos',
      color: theme.palette.warning.main
    },
    {
      id: 'comentarios',
      icon: <CommentIcon />,
      texto: 'Comentarios',
      color: theme.palette.success.main
    }
  ] as const;
  
  // Cargar datos del proyecto
  useEffect(() => {
    const fetchProyecto = async () => {
      if (!id) return;
      
      setCargando(true);
      try {
        // Obtener datos básicos del proyecto
        const proyectoData = await ProyectosService.getProyectoDetalle(id);
        
        if (proyectoData) {
          // Obtener estadísticas del proyecto
          const estadisticas = await ProyectosService.getEstadisticasProyecto(id);
          
          // Obtener actividades del proyecto
          const actividades = await ProyectosService.getActividadesProyecto(id);
          
          // Filtrar actividades con estado "enviado" para contar como completadas
          const actividadesEnviadas = actividades?.filter(act => act.estado === 'enviado') || [];
          
          // Obtener documentos del proyecto
          const documentos = await ProyectosService.getDocumentosProyecto(id);
          
          // Calcular el progreso basado en las fechas
          const fechaInicio = proyectoData.fecha_inicio ? new Date(proyectoData.fecha_inicio) : new Date();
          const fechaFin = proyectoData.fecha_fin ? new Date(proyectoData.fecha_fin) : new Date();
          const hoy = new Date();
          
          // Calcular el progreso basado en el tiempo transcurrido
          const totalDias = Math.max(1, (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
          const diasTranscurridos = Math.min(
            totalDias,
            Math.max(0, (hoy.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24))
          );
          const progreso = Math.round((diasTranscurridos / totalDias) * 100);

          // Crear un objeto enriquecido con datos reales
          const proyectoEnriquecido = {
            ...proyectoData,
            progreso: estadisticas?.progreso || Math.min(100, Math.max(0, progreso)),
            total_actividades: actividades?.length || 0,
            actividades_completadas: actividadesEnviadas.length || 0,
            horas_registradas: estadisticas?.horas_registradas || 0,
            usuarios_asignados: estadisticas?.usuarios_asignados || [],
            documentos: documentos || [],
            ultima_actividad: estadisticas?.ultima_actividad || {
              descripcion: 'Proyecto iniciado',
              fecha: proyectoData.fecha_creacion,
              usuario: 'Sistema',
              estado: 'completado'
            }
          };
          
          setProyecto(proyectoEnriquecido);
        } else {
          navigate('/portal-proyectos');
        }
      } catch (error) {
        navigate('/portal-proyectos');
      } finally {
        setCargando(false);
      }
    };
    
    fetchProyecto();
  }, [id, navigate]);
  
  // Función para refrescar datos del proyecto sin recargar la página
  const refreshProyectoData = async () => {
    if (!id) return;
    
    try {
      // Obtener datos básicos del proyecto
      const proyectoData = await ProyectosService.getProyectoDetalle(id);
      
      if (proyectoData) {
        // Obtener estadísticas del proyecto
        const estadisticas = await ProyectosService.getEstadisticasProyecto(id);
        
        // Obtener actividades para contar las completadas
        const actividades = await ProyectosService.getActividadesProyecto(id);
        const actividadesEnviadas = actividades?.filter(act => act.estado === 'enviado') || [];
        
        // Crear un objeto enriquecido con datos actualizados
        const proyectoActualizado = {
          ...proyectoData,
          progreso: estadisticas?.progreso || proyecto?.progreso || 0,
          total_actividades: actividades?.length || 0,
          actividades_completadas: actividadesEnviadas.length || 0,
          horas_registradas: estadisticas?.horas_registradas || 0,
          usuarios_asignados: estadisticas?.usuarios_asignados || proyecto?.usuarios_asignados || [],
          documentos: proyecto?.documentos || [],
          ultima_actividad: estadisticas?.ultima_actividad || proyecto?.ultima_actividad
        };
        
        setProyecto(proyectoActualizado);
        mostrarSnackbar('Información del proyecto actualizada', 'success');
      }
    } catch (error) {
      mostrarSnackbar('Error al actualizar los datos del proyecto', 'error');
    }
  };
  
  // Cambiar sección
  const handleCambiarSeccion = (seccion: string) => {
    setSeccionActual(seccion);
    
    // Solo refrescar actividades si es necesario, sin mostrar notificaciones
    if (seccion === 'actividades') {
      // Refrescar actividades al cambiar a esta sección
      setRefreshActividades(true);
      setTimeout(() => setRefreshActividades(false), 300);
    }
  };
  
  // Función para obtener color según estado
  const getColorEstado = (estado: string) => {
    switch(estado) {
      case 'planificado':
        return theme.palette.info.main;
      case 'en_progreso':
        return theme.palette.primary.main;
      case 'completado':
        return theme.palette.success.main;
      case 'cancelado':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };
  
  // Función para obtener etiqueta de estado
  const getEtiquetaEstado = (estado: string) => {
    switch(estado) {
      case 'planificado': return 'Planificado';
      case 'en_progreso': return 'En Progreso';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      default: return 'Desconocido';
    }
  };
  
  // Función para abrir modal de detalle de actividad
  const handleVerDetalleActividad = (actividadId: string) => {
    console.log("Mostrar actividad:", actividadId);
    setActiveActividadId(actividadId);
    // Si estamos en otra sección, cambiar a la sección de actividades
    if (seccionActual !== 'actividades') {
      setSeccionActual('actividades');
    }
  };
  
  // Renderizar contenido según sección activa
  const renderContenidoSeccion = () => {
    if (!proyecto) return null;
    
    switch(seccionActual) {
      case 'resumen':
        return <ResumenTab 
          proyecto={proyecto} 
          formatearFecha={formatearFecha} 
          colorEstado={colorEstado} 
          getEtiquetaEstado={getEtiquetaEstado}
          onVerDetalleActividad={handleVerDetalleActividad}
        />;
      case 'actividades':
        return <ActividadesTab 
          proyecto={proyecto} 
          onRegistrarActividad={() => setModalActividadAbierto(true)} 
          shouldRefresh={refreshActividades}
          actividadIdParaVer={activeActividadId}
          onCerrarDetalleActividad={() => setActiveActividadId(null)}
        />;
      case 'documentos':
        return <DocumentosTab proyecto={proyecto} />;
      case 'recursos':
        return <RecursosTab proyecto={proyecto} />;
      case 'comentarios':
        return <ComentariosTab proyecto={proyecto} />;
      default:
        return <ResumenTab 
          proyecto={proyecto} 
          formatearFecha={formatearFecha} 
          colorEstado={colorEstado} 
          getEtiquetaEstado={getEtiquetaEstado}
          onVerDetalleActividad={handleVerDetalleActividad}
        />;
    }
  };
  
  if (cargando) {
    return <CargandoProyecto />;
  }
  
  if (!proyecto) {
    return <ProyectoNoEncontrado />;
  }
  
  // Calcular color según estado
  const colorEstado = getColorEstado(proyecto.estado);
  
  return (
    <Box sx={{ pb: 4, maxWidth: '1400px', mx: 'auto', mt: -1 }}>
      {/* Navegación y contenido principal */}
      <Box sx={{ width: '100%' }}>
        {/* Navegación con botón de retorno */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 3 
        }}>
          <Tabs
            value={seccionActual}
            onChange={(_, newValue) => handleCambiarSeccion(newValue)}
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
              flex: 1,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                minHeight: 48,
                borderRadius: '8px 8px 0 0'
              }
            }}
          >
            {secciones.map((seccion) => (
              <Tab
                key={seccion.id}
                value={seccion.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {React.cloneElement(seccion.icon, {
                      sx: { fontSize: '1.2rem' }
                    })}
                    <span>{seccion.texto}</span>
                  </Box>
                }
              />
            ))}
          </Tabs>
          
          <Tooltip title="Volver a Proyectos" arrow>
            <Button
              size="small"
              onClick={() => navigate('/portal-proyectos')}
              startIcon={<ArrowBackIcon />}
              sx={{
                ml: 2,
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08)
                },
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              Volver
            </Button>
          </Tooltip>
        </Box>

        {/* Contenido principal */}
        <Paper
          component={motion.div}
          key={seccionActual}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '0 0 24px 24px',
            boxShadow: `0 10px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderTop: 'none'
          }}
        >
          {renderContenidoSeccion()}
        </Paper>
      </Box>
      
      {/* Modal para crear actividad */}
      <Dialog
        open={modalActividadAbierto}
        onClose={() => setModalActividadAbierto(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: 'background.paper',
          }
        }}
      >
        <CrearActividad 
          open={modalActividadAbierto}
          onClose={() => setModalActividadAbierto(false)}
          onSuccess={() => {
            setModalActividadAbierto(false);
            // Actualizar datos del proyecto
            refreshProyectoData();
            // Activar actualización de la lista de actividades
            setRefreshActividades(true);
            
            // Mostrar notificación de éxito
            mostrarSnackbar('Actividad registrada exitosamente', 'success');
            
            // Resetear el flag después de un corto periodo
            setTimeout(() => setRefreshActividades(false), 300);
          }}
          proyectoId={id}
          proyectoNombre={proyecto?.nombre}
        />
      </Dialog>
      
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
    </Box>
  );
};

export default DetalleProyecto;