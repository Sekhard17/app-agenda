import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Avatar,
  Tooltip,
  useTheme,
  Snackbar,
  Alert,
  Chip,
  AvatarGroup,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos
interface Actividad {
  id: string;
  descripcion: string;
  fecha: string | Date;
  usuarios?: {
    id: string;
    nombres: string;
    appaterno: string;
    avatar?: string;
  };
}

interface Documento {
  id: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo?: string;
  tamaño_bytes?: number;
  fecha_creacion: string | Date;
  usuario_id?: string;
  actividades?: Actividad;
}

interface DocumentosVisualizadorProps {
  documentos: Documento[];
  cargando: boolean;
  mostrarEncabezado?: boolean;
  onSubirDocumento?: () => void;
  titulo?: string;
  mensajeVacio?: string;
  permitirAgrupacion?: boolean;
}

// Formatear fecha
const formatearFecha = (fecha: string | Date | null | undefined): string => {
  if (!fecha) return 'No definida';
  return format(new Date(fecha), 'dd MMMM yyyy', { locale: es });
};

const DocumentosVisualizador: React.FC<DocumentosVisualizadorProps> = ({
  documentos,
  cargando,
  mostrarEncabezado = true,
  onSubirDocumento,
  titulo = "Documentos",
  mensajeVacio = "No hay documentos disponibles.",
  permitirAgrupacion = true
}) => {
  const theme = useTheme();
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'normal' | 'agrupada'>('normal');
  
  // Función para determinar el icono según el tipo de archivo
  const getIconoPorTipo = (tipo: string | undefined) => {
    if (!tipo) return <DescriptionIcon />;
    
    if (tipo.includes('pdf')) {
      return <DescriptionIcon sx={{ color: theme.palette.error.main }} />;
    } else if (tipo.includes('word') || tipo.includes('document')) {
      return <DescriptionIcon sx={{ color: theme.palette.primary.main }} />;
    } else if (tipo.includes('excel') || tipo.includes('sheet')) {
      return <DescriptionIcon sx={{ color: theme.palette.success.main }} />;
    } else if (tipo.includes('image')) {
      return <DescriptionIcon sx={{ color: theme.palette.warning.main }} />;
    } else {
      return <DescriptionIcon />;
    }
  };
  
  // Función para formatear el tamaño del archivo
  const formatearTamano = (tamanoBytes: number) => {
    if (!tamanoBytes) return 'Desconocido';
    
    if (tamanoBytes < 1024) {
      return `${tamanoBytes} B`;
    } else if (tamanoBytes < 1024 * 1024) {
      return `${Math.round(tamanoBytes / 1024)} KB`;
    } else {
      return `${Math.round(tamanoBytes / (1024 * 1024) * 10) / 10} MB`;
    }
  };
  
  // Manejador para cuando ocurre un error al descargar
  const manejarErrorDescarga = () => {
    setErrorDescarga('Error al acceder al archivo. Puede que el archivo ya no esté disponible o no tengas acceso.');
    setTimeout(() => setErrorDescarga(null), 4000);
  };
  
  // Agrupar documentos por actividad
  const documentosPorActividad = React.useMemo(() => {
    if (!documentos || documentos.length === 0) return {};
    
    return documentos.reduce((grupos, doc) => {
      if (!doc.actividades) {
        if (!grupos['sin_actividad']) {
          grupos['sin_actividad'] = {
            titulo: 'Sin actividad asociada',
            documentos: []
          };
        }
        grupos['sin_actividad'].documentos.push(doc);
      } else {
        const actividadId = doc.actividades.id;
        if (!grupos[actividadId]) {
          grupos[actividadId] = {
            titulo: doc.actividades.descripcion,
            fecha: doc.actividades.fecha,
            usuario: doc.actividades.usuarios,
            documentos: []
          };
        }
        grupos[actividadId].documentos.push(doc);
      }
      return grupos;
    }, {} as Record<string, { titulo: string, fecha?: string | Date, usuario?: any, documentos: Documento[] }>);
  }, [documentos]);
  
  // Cambiar el tipo de vista
  const handleCambioVista = (
    event: React.MouseEvent<HTMLElement>,
    nuevaVista: 'normal' | 'agrupada',
  ) => {
    if (nuevaVista !== null) {
      setVistaActual(nuevaVista);
    }
  };
  
  // Renderizar documentos en vista normal
  const renderizarVistaNomal = () => (
    <Grid container spacing={2}>
      {documentos.map((doc) => (
        <Grid item xs={12} sm={6} md={4} key={doc.id}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '16px',
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              transition: 'all 0.2s ease',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
                transform: 'translateY(-3px)',
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 42,
                  height: 42
                }}
              >
                {getIconoPorTipo(doc.tipo_archivo)}
              </Avatar>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Tooltip title={doc.nombre_archivo} arrow placement="top">
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {doc.nombre_archivo}
                  </Typography>
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  {formatearTamano(doc.tamaño_bytes || 0)} • {doc.tipo_archivo?.split('/')[1]?.toUpperCase() || 'Documento'}
                </Typography>
              </Box>
            </Box>
            
            {doc.actividades && (
              <Box sx={{ 
                mt: 1, 
                mb: 2,
                p: 1.5,
                borderRadius: '10px',
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                  <AssignmentIcon 
                    fontSize="small" 
                    sx={{ color: theme.palette.info.main, mt: 0.3 }} 
                  />
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: theme.palette.info.dark
                      }}
                    >
                      {doc.actividades.descripcion}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatearFecha(doc.actividades.fecha)}
                    </Typography>
                  </Box>
                </Box>
                
                {doc.actividades.usuarios && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    mt: 1 
                  }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24,
                        fontSize: '0.8rem',
                        bgcolor: theme.palette.primary.main
                      }}
                    >
                      {doc.actividades.usuarios.nombres?.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {doc.actividades.usuarios.nombres} {doc.actividades.usuarios.appaterno}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mt: 'auto', 
              pt: 2,
              borderTop: `1px dashed ${alpha(theme.palette.divider, 0.15)}`
            }}>
              <Typography variant="caption" color="text.secondary">
                {formatearFecha(doc.fecha_creacion)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                component="a"
                href={doc.ruta_archivo}
                target="_blank"
                onClick={(e) => {
                  // Si la URL no comienza con http o https, prevenir la navegación
                  if (!doc.ruta_archivo || (!doc.ruta_archivo.startsWith('http://') && !doc.ruta_archivo.startsWith('https://'))) {
                    e.preventDefault();
                    manejarErrorDescarga();
                  }
                }}
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                Descargar
              </Button>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
  
  // Renderizar documentos agrupados por actividad
  const renderizarVistaAgrupada = () => (
    <Box>
      {Object.entries(documentosPorActividad).map(([actividadId, grupo]) => (
        <Accordion 
          key={actividadId}
          defaultExpanded
          sx={{ 
            mb: 2,
            borderRadius: '12px',
            overflow: 'hidden',
            '&:before': { display: 'none' },
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.08)}`
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              '&.Mui-expanded': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  color: theme.palette.primary.main
                }}
              >
                <AssignmentIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={500}>
                  {grupo.titulo || 'Sin descripción'}
                </Typography>
                {grupo.fecha && (
                  <Typography variant="caption" color="text.secondary">
                    {formatearFecha(grupo.fecha)} • {grupo.documentos.length} documento{grupo.documentos.length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
              {grupo.usuario && (
                <Chip
                  size="small"
                  avatar={
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24,
                        bgcolor: theme.palette.primary.main
                      }}
                    >
                      {grupo.usuario.nombres?.charAt(0)}
                    </Avatar>
                  }
                  label={`${grupo.usuario.nombres} ${grupo.usuario.appaterno}`}
                  sx={{ 
                    ml: 'auto', 
                    mr: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.9)
                  }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {grupo.documentos.map((doc) => (
                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                      transition: 'all 0.2s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
                        transform: 'translateY(-3px)',
                        borderColor: alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          width: 42,
                          height: 42
                        }}
                      >
                        {getIconoPorTipo(doc.tipo_archivo)}
                      </Avatar>
                      <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <Tooltip title={doc.nombre_archivo} arrow placement="top">
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {doc.nombre_archivo}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary">
                          {formatearTamano(doc.tamaño_bytes || 0)} • {doc.tipo_archivo?.split('/')[1]?.toUpperCase() || 'Documento'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mt: 'auto', 
                      pt: 2,
                      borderTop: `1px dashed ${alpha(theme.palette.divider, 0.15)}`
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatearFecha(doc.fecha_creacion)}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        component="a"
                        href={doc.ruta_archivo}
                        target="_blank"
                        onClick={(e) => {
                          if (!doc.ruta_archivo || (!doc.ruta_archivo.startsWith('http://') && !doc.ruta_archivo.startsWith('https://'))) {
                            e.preventDefault();
                            manejarErrorDescarga();
                          }
                        }}
                        sx={{ 
                          borderRadius: '8px',
                          textTransform: 'none',
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                      >
                        Descargar
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
  
  return (
    <Box>
      {mostrarEncabezado && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          pb: 2
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              fontWeight: 600
            }}
          >
            <DescriptionIcon color="primary" />
            {titulo}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {permitirAgrupacion && documentos.length > 0 && (
              <ToggleButtonGroup
                value={vistaActual}
                exclusive
                onChange={handleCambioVista}
                size="small"
                aria-label="tipo de vista"
                sx={{ 
                  mr: 1,
                  '& .MuiToggleButton-root': {
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="normal" aria-label="vista normal">
                  <Tooltip title="Vista normal">
                    <ViewModuleIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="agrupada" aria-label="vista por actividad">
                  <Tooltip title="Agrupar por actividad">
                    <ViewListIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            
            {onSubirDocumento && (
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<AddIcon />}
                onClick={onSubirDocumento}
                sx={{ 
                  textTransform: 'none',
                  borderRadius: '10px',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                }}
              >
                Subir Documento
              </Button>
            )}
          </Box>
        </Box>
      )}
      
      {cargando ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          py: 8,
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress size={40} />
          <Typography color="text.secondary" variant="body2">
            Cargando documentos...
          </Typography>
        </Box>
      ) : documentos.length > 0 ? (
        vistaActual === 'normal' ? renderizarVistaNomal() : renderizarVistaAgrupada()
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: '16px',
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: alpha(theme.palette.background.default, 0.5),
            minHeight: '200px'
          }}
        >
          <Box 
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderRadius: '50%',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2
            }}
          >
            <DescriptionIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          </Box>
          <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
            No hay documentos
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 400 }}>
            {mensajeVacio}
          </Typography>
          {onSubirDocumento && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={onSubirDocumento}
              sx={{ textTransform: 'none', borderRadius: '10px' }}
            >
              Subir Documento
            </Button>
          )}
        </Paper>
      )}
      
      {/* Snackbar para mostrar errores */}
      <Snackbar
        open={!!errorDescarga}
        autoHideDuration={4000}
        onClose={() => setErrorDescarga(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setErrorDescarga(null)}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorDescarga}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentosVisualizador; 