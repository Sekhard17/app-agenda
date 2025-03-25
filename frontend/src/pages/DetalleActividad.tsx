import { useState, useEffect, useRef } from 'react';
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
  Card,
  CardContent,
  Tab,
  Tabs,
  TextField,
  Container
} from '@mui/material';
import { 
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Domain as DomainIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  AttachFile as AttachFileIcon,
  Comment as CommentIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ActividadesService from '../services/actividades.service';
import { Actividad } from '../services/actividades.service';
import DocumentosService, { Documento } from '../services/documentos.service';
import DocumentosSelector from '../components/documentos/DocumentosSelector';
import ComentariosActividad, { ComentariosActividadRef } from '../components/comentarios/ComentariosActividad';
import ComentariosService from '../services/comentarios.service';
import { useAuth } from '../context/AuthContext';

// Interface para las pestañas
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Componente para mostrar el contenido de cada pestaña
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`activity-tabpanel-${index}`}
      aria-labelledby={`activity-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Función para obtener propiedades de accesibilidad de pestañas
const a11yProps = (index: number) => {
  return {
    id: `activity-tab-${index}`,
    'aria-controls': `activity-tabpanel-${index}`,
  };
};

const DetalleActividad = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  
  // Estado para las pestañas
  const [tabValue, setTabValue] = useState(0);
  
  // Estados
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para documentos
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargandoDocumentos, setCargandoDocumentos] = useState(false);
  const [errorDocumentos, setErrorDocumentos] = useState<string | null>(null);
  
  // Estados para comentarios
  const [comentario, setComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [errorComentario, setErrorComentario] = useState<string | null>(null);
  
  // Referencia para el componente de comentarios
  const comentariosRef = useRef<ComentariosActividadRef>(null);

  // Estilos comunes para las cards
  const cardStyles = {
    mb: 3, 
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: 3,
    transition: 'all 0.3s ease',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(10px)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
    }
  };

  // Estilos para los chips
  const chipStyles = (color: string) => ({
    borderRadius: 2,
    bgcolor: alpha(color, 0.1),
    color: color,
    fontWeight: 500,
    '& .MuiChip-icon': {
      color: 'inherit'
    },
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: alpha(color, 0.2),
    }
  });

  // Cargar los detalles de la actividad
  useEffect(() => {
    const cargarActividad = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };
    
    cargarActividad();
  }, [id]);

  // Cargar los documentos de la actividad
  useEffect(() => {
    const fetchDocumentos = async () => {
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
      fetchDocumentos();
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

  // Manejar el cambio de pestaña
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Enviar un nuevo comentario
  const enviarComentario = async () => {
    if (!comentario.trim() || !id || !usuario) return;
    
    try {
      setEnviandoComentario(true);
      setErrorComentario(null);
      
      await ComentariosService.crearComentario({
        id_actividad: id,
        contenido: comentario.trim()
      });
      
      // Limpiar el campo después de enviar
      setComentario('');
      
      // Actualizar la lista de comentarios en tiempo real
      if (comentariosRef.current) {
        await comentariosRef.current.cargarComentarios();
      }
      
      // Cambiar a la pestaña de comentarios si no estamos en ella
      if (tabValue !== 1) {
        setTabValue(1);
      }
    } catch (error: any) {
      console.error('Error al enviar comentario:', error);
      setErrorComentario(error.message || 'No se pudo enviar el comentario');
    } finally {
      setEnviandoComentario(false);
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
    </Box>
  );

  // Renderizar error
  const renderizarError = () => (
    <Box sx={{ p: 5, textAlign: 'center' }}>
      <Typography variant="h5" color="error" gutterBottom>
        {error || 'No se pudo cargar la información de la actividad'}
      </Typography>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
        Volver
      </Button>
    </Box>
  );

  // Renderizar contenido
  const renderizarContenido = () => {
    if (!actividad) return null;

    return (
      <Box>
        {/* Encabezado de la actividad con información básica */}
        <Box 
          sx={{ 
            p: 2.5, 
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            position: 'relative',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  gap: 0.75,
                  alignItems: 'center'
                }}
              >
                <Chip
                  icon={<CalendarTodayIcon />}
                  label={formatearFecha(actividad.fecha)}
                  size="small"
                  sx={chipStyles(obtenerColorEstado(actividad.estado))}
                />
                
                <Chip
                  icon={<AccessTimeIcon />}
                  label={`${formatearHora(actividad.hora_inicio)} - ${formatearHora(actividad.hora_fin)}`}
                  size="small"
                  sx={chipStyles(theme.palette.info.main)}
                />
                
                <Chip
                  icon={<FolderIcon />}
                  label={actividad.proyectos?.nombre || 'Sin proyecto'}
                  size="small"
                  sx={chipStyles(obtenerColorEstado(actividad.estado))}
                />
                
                <Chip
                  label={obtenerEtiquetaEstado(actividad.estado)}
                  size="small"
                  sx={chipStyles(obtenerColorEstado(actividad.estado))}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
              }}>
                <Typography 
                  variant="body2" 
                  color="textSecondary"
                  sx={{ 
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                  Duración:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  {calcularDuracion()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* Sistema de pestañas */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, 0.6),
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
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
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 56,
                px: 4,
                color: alpha(theme.palette.text.primary, 0.7),
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                }
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon fontSize="small" />
                  <span>Detalles</span>
                </Box>
              } 
              {...a11yProps(0)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CommentIcon fontSize="small" />
                  <span>Comentarios</span>
                </Box>
              } 
              {...a11yProps(1)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFileIcon fontSize="small" />
                  <span>Documentos</span>
                </Box>
              } 
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>

        {/* Contenido de cada pestaña */}
        <Box sx={{ p: 4 }}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Información personal */}
              <Grid item xs={12}>
                <Card sx={cardStyles}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        fontWeight: 600,
                        mb: 2, 
                        color: theme.palette.text.primary
                      }}
                    >
                      <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      Información del Funcionario
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{ 
                              bgcolor: theme.palette.primary.main,
                              width: 40,
                              height: 40,
                              mr: 2
                            }}
                          >
                            {actividad.usuarios?.nombres?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {actividad.usuarios?.nombres || ''} {actividad.usuarios?.appaterno || ''}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {actividad.usuarios?.nombre_usuario ? 'Funcionario' : 'Supervisor'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <EmailIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                          <Typography variant="body2">
                            Correo no disponible
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <DomainIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                          <Typography variant="body2">
                            Departamento no disponible
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Detalles de actividad */}
              <Grid item xs={12} md={8}>
                <Card sx={cardStyles}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        fontWeight: 600,
                        mb: 2, 
                        color: theme.palette.text.primary
                      }}
                    >
                      <DescriptionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      Detalles de la Actividad
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Descripción:
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {actividad.descripcion || 'Sin descripción'}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Fecha:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1, fontSize: '1.2rem', color: theme.palette.primary.main }} />
                          <Typography variant="body2">
                            {formatearFecha(actividad.fecha)}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Horario:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ mr: 1, fontSize: '1.2rem', color: theme.palette.primary.main }} />
                          <Typography variant="body2">
                            {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_fin)}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Tipo:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon sx={{ mr: 1, fontSize: '1.2rem', color: theme.palette.primary.main }} />
                          <Typography variant="body2">
                            {actividad.id_tipo_actividad || 'Tipo de actividad no especificado'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Información del proyecto */}
              <Grid item xs={12} md={4}>
                <Card sx={cardStyles}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        fontWeight: 600,
                        mb: 2, 
                        color: theme.palette.text.primary
                      }}
                    >
                      <FolderIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      Información del Proyecto
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Proyecto:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        paragraph
                        component={RouterLink}
                        to={`/proyecto/${actividad.id_proyecto || ''}`}
                        sx={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {actividad.proyectos?.nombre || 'Sin nombre'}
                      </Typography>
                    </Box>
                    
                    {actividad.proyectos?.nombre && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Descripción del proyecto:
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Descripción no disponible
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '60vh',
              position: 'relative'
            }}>
              {/* Lista de comentarios con scroll */}
              <Box sx={{ 
                flex: 1,
                overflow: 'auto',
                mb: 2,
                pr: 2,
                mr: -2, // Compensar el padding para el scrollbar
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  }
                }
              }}>
                {id && <ComentariosActividad idActividad={id} ref={comentariosRef} />}
              </Box>

              {/* Campo de comentarios fijo en la parte inferior */}
              <Card 
                sx={{
                  ...cardStyles,
                  mb: 0,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 1,
                  boxShadow: `0 -4px 20px ${alpha(theme.palette.common.black, 0.05)}`
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={1}
                      placeholder="Escribe un comentario..."
                      variant="outlined"
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      error={!!errorComentario}
                      helperText={errorComentario}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.paper, 0.8),
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.background.paper, 0.9),
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                          },
                          '&.Mui-focused': {
                            backgroundColor: alpha(theme.palette.background.paper, 1),
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                          },
                          '&.Mui-error': {
                            borderColor: theme.palette.error.main,
                            backgroundColor: alpha(theme.palette.error.main, 0.05),
                          }
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<SendIcon />}
                      onClick={enviarComentario}
                      disabled={!comentario.trim() || enviandoComentario}
                      sx={{ 
                        minWidth: 'auto',
                        px: 3,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                        }
                      }}
                    >
                      {enviandoComentario ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Card sx={cardStyles}>
              <CardContent sx={{ p: 3 }}>
                <DocumentosSelector 
                  actividadId={actividad.id}
                  documentos={documentos}
                  cargando={cargandoDocumentos}
                  error={errorDocumentos ? errorDocumentos : undefined}
                  disabled={true}
                />
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 4, pt: 2 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(20px)',
          }}
        >
          {loading ? renderizarCargando() : error ? renderizarError() : renderizarContenido()}
        </Paper>
      </Box>
    </Container>
  );
};

export default DetalleActividad; 