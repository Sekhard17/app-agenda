import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Chip,
  Grid,
  useTheme,
  alpha,
  Fade,
  Avatar,
  Paper
} from '@mui/material';
import { 
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Actividad } from '../services/actividades.service';

interface ActividadDetalleModalProps {
  open: boolean;
  onClose: () => void;
  actividad: Actividad;
  esEditable?: boolean;
}

const ActividadDetalleModal = ({ open, onClose, actividad, esEditable }: ActividadDetalleModalProps) => {
  const theme = useTheme();

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), 'dd MMM yyyy', { locale: es });
  };

  // Formatear hora sin segundos
  const formatearHora = (hora: string) => {
    if (!hora) return '';
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
        return theme.palette.success.main;
      case 'borrador':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      TransitionProps={{ timeout: { enter: 500, exit: 400 } }}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          padding: 0,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
          background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${theme.palette.background.paper})`,
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          p: 3,
          background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
            <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
              Detalle de Actividad
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Información detallada de la actividad seleccionada
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box 
          sx={{ 
            mb: 3,
            p: 2.5,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <InfoIcon 
            sx={{ 
              color: theme.palette.info.main,
              p: 0.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.info.main, 0.1),
            }} 
          />
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Aquí puedes ver todos los detalles de la actividad, incluyendo su estado, fechas, y la información del usuario asignado.
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '16px',
            background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.primary.main, 0.01)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip 
              icon={actividad.estado === 'enviado' ? <CheckCircleIcon /> : <ScheduleIcon />}
              label={actividad.estado === 'enviado' ? 'Enviado' : 'Borrador'} 
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
                },
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  boxShadow: `0 4px 12px ${alpha(obtenerColorEstado(actividad.estado), 0.2)}`
                }
              }}
            />
          </Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            mb: 1.5,
            letterSpacing: '-0.02em',
            color: alpha(theme.palette.text.primary, 0.9),
          }}>
            {actividad.nombre}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: alpha(theme.palette.text.secondary, 0.8),
            lineHeight: 1.6,
          }}>
            {actividad.descripcion || 'Sin descripción'}
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    color: theme.palette.success.main,
                    width: 48,
                    height: 48,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.1)}`,
                  }}
                >
                  <CalendarTodayIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.8),
                    mb: 0.5,
                    fontWeight: 500
                  }}>
                    Fecha
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                  }}>
                    {formatearFecha(actividad.fecha)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    color: theme.palette.info.main,
                    width: 48,
                    height: 48,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.8),
                    mb: 0.5,
                    fontWeight: 500
                  }}>
                    Horario
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                  }}>
                    {`${formatearHora(actividad.hora_inicio)} - ${formatearHora(actividad.hora_fin)}`}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    color: theme.palette.warning.main,
                    width: 48,
                    height: 48,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.1)}`,
                  }}
                >
                  <FolderIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.8),
                    mb: 0.5,
                    fontWeight: 500
                  }}>
                    Proyecto
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                  }}>
                    {actividad.proyectos?.nombre || 'Sin proyecto asignado'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                height: '100%',
                borderRadius: '16px',
                background: `linear-gradient(to right, ${alpha(theme.palette.secondary.main, 0.03)}, ${alpha(theme.palette.secondary.main, 0.01)})`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.08)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.1)}`,
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    color: theme.palette.secondary.main,
                    width: 48,
                    height: 48,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.1)}`,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.8),
                    mb: 0.5,
                    fontWeight: 500
                  }}>
                    Usuario
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                  }}>
                    {`${actividad.usuarios?.nombres} ${actividad.usuarios?.appaterno} ${actividad.usuarios?.apmaterno || ''}`}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        p: 2.5,
        bgcolor: alpha(theme.palette.background.default, 0.4),
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1,
        backdropFilter: 'blur(8px)',
      }}>
        {esEditable && (
          <Button 
            variant="contained"
            color="primary"
            size="large"
            sx={{ 
              borderRadius: '12px',
              px: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Editar
          </Button>
        )}
        <Button 
          onClick={onClose}
          variant="outlined"
          size="large"
          sx={{ 
            borderRadius: '12px',
            px: 3,
            borderColor: alpha(theme.palette.divider, 0.12),
            color: alpha(theme.palette.text.primary, 0.8),
            '&:hover': {
              borderColor: theme.palette.text.primary,
              backgroundColor: alpha(theme.palette.divider, 0.04),
            },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActividadDetalleModal;