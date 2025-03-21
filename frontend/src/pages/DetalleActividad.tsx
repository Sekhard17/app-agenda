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
  useMediaQuery,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { 
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  Home as HomeIcon,
  Assignment as AssignmentIcon,
  NavigateNext as NavigateNextIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Domain as DomainIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ActividadesService from '../services/actividades.service';
import { Actividad } from '../services/actividades.service';
import DocumentosService, { Documento } from '../services/documentos.service';
import DocumentosSelector from '../components/documentos/DocumentosSelector';

const DetalleActividad = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estados
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para documentos
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargandoDocumentos, setCargandoDocumentos] = useState(false);
  const [errorDocumentos, setErrorDocumentos] = useState<string | null>(null);

  // Cargar los detalles de la actividad
  useEffect(() => {
    const cargarActividad = async () => {
      if (!id) return;
      
      try {
        setCargando(true);
        const respuesta = await ActividadesService.getActividadPorId(id);
        console.log("Respuesta completa:", JSON.stringify(respuesta));
        
        // Verificar si la respuesta tiene la estructura anidada
        if (respuesta && (respuesta as any).actividad) {
          console.log("Actividad extraída:", (respuesta as any).actividad);
          setActividad((respuesta as any).actividad);
        } else {
          console.log("Formato inesperado:", respuesta);
          setActividad(respuesta); // Intentar usar la respuesta directamente como fallback
        }
      } catch (error) {
        console.error('Error al cargar actividad:', error);
        setError('No se pudo cargar la información de la actividad');
      } finally {
        setCargando(false);
      }
    };
    
    cargarActividad();
  }, [id]);

  // Cargar los documentos de la actividad
  useEffect(() => {
    const cargarDocumentos = async () => {
      if (!actividad || !actividad.id) return;
      
      try {
        setCargandoDocumentos(true);
        // Añadir un pequeño retraso para mostrar el estado de carga
        await new Promise(resolve => setTimeout(resolve, 600));
        const documentosData = await DocumentosService.getDocumentosPorActividad(actividad.id);
        console.log('Documentos cargados:', documentosData);
        setDocumentos(documentosData);
      } catch (error) {
        console.error('Error al cargar documentos:', error);
        setErrorDocumentos('No se pudieron cargar los documentos asociados');
      } finally {
        setCargandoDocumentos(false);
      }
    };
    
    if (actividad) {
      cargarDocumentos();
    }
  }, [actividad]);

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd MMMM yyyy', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  // Formatear hora
  const formatearHora = (hora: string | undefined | null) => {
    if (!hora) return '-';
    
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

  // Calcular duración
  const calcularDuracion = () => {
    if (!actividad) return '0 horas';
    if (!actividad.hora_inicio || !actividad.hora_fin) return '0 horas';
    
    try {
      const inicio = new Date(`2000-01-01T${actividad.hora_inicio}`);
      const fin = new Date(`2000-01-01T${actividad.hora_fin}`);
      
      const duracionMs = fin.getTime() - inicio.getTime();
      const duracionHoras = duracionMs / (1000 * 60 * 60);
      
      return duracionHoras === 1 ? '1 hora' : `${duracionHoras} horas`;
    } catch (error) {
      console.error('Error al calcular duración:', error);
      return '0 horas';
    }
  };

  // Renderizar cargando
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
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={8}>
                <Card 
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.02)})`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.05)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.08)}`,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '5px',
                      background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        icon={<CheckCircleIcon />}
                        label={obtenerEtiquetaEstado(actividad.estado)} 
                        size="medium"
                        sx={{ 
                          bgcolor: alpha(obtenerColorEstado(actividad.estado), 0.12),
                          color: obtenerColorEstado(actividad.estado),
                          fontWeight: 600,
                          borderRadius: '8px',
                          height: '32px',
                          '& .MuiChip-icon': {
                            color: 'inherit',
                            fontSize: '1.2rem'
                          }
                        }}
                      />
                      <Chip 
                        icon={<CalendarTodayIcon />}
                        label={actividad.fecha ? formatearFecha(actividad.fecha) : 'Fecha no especificada'}
                        size="medium"
                        sx={{ 
                          bgcolor: alpha(theme.palette.success.main, 0.12),
                          color: theme.palette.success.main,
                          fontWeight: 600,
                          borderRadius: '8px',
                          height: '32px',
                          '& .MuiChip-icon': {
                            color: 'inherit',
                            fontSize: '1.2rem'
                          }
                        }}
                      />
                    </Box>

                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      mb: 2,
                      letterSpacing: '-0.02em',
                      color: alpha(theme.palette.text.primary, 0.95),
                      lineHeight: 1.3
                    }}>
                      {actividad.descripcion || 'Actividad sin título'}
                    </Typography>

                    <Typography variant="body1" sx={{ 
                      color: alpha(theme.palette.text.secondary, 0.9),
                      lineHeight: 1.6,
                      mb: 2
                    }}>
                      {actividad.descripcion || 'Sin descripción'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                          {actividad.hora_inicio || actividad.hora_fin ? 
                            `${formatearHora(actividad.hora_inicio || '-')} - ${formatearHora(actividad.hora_fin || '-')} (${calcularDuracion()})` : 
                            '- (0 horas)'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DomainIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                          {actividad.proyectos && actividad.proyectos.nombre ? actividad.proyectos.nombre : 'Sin proyecto'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card 
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.main, 0.02)})`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.08)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.05)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '5px',
                      background: `linear-gradient(to right, ${theme.palette.info.main}, ${theme.palette.info.light})`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          fontSize: '1.8rem',
                          fontWeight: 700,
                          bgcolor: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                          border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`
                        }}
                      >
                        {actividad.usuarios && actividad.usuarios.nombres ? actividad.usuarios.nombres[0] : ''}
                        {actividad.usuarios && actividad.usuarios.appaterno ? actividad.usuarios.appaterno[0] : ''}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2 }}>
                          {actividad.usuarios ? 
                            `${actividad.usuarios.nombres || ''} ${actividad.usuarios.appaterno || ''}` : 
                            'Usuario no asignado'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                          {actividad.usuarios && actividad.usuarios.nombre_usuario ? actividad.usuarios.nombre_usuario : 'Sin usuario'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.divider, 0.1) }} />
                    
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.text.secondary, 
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <EmailIcon sx={{ fontSize: 16 }} />
                        {(actividad.usuarios as any)?.email || 'Sin correo registrado'}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.text.secondary,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <FolderIcon sx={{ fontSize: 16 }} />
                        {actividad.id_tipo_actividad || 'Sin tipo'}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.text.secondary,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <InfoIcon sx={{ fontSize: 16 }} />
                        ID: {actividad.id?.substring(0, 8) || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Chip 
                        label={`Creado: ${actividad.fecha_creacion ? format(new Date(actividad.fecha_creacion), 'dd/MM/yyyy HH:mm') : 'Fecha no disponible'}`}
                        size="small"
                        sx={{ 
                          width: '100%',
                          justifyContent: 'flex-start',
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Información detallada en tarjetas */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ 
              mb: 2, 
              fontWeight: 700,
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <DescriptionIcon sx={{ color: theme.palette.primary.main }} />
              Detalles de la Actividad
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{
                  borderRadius: '16px',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  background: `linear-gradient(145deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.main, 0.02)})`,
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          width: 48,
                          height: 48,
                        }}
                      >
                        <CalendarTodayIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme.palette.success.main }}>
                          Fecha
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {actividad.fecha ? formatearFecha(actividad.fecha) : 'No especificada'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {actividad.fecha ? 
                            `${format(new Date(actividad.fecha), 'EEEE', { locale: es })}` : 
                            'Fecha no disponible'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{
                  borderRadius: '16px',
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  background: `linear-gradient(145deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.main, 0.02)})`,
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.15)}`,
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                          width: 48,
                          height: 48,
                        }}
                      >
                        <AccessTimeIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme.palette.info.main }}>
                          Horario
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {actividad.hora_inicio && actividad.hora_fin ? 
                            `${formatearHora(actividad.hora_inicio)} - ${formatearHora(actividad.hora_fin)}` : 
                            'No especificado'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Duración: {calcularDuracion()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{
                  borderRadius: '16px',
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                  background: `linear-gradient(145deg, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.warning.main, 0.02)})`,
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.15)}`,
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          color: theme.palette.warning.main,
                          width: 48,
                          height: 48,
                        }}
                      >
                        <FolderIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme.palette.warning.main }}>
                          Proyecto
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600, 
                          fontSize: '1.1rem',
                          wordBreak: 'break-word'
                        }}>
                          {actividad.proyectos && actividad.proyectos.nombre ? 
                            actividad.proyectos.nombre : 
                            'No especificado'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          ID: {actividad.id_proyecto ? actividad.id_proyecto.substring(0, 8) : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Sistema de actividad (si existe) */}
          {actividad.sistema && (
            <Box sx={{ mb: 4 }}>
              <Card 
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  background: `linear-gradient(to right, ${alpha(theme.palette.grey[500], 0.05)}, ${alpha(theme.palette.grey[500], 0.02)})`,
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
                  p: 3
                }}
              >
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: theme.palette.text.primary,
                  fontWeight: 700
                }}>
                  <DomainIcon sx={{ color: theme.palette.secondary.main }} />
                  Sistema
                </Typography>
                <Typography variant="body1">
                  {actividad.sistema}
                </Typography>
              </Card>
            </Box>
          )}

          {/* Documentos de la actividad */}
          <Box sx={{ mb: 4 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: '16px',
                background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.primary.main, 0.01)})`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  mb: 3, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: theme.palette.text.primary,
                  fontWeight: 700
                }}>
                  <AttachFileIcon sx={{ color: theme.palette.primary.main }} />
                  Documentos Asociados
                </Typography>
                
                <DocumentosSelector
                  actividadId={actividad.id}
                  documentos={documentos}
                  onDocumentosChange={setDocumentos}
                  cargando={cargandoDocumentos}
                  disabled={true}
                  label=""
                  error={errorDocumentos || undefined}
                />
              </CardContent>
            </Card>
          </Box>

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
              {actividad.descripcion || 'Detalle de actividad'}
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