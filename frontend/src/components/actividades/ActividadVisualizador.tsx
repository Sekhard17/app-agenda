import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
  Zoom,
  Avatar,
  IconButton,
  Paper,
  Grid,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  EventNote as EventNoteIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Drafts as DraftsIcon,
  Cancel as CancelIcon,
  FactCheck as FactCheckIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Actividad } from '../../services/actividades.service';
import DocumentosVisualizador from '../documentos/DocumentosVisualizador';

// Extendemos la interfaz de Actividad para incluir archivos adjuntos
interface ActividadConArchivos extends Actividad {
  archivos?: Array<{
    url: string;
    nombre: string;
    tamano: number;
    tipo: string;
  }>;
}

interface ActividadVisualizadorProps {
  open: boolean;
  onClose: () => void;
  actividad: ActividadConArchivos;
  esEditable?: boolean;
  onActualizarActividad?: () => void;
  cargandoDocumentos?: boolean;
}

const ActividadVisualizador: React.FC<ActividadVisualizadorProps> = ({ 
  open, 
  onClose, 
  actividad, 
  esEditable = false,
  onActualizarActividad,
  cargandoDocumentos = false
}) => {
  const theme = useTheme();
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  // Manejador para cuando ocurre un error al descargar
  const manejarErrorDescarga = () => {
    setErrorDescarga('Error al acceder al archivo. El archivo podría no estar disponible.');
    setTimeout(() => setErrorDescarga(null), 4000);
  };

  // Formatear fecha en formato corto
  const formatearFecha = (fecha: string | Date) => {
    return format(new Date(fecha), 'dd MMMM yyyy', { locale: es });
  };

  // Formatear hora sin segundos
  const formatearHora = (hora: string | Date) => {
    if (hora instanceof Date) {
      return format(hora, 'HH:mm');
    }
    if (!hora) return '';
    const partes = hora.split(':');
    if (partes.length >= 2) {
      return `${partes[0]}:${partes[1]}`;
    }
    return hora;
  };

  // Obtener etiqueta e icono para el estado
  const obtenerInfoEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completada':
        return { 
          label: 'Completada', 
          icon: <FactCheckIcon />, 
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.1)
        };
      case 'en_progreso':
      case 'en progreso':
        return { 
          label: 'En Progreso', 
          icon: <InfoIcon />, 
          color: theme.palette.primary.main,
          bgColor: alpha(theme.palette.primary.main, 0.1)
        };
      case 'pendiente':
        return { 
          label: 'Pendiente', 
          icon: <InfoIcon />, 
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.1)
        };
      case 'cancelada':
        return { 
          label: 'Cancelada', 
          icon: <CancelIcon />, 
          color: theme.palette.error.main,
          bgColor: alpha(theme.palette.error.main, 0.1)
        };
      case 'enviado':
        return { 
          label: 'Enviada', 
          icon: <SendIcon />, 
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.1)
        };
      case 'borrador':
        return { 
          label: 'Borrador', 
          icon: <DraftsIcon />, 
          color: theme.palette.info.main,
          bgColor: alpha(theme.palette.info.main, 0.1)
        };
      default:
        return { 
          label: estado, 
          icon: <InfoIcon />, 
          color: theme.palette.grey[500],
          bgColor: alpha(theme.palette.grey[500], 0.1)
        };
    }
  };

  // Información del estado actual
  const estadoInfo = obtenerInfoEstado(actividad.estado);
  
  // Verificar si la actividad está en modo sólo lectura
  const esSoloLectura = actividad.estado === 'enviado';

  // Convertir archivos adjuntos al formato esperado por DocumentosVisualizador
  const archivosToDocumentos = (archivos: any[] = []) => {
    return archivos.map(archivo => ({
      id: archivo.id || `doc-${Math.random().toString(36).substring(2)}`,
      nombre_archivo: archivo.nombre,
      ruta_archivo: archivo.url,
      tipo_archivo: archivo.tipo,
      tamaño_bytes: archivo.tamano,
      fecha_creacion: new Date()
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Zoom}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          padding: 0,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
          background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${theme.palette.background.paper})`,
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }
      }}
    >
      {/* Barra de estado superior */}
      <Box 
        sx={{ 
          height: '8px', 
          width: '100%', 
          bgcolor: estadoInfo.color,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }} 
      />
      
      {/* Header con Badge de estado */}
      <DialogTitle 
        sx={{ 
          p: 3,
          mt: 0.5,
          background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              width: 48,
              height: 48,
            }}
          >
            <AssignmentIcon />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
                {actividad.nombre || 'Detalle de Actividad'}
              </Typography>
              <Chip
                icon={estadoInfo.icon}
                label={estadoInfo.label}
                size="small"
                sx={{
                  bgcolor: estadoInfo.bgColor,
                  color: estadoInfo.color,
                  fontWeight: 500,
                  borderRadius: '16px',
                  height: '24px',
                  border: `1px solid ${alpha(estadoInfo.color, 0.3)}`,
                  '& .MuiChip-icon': {
                    color: 'inherit',
                    fontSize: '0.85rem'
                  }
                }}
              />
            </Box>
            {actividad.proyecto_nombre ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mt: 1,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderRadius: '8px',
                py: 0.8,
                px: 1.5,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              }}>
                <EventNoteIcon 
                  fontSize="small" 
                  sx={{ color: theme.palette.primary.main }}
                />
                <Typography 
                  variant="subtitle1" 
                  color="primary.main" 
                  fontWeight={600}
                >
                  {actividad.proyecto_nombre}
                </Typography>
              </Box>
            ) : (
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                sx={{ mt: 0.5, fontStyle: 'italic' }}
              >
                Sin proyecto asignado
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.primary.main,
              transform: 'rotate(90deg)',
              transition: 'all 0.3s ease-in-out',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent 
        sx={{ 
          p: 3,
          pt: 4,
          mt: 4,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.primary.main, 0.05),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.primary.main, 0.2),
            borderRadius: '4px',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.3),
            },
          },
        }}
      >
        {/* Descripción */}
        <Box sx={{ mb: 4, mt: 0 }}>
          <Typography
            variant="subtitle2" 
            color="text.secondary" 
            sx={{ 
              mb: 1, 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}
          >
            <DescriptionIcon fontSize="small" />
            Descripción
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              backgroundColor: alpha(theme.palette.background.default, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            }}
          >
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {actividad.descripcion}
            </Typography>
          </Paper>
        </Box>

        {/* Información en tarjetas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Fecha */}
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    color: theme.palette.success.main,
                    width: 36,
                    height: 36,
                  }}
                >
                  <CalendarTodayIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha
                  </Typography>
                  <Typography variant="body1">
                    {actividad.fecha ? formatearFecha(actividad.fecha) : '-'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Horario */}
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    color: theme.palette.info.main,
                    width: 36,
                    height: 36,
                  }}
                >
                  <AccessTimeIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Horario
                  </Typography>
                  <Typography variant="body1">
                    {actividad.hora_inicio ? formatearHora(actividad.hora_inicio) : '-'} - {actividad.hora_fin ? formatearHora(actividad.hora_fin) : '-'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Observaciones (si existen) */}
        {actividad.observaciones && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon fontSize="small" />
              Observaciones
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{actividad.observaciones}</Typography>
            </Paper>
          </Box>
        )}
        
        {/* Resultados (si existen) */}
        {actividad.resultados && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon fontSize="small" />
              Resultados
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{actividad.resultados}</Typography>
            </Paper>
          </Box>
        )}

        {/* Archivos adjuntos (si existen) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachFileIcon fontSize="small" />
            Archivos Adjuntos
            {actividad.archivos && actividad.archivos.length > 0 && ` (${actividad.archivos.length})`}
          </Typography>
          
          <DocumentosVisualizador
            documentos={archivosToDocumentos(actividad.archivos)}
            cargando={cargandoDocumentos}
            mostrarEncabezado={false}
            mensajeVacio="No hay archivos adjuntos para esta actividad."
          />
        </Box>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: 2.5,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          gap: 2,
        }}
      >
        <Button 
          onClick={onClose}
          variant="outlined"
          size="large"
          sx={{ 
            borderRadius: '10px',
            px: 3,
            borderColor: alpha(theme.palette.divider, 0.2),
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              backgroundColor: alpha(theme.palette.divider, 0.05),
            },
          }}
        >
          Cerrar
        </Button>

        {/* Mostrar el botón de editar solo si es editable y no está en estado 'enviado' */}
        {esEditable && !esSoloLectura && (
          <Button
            variant="contained"
            size="large"
            startIcon={<EditIcon />}
            onClick={onActualizarActividad}
            sx={{
              borderRadius: '10px',
              px: 3,
              py: 1.2,
              boxShadow: '0 4px 12px rgba(0, 171, 85, 0.24)',
              background: 'linear-gradient(135deg, #00AB55 0%, #07B963 100%)',
              color: '#fff',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #07B963 0%, #00AB55 100%)',
                boxShadow: '0 8px 16px rgba(0, 171, 85, 0.32)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Editar Actividad
          </Button>
        )}
      </DialogActions>

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
          sx={{ width: '100%' }}
        >
          {errorDescarga}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ActividadVisualizador; 