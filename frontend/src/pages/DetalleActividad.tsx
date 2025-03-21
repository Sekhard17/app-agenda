import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Button,
  useTheme,
  alpha,
  Skeleton,
  Avatar,
  IconButton,
  Breadcrumbs,
  Link,
  Fade,
  useMediaQuery
} from '@mui/material';
import { 
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  Flag as FlagIcon,
  Home as HomeIcon,
  Assignment as AssignmentIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ActividadesService from '../services/actividades.service';
import { Actividad } from '../services/actividades.service';

const DetalleActividad = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estados
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar los detalles de la actividad
  useEffect(() => {
    const cargarActividad = async () => {
      if (!id) return;
      
      try {
        setCargando(true);
        const actividad = await ActividadesService.getActividadPorId(id);
        setActividad(actividad);
      } catch (error) {
        console.error('Error al cargar actividad:', error);
        setError('No se pudo cargar la información de la actividad');
      } finally {
        setCargando(false);
      }
    };
    
    cargarActividad();
  }, [id]);

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd MMMM yyyy', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
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
  const obtenerColorEstado = (estado: string | undefined) => {
    if (!estado) return theme.palette.grey[500];
    
    switch (estado.toLowerCase()) {
      case 'completada':
        return theme.palette.success.main;
      case 'en_progreso':
      case 'en progreso':
        return theme.palette.primary.main;
      case 'pendiente':
        return theme.palette.warning.main;
      case 'cancelada':
        return theme.palette.error.main;
      case 'enviado':
        return theme.palette.info.main;
      case 'borrador':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Obtener etiqueta de estado
  const obtenerEtiquetaEstado = (estado: string | undefined) => {
    if (!estado) return 'Sin estado';
    
    switch (estado.toLowerCase()) {
      case 'completada':
        return 'Completada';
      case 'en_progreso':
      case 'en progreso':
        return 'En Progreso';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelada':
        return 'Cancelada';
      case 'enviado':
        return 'Enviado';
      case 'borrador':
        return 'Borrador';
      default:
        return estado;
    }
  };

  // Renderizar contenido de carga
  const renderizarCargando = () => (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="60%" height={40} sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '16px', mb: 3 }} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '16px', mb: 3 }} />
        </Grid>
      </Grid>
      <Skeleton variant="rectangular" height={150} sx={{ borderRadius: '16px', mb: 3 }} />
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '16px' }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // Renderizar error
  const renderizarError = () => (
    <Box sx={{ 
      p: 5, 
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh'
    }}>
      <Typography variant="h5" color="error" gutterBottom>
        {error || 'No se pudo cargar la información de la actividad'}
      </Typography>
      <Button 
        variant="contained" 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate(-1)}
        sx={{ mt: 3 }}
      >
        Volver
      </Button>
    </Box>
  );

  // Renderizar contenido principal
  const renderizarContenido = () => {
    if (!actividad) return null;

    return (
      <Fade in={!cargando} timeout={500}>
        <Box>
          {/* Header con fecha y estado */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <Chip 
                icon={<CheckCircleIcon />}
                label={obtenerEtiquetaEstado(actividad.estado)} 
                size="medium"
                sx={{ 
                  bgcolor: alpha(obtenerColorEstado(actividad.estado), 0.12),
                  color: obtenerColorEstado(actividad.estado),
                  fontWeight: 500,
                  borderRadius: '8px',
                  height: '32px',
                  '& .MuiChip-icon': {
                    color: 'inherit',
                    fontSize: '1.2rem'
                  }
                }}
              />
              {actividad.prioridad && (
                <Chip 
                  icon={<FlagIcon />}
                  label={actividad.prioridad} 
                  size="medium"
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.12),
                    color: theme.palette.warning.main,
                    fontWeight: 500,
                    borderRadius: '8px',
                    height: '32px',
                    '& .MuiChip-icon': {
                      color: 'inherit',
                      fontSize: '1.2rem'
                    }
                  }}
                />
              )}
              <Typography variant="body2" sx={{ 
                ml: 'auto',
                color: theme.palette.text.secondary,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CalendarTodayIcon sx={{ fontSize: 18 }} />
                {actividad.fecha ? formatearFecha(actividad.fecha) : 'Fecha no especificada'}
              </Typography>
            </Box>

            {/* Título y descripción */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: '16px',
                background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.primary.main, 0.01)})`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.05)}`,
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.08)}`,
                }
              }}
            >
              <Typography variant="h4" sx={{ 
                fontWeight: 600, 
                mb: 2,
                letterSpacing: '-0.02em',
                color: alpha(theme.palette.text.primary, 0.9),
              }}>
                {actividad.nombre || actividad.descripcion || 'Actividad sin título'}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.8),
                lineHeight: 1.6,
                whiteSpace: 'pre-line'
              }}>
                {actividad.descripcion || 'Sin descripción'}
              </Typography>
            </Paper>
          </Box>

          {/* Información principal en Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Detalles temporales */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  background: `linear-gradient(to right, ${alpha(theme.palette.success.main, 0.03)}, ${alpha(theme.palette.success.main, 0.01)})`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.08)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.1)}`,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      color: theme.palette.success.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <CalendarTodayIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Fecha
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {actividad.fecha ? formatearFecha(actividad.fecha) : 'No especificada'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {actividad.fecha ? 
                        `Día de la semana: ${format(new Date(actividad.fecha), 'EEEE', { locale: es })}` : 
                        'Fecha no disponible'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Horario */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  background: `linear-gradient(to right, ${alpha(theme.palette.info.main, 0.03)}, ${alpha(theme.palette.info.main, 0.01)})`,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.08)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.1)}`,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.08),
                      color: theme.palette.info.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <AccessTimeIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Horario
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {actividad.hora_inicio && actividad.hora_fin ? 
                        `${formatearHora(actividad.hora_inicio)} - ${formatearHora(actividad.hora_fin)}` : 
                        'No especificado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Duración: {actividad.duracion || 0} horas
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Proyecto */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  background: `linear-gradient(to right, ${alpha(theme.palette.warning.main, 0.03)}, ${alpha(theme.palette.warning.main, 0.01)})`,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.08)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.1)}`,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.warning.main, 0.08),
                      color: theme.palette.warning.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <FolderIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Proyecto
                    </Typography>
                    <Typography variant="h6" fontWeight="medium" sx={{ 
                      wordBreak: 'break-word',
                      maxWidth: '100%' 
                    }}>
                      {actividad.proyectos ? actividad.proyectos.nombre : 'No especificado'}
                    </Typography>
                    {actividad.proyectos && actividad.proyectos.hasOwnProperty('codigo') && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Código: {(actividad.proyectos as any).codigo}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Información adicional */}
          {(actividad.observaciones || actividad.resultados) && (
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 3,
                borderRadius: '16px',
                background: `linear-gradient(to right, ${alpha(theme.palette.grey[500], 0.03)}, ${alpha(theme.palette.grey[500], 0.01)})`,
                border: `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
              }}
            >
              <Typography variant="h6" sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: theme.palette.primary.main,
                fontWeight: 600
              }}>
                <DescriptionIcon sx={{ color: 'inherit' }} />
                Información Adicional
              </Typography>
              
              <Grid container spacing={3}>
                {actividad.observaciones && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                        Observaciones
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        whiteSpace: 'pre-line',
                        p: 2,
                        borderRadius: '8px',
                        backgroundColor: alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        lineHeight: 1.6
                      }}>
                        {actividad.observaciones}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {actividad.resultados && (
                  <Grid item xs={12} md={actividad.observaciones ? 6 : 12}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                        Resultados
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        whiteSpace: 'pre-line',
                        p: 2,
                        borderRadius: '8px',
                        backgroundColor: alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        lineHeight: 1.6
                      }}>
                        {actividad.resultados}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Usuario asignado */}
          {actividad.usuarios && (
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 3,
                borderRadius: '16px',
                background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.primary.main, 0.01)})`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 64,
                  height: 64,
                  fontSize: '1.5rem',
                  fontWeight: 600
                }}
              >
                {actividad.usuarios.nombres && actividad.usuarios.nombres[0]}
                {actividad.usuarios.appaterno && actividad.usuarios.appaterno[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="600">
                  {`${actividad.usuarios.nombres || ''} ${actividad.usuarios.appaterno || ''} ${actividad.usuarios.apmaterno || ''}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {actividad.usuarios.hasOwnProperty('rol') ? (actividad.usuarios as any).rol === 'funcionario' ? 'Funcionario' : 'Supervisor' : 'Usuario'}
                </Typography>
                {actividad.usuarios.hasOwnProperty('email') && (
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {(actividad.usuarios as any).email}
                  </Typography>
                )}
              </Box>
            </Paper>
          )}

          {/* Botones de acción */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                borderRadius: '10px',
                py: 1.2,
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: alpha(theme.palette.divider, 0.3),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}
            >
              Volver
            </Button>
          </Box>
        </Box>
      </Fade>
    );
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 2, sm: 3 } }}>
      {/* Breadcrumb */}
      <Box
        sx={{
          display: 'flex',
          mb: 3,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 2 : 0
        }}
      >
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{
            '& .MuiBreadcrumbs-ol': {
              alignItems: 'center',
            }
          }}
        >
          <Link
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              '&:hover': {
                color: theme.palette.primary.main,
              }
            }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
            Inicio
          </Link>
          <Link
            component={RouterLink}
            to="/revision-actividades"
            color="inherit"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              '&:hover': {
                color: theme.palette.primary.main,
              }
            }}
          >
            <AssignmentIcon sx={{ mr: 0.5, fontSize: 20 }} />
            Revisión de Actividades
          </Link>
          <Typography
            color="text.primary"
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
            }}
          >
            Detalle de Actividad
          </Typography>
        </Breadcrumbs>

        {isMobile && actividad && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
            <IconButton
              size="small"
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1 }}>
              {actividad.nombre || actividad.descripcion || 'Detalle de actividad'}
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Contenido principal */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        {cargando ? renderizarCargando() : error ? renderizarError() : renderizarContenido()}
      </Paper>
    </Box>
  );
};

export default DetalleActividad; 