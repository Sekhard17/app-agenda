import { useState } from 'react';
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
  Paper,
  IconButton,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Flag as FlagIcon,
  Timer as TimerIcon,
  Description as DescriptionIcon,
  Save as SaveIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Actividad } from '../services/actividades.service';

interface ActividadDetalleModalProps {
  open: boolean;
  onClose: () => void;
  actividad: Actividad;
  esEditable?: boolean;
  onActividadActualizada?: () => void;
}

const ActividadDetalleModal = ({ 
  open, 
  onClose, 
  actividad, 
  esEditable = false,
  onActividadActualizada 
}: ActividadDetalleModalProps) => {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: actividad.descripcion || '',
    fecha: actividad.fecha ? new Date(actividad.fecha) : new Date(),
    hora_inicio: actividad.hora_inicio ? new Date(`2000-01-01T${actividad.hora_inicio}`) : new Date(),
    hora_fin: actividad.hora_fin ? new Date(`2000-01-01T${actividad.hora_fin}`) : new Date(),
    estado: actividad.estado || 'pendiente',
    observaciones: actividad.observaciones || '',
    resultados: actividad.resultados || ''
  });

  // Formatear fecha
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

  // Obtener color según estado
  const obtenerColorEstado = (estado: string) => {
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
      default:
        return theme.palette.grey[500];
    }
  };

  // Obtener etiqueta de estado
  const obtenerEtiquetaEstado = (estado: string) => {
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
      default:
        return estado;
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (field: string, value: Date | string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manejar guardado
  const handleGuardar = async () => {
    try {
      // Aquí iría la lógica para guardar los cambios
      // Por ahora solo simulamos el guardado
      setTimeout(() => {
        setEditMode(false);
        if (onActividadActualizada) {
          onActividadActualizada();
        }
      }, 1000);
    } catch (error) {
      console.error('Error al guardar:', error);
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
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
              {editMode ? 'Editar Actividad' : 'Detalle de Actividad'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {actividad.proyecto_nombre || 'Proyecto no especificado'}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: theme.palette.text.secondary,
            '&:hover': { 
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {editMode ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Descripción */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main
                      }}
                    >
                      <DescriptionIcon fontSize="small" />
                    </Avatar>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '& .MuiInputAdornment-root': {
                    marginRight: '12px',
                  },
                  '& fieldset': {
                    borderColor: alpha(theme.palette.divider, 0.2),
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />

            {/* Fecha y Horas */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="Fecha"
                value={formData.fecha}
                onChange={(date) => handleChange('fecha', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': {
                          borderColor: alpha(theme.palette.divider, 0.2),
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }
                  }
                }}
              />
              <TimePicker
                label="Hora Inicio"
                value={formData.hora_inicio}
                onChange={(time) => handleChange('hora_inicio', time)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': {
                          borderColor: alpha(theme.palette.divider, 0.2),
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }
                  }
                }}
              />
              <TimePicker
                label="Hora Fin"
                value={formData.hora_fin}
                onChange={(time) => handleChange('hora_fin', time)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': {
                          borderColor: alpha(theme.palette.divider, 0.2),
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }
                  }
                }}
              />
            </Box>

            {/* Estado */}
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.estado}
                label="Estado"
                onChange={(e) => handleChange('estado', e.target.value)}
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.divider, 0.2),
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="en_progreso">En Progreso</MenuItem>
                <MenuItem value="completada">Completada</MenuItem>
                <MenuItem value="cancelada">Cancelada</MenuItem>
              </Select>
            </FormControl>

            {/* Observaciones y Resultados */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: alpha(theme.palette.divider, 0.2),
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Resultados"
              value={formData.resultados}
              onChange={(e) => handleChange('resultados', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: alpha(theme.palette.divider, 0.2),
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
          </Box>
        ) : (
          <>
            {/* Vista de solo lectura */}
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
              </Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 600, 
                mb: 1.5,
                letterSpacing: '-0.02em',
                color: alpha(theme.palette.text.primary, 0.9),
              }}>
                {actividad.nombre || actividad.descripcion}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.8),
                lineHeight: 1.6,
              }}>
                {actividad.descripcion}
              </Typography>
            </Paper>

            {/* Detalles en Grid */}
            <Grid container spacing={3}>
              {/* Fecha */}
              <Grid item xs={12} sm={6} md={4}>
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
                        width: 40,
                        height: 40,
                      }}
                    >
                      <CalendarTodayIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Fecha
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {formatearFecha(actividad.fecha)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Hora */}
              <Grid item xs={12} sm={6} md={4}>
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
                        width: 40,
                        height: 40,
                      }}
                    >
                      <AccessTimeIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Horario
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_fin)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Duración */}
              <Grid item xs={12} sm={6} md={4}>
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
                        width: 40,
                        height: 40,
                      }}
                    >
                      <TimerIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Duración
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {actividad.duracion || 0} horas
                      </Typography>
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
                  mt: 3,
                  p: 3,
                  borderRadius: '16px',
                  background: `linear-gradient(to right, ${alpha(theme.palette.grey[500], 0.03)}, ${alpha(theme.palette.grey[500], 0.01)})`,
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon sx={{ color: theme.palette.grey[500] }} />
                  Información Adicional
                </Typography>
                
                {actividad.observaciones && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Observaciones
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {actividad.observaciones}
                    </Typography>
                  </Box>
                )}
                
                {actividad.resultados && (
                  <>
                    {actividad.observaciones && <Divider sx={{ my: 2 }} />}
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Resultados
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {actividad.resultados}
                      </Typography>
                    </Box>
                  </>
                )}
              </Paper>
            )}

            {/* Usuario asignado */}
            {actividad.usuarios && (
              <Paper
                elevation={0}
                sx={{
                  mt: 3,
                  p: 3,
                  borderRadius: '16px',
                  background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.primary.main, 0.01)})`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  >
                    {actividad.usuarios.nombres[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {`${actividad.usuarios.nombres} ${actividad.usuarios.appaterno}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usuario asignado
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Button 
          onClick={onClose}
          variant="outlined" 
          color="inherit"
          sx={{ 
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Cerrar
        </Button>
        {esEditable && (
          editMode ? (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleGuardar}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              Guardar Cambios
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              Editar Actividad
            </Button>
          )
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ActividadDetalleModal;