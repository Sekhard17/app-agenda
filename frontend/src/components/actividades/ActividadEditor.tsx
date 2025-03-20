import React, { useState, useEffect } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Snackbar,
  InputAdornment
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { 
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  EventNote as EventNoteIcon,
  Description as DescriptionIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { Actividad } from '../../services/actividades.service';
import TiposActividadService, { TipoActividad } from '../../services/tipos-actividad.service';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';

// Registrar plugins de FilePond
registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

// Extendemos la interfaz de Actividad para incluir archivos adjuntos
interface ActividadConArchivos extends Actividad {
  archivos?: Array<{
    id?: string;
    url: string;
    nombre: string;
    tamano: number;
    tipo: string;
  }>;
  id_tipo_actividad?: string;
}

interface ActividadEditorProps {
  open: boolean;
  onClose: () => void;
  actividad: ActividadConArchivos;
  onActualizarActividad: () => void;
}

const ActividadEditor: React.FC<ActividadEditorProps> = ({ 
  open, 
  onClose, 
  actividad, 
  onActualizarActividad 
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Estado para los campos del formulario
  const [formData, setFormData] = useState<{
    descripcion: string;
    fecha: Date | null;
    hora_inicio: Date | null;
    hora_fin: Date | null;
    estado: string;
    id_tipo_actividad: string;
    archivosNuevos: File[];
    archivosExistentes: ActividadConArchivos['archivos'];
  }>({
    descripcion: '',
    fecha: null,
    hora_inicio: null,
    hora_fin: null,
    estado: '',
    id_tipo_actividad: '',
    archivosNuevos: [],
    archivosExistentes: []
  });

  // Estado para errores de validación
  const [formErrors, setFormErrors] = useState<{
    descripcion: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
  }>({
    descripcion: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: ''
  });

  // Cargar datos de la actividad cuando cambie
  useEffect(() => {
    if (actividad) {
      setFormData({
        descripcion: actividad.descripcion || '',
        fecha: actividad.fecha ? new Date(actividad.fecha) : null,
        hora_inicio: actividad.hora_inicio ? parseTimeToDate(actividad.hora_inicio) : null,
        hora_fin: actividad.hora_fin ? parseTimeToDate(actividad.hora_fin) : null,
        estado: actividad.estado || 'borrador',
        id_tipo_actividad: actividad.id_tipo_actividad || '',
        archivosNuevos: [],
        archivosExistentes: actividad.archivos || []
      });
    }
  }, [actividad]);

  // Cargar tipos de actividad
  useEffect(() => {
    const fetchTiposActividad = async () => {
      const tipos = await TiposActividadService.obtenerTiposActividad();
      setTiposActividad(tipos);
    };
    fetchTiposActividad();
  }, []);

  // Función para convertir string de hora a objeto Date
  const parseTimeToDate = (timeString: string): Date => {
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    
    const date = new Date(today);
    date.setHours(hours, minutes, 0, 0);
    
    return date;
  };

  // Manejador de cambios para inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al editar
    if (name in formErrors) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Manejador de cambio para el select de estado
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejador para cambio de fecha
  const handleFechaChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      fecha: date
    }));
    setFormErrors(prev => ({
      ...prev,
      fecha: ''
    }));
  };

  // Manejador para cambio de horas
  const handleHoraChange = (name: string, date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    setFormErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  // Eliminar archivo existente
  const handleRemoveExistingFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      archivosExistentes: prev.archivosExistentes?.filter((_, i) => i !== index)
    }));
  };

  // Validar el formulario
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      descripcion: '',
      fecha: '',
      hora_inicio: '',
      hora_fin: ''
    };

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
      isValid = false;
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
      isValid = false;
    }

    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'La hora de inicio es requerida';
      isValid = false;
    }

    if (!formData.hora_fin) {
      newErrors.hora_fin = 'La hora de fin es requerida';
      isValid = false;
    } else if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio > formData.hora_fin) {
      newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Lógica para manejar archivos (simulada)
      // Aquí iría la lógica real para subir nuevos archivos y eliminar los quitados
      
      // Simulación de actualización exitosa
      setTimeout(() => {
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'Actividad actualizada con éxito',
          severity: 'success'
        });
        
        // Notificar al componente padre
        onActualizarActividad();
        
        // Cerrar después de un breve retardo
        setTimeout(() => {
          onClose();
        }, 1000);
      }, 1000);
      
    } catch (error) {
      setLoading(false);
      setError('Ocurrió un error al actualizar la actividad');
      console.error('Error al actualizar:', error);
    }
  };

  // Cerrar mensaje de snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog 
        open={open} 
        onClose={loading ? undefined : onClose}
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
        {/* Barra de color superior */}
        <Box 
          sx={{ 
            height: '8px', 
            width: '100%', 
            bgcolor: theme.palette.primary.main,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }} 
        />

        {/* Header */}
        <DialogTitle 
          sx={{ 
            p: 3,
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
              <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                Editar Actividad
              </Typography>
              {actividad.proyecto_nombre && (
                <Chip
                  label={actividad.proyecto_nombre}
                  size="small"
                  icon={<EventNoteIcon />}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiChip-icon': { color: theme.palette.primary.main },
                  }}
                />
              )}
            </Box>
          </Box>
          <IconButton 
            onClick={onClose}
            disabled={loading}
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
            mt: 1,
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
          {/* Mensaje de error si existe */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: '12px' }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {/* Descripción */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            error={!!formErrors.descripcion}
            helperText={formErrors.descripcion}
            margin="normal"
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: alpha(formErrors.descripcion ? theme.palette.error.main : theme.palette.primary.main, 0.1),
                      color: formErrors.descripcion ? theme.palette.error.main : theme.palette.primary.main
                    }}
                  >
                    <DescriptionIcon fontSize="small" />
                  </Avatar>
                </InputAdornment>
              ),
              sx: {
                borderRadius: '12px',
              }
            }}
          />

          {/* Fecha y horas */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <DatePicker 
                label="Fecha"
                value={formData.fecha}
                onChange={handleFechaChange}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    error: !!formErrors.fecha,
                    helperText: formErrors.fecha,
                    InputProps: {
                      sx: {
                        borderRadius: '12px',
                      }
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TimePicker
                label="Hora inicio"
                value={formData.hora_inicio}
                onChange={(date) => handleHoraChange('hora_inicio', date)}
                ampm={false}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    error: !!formErrors.hora_inicio,
                    helperText: formErrors.hora_inicio,
                    InputProps: {
                      sx: {
                        borderRadius: '12px',
                      }
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TimePicker
                label="Hora fin"
                value={formData.hora_fin}
                onChange={(date) => handleHoraChange('hora_fin', date)}
                ampm={false}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    error: !!formErrors.hora_fin,
                    helperText: formErrors.hora_fin,
                    InputProps: {
                      sx: {
                        borderRadius: '12px',
                      }
                    }
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Estado */}
          <FormControl 
            fullWidth 
            sx={{ mb: 3 }}
          >
            <InputLabel id="estado-label">Estado</InputLabel>
            <Select
              labelId="estado-label"
              name="estado"
              value={formData.estado}
              onChange={handleSelectChange}
              label="Estado"
              sx={{ borderRadius: '12px' }}
            >
              <MenuItem value="borrador">Borrador</MenuItem>
              <MenuItem value="enviado">Enviado</MenuItem>
            </Select>
            <FormHelperText>
              Selecciona "Enviado" para finalizar la actividad
            </FormHelperText>
          </FormControl>

          {/* Tipo de Actividad */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Tipo de Actividad</InputLabel>
            <Select
              value={formData.id_tipo_actividad}
              label="Tipo de Actividad"
              onChange={handleSelectChange}
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
              {tiposActividad.map((tipo) => (
                <MenuItem key={tipo.id} value={tipo.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: alpha(tipo.color || theme.palette.primary.main, 0.1),
                        color: tipo.color || theme.palette.primary.main,
                      }}
                    >
                      {tipo.icono ? (
                        <span className="material-icons-outlined" style={{ fontSize: '1.2rem' }}>
                          {tipo.icono}
                        </span>
                      ) : (
                        <CategoryIcon fontSize="small" />
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {tipo.nombre}
                      </Typography>
                      {tipo.descripcion && (
                        <Typography variant="caption" color="text.secondary">
                          {tipo.descripcion}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Subida de Archivos con FilePond */}
          <Box
            sx={{
              '& .filepond--panel-root': {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                borderRadius: '12px',
              },
              '& .filepond--drop-label': {
                fontSize: '1rem',
                color: theme.palette.text.primary,
              },
              '& .filepond--label-action': {
                textDecoration: 'none',
                color: theme.palette.primary.main,
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
              '& .filepond--item-panel': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              },
              '& .filepond--file-action-button:hover': {
                bgcolor: theme.palette.primary.main,
              },
              '& .filepond--file-info-main': {
                fontWeight: 500,
              },
              '& .filepond--root': {
                marginBottom: 0,
              },
            }}
          >
            <FilePond
              files={formData.archivosNuevos}
              onupdatefiles={(files) => {
                setFormData(prev => ({
                  ...prev,
                  archivosNuevos: files.map(fileItem => fileItem.file as File)
                }));
              }}
              allowMultiple={true}
              maxFiles={5}
              maxFileSize="10MB"
              acceptedFileTypes={[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/png'
              ]}
              labelIdle='Arrastra y suelta archivos aquí o <span class="filepond--label-action">Examinar</span>'
              labelFileTypeNotAllowed="Tipo de archivo no permitido"
              labelFileProcessingError="Error al procesar el archivo"
              labelTapToCancel="toca para cancelar"
              labelTapToRetry="toca para reintentar"
              labelTapToUndo="toca para deshacer"
              labelMaxFileSizeExceeded="Archivo demasiado grande"
              labelMaxFileSize="Tamaño máximo: 10MB"
              labelMaxTotalFileSizeExceeded="Tamaño total excedido"
              credits={false}
              className="custom-filepond"
            />
          </Box>

          {/* Archivos existentes */}
          {formData.archivosExistentes && formData.archivosExistentes.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 0,
                borderRadius: '12px',
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                overflow: 'hidden',
                mb: 2
              }}
            >
              {formData.archivosExistentes.map((archivo, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.background.default, 0.5),
                    borderBottom: index < formData.archivosExistentes!.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main
                      }}
                    >
                      <DescriptionIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {archivo.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(archivo.tamano / 1024)} KB
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton 
                    color="error"
                    onClick={() => handleRemoveExistingFile(index)}
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Paper>
          )}
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
            disabled={loading}
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
            Cancelar
          </Button>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
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
              '&:disabled': {
                background: 'linear-gradient(135deg, #7CC89A 0%, #8CC9A0 100%)',
              }
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
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
    </LocalizationProvider>
  );
};

export default ActividadEditor; 