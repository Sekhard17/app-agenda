import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  Chip,
  alpha,
  useTheme,
  Tooltip,
  IconButton,
  Zoom,
  InputAdornment,
  Stack,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  EventNote as EventNoteIcon,
  Category as CategoryIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import ActividadesService from '../../services/actividades.service';
import TiposActividadService, { TipoActividad } from '../../services/tipos-actividad.service';
import { useAuth } from '../../context/AuthContext';
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

interface CrearActividadProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proyectoId?: string;
  proyectoNombre?: string;
}

interface FormData {
  descripcion: string;
  fecha: Date | null;
  hora_inicio: Date | null;
  hora_fin: Date | null;
  estado: string;
  id_tipo_actividad: string;
  archivos?: File[];
}

const CrearActividad: React.FC<CrearActividadProps> = ({
  open,
  onClose,
  onSuccess,
  proyectoId,
  proyectoNombre,
}) => {
  const theme = useTheme();
  const { usuario } = useAuth();
  
  // Estados
  const [formData, setFormData] = useState<FormData>({
    descripcion: '',
    fecha: new Date(),
    hora_inicio: new Date(),
    hora_fin: new Date(new Date().setHours(new Date().getHours() + 1)),
    estado: 'borrador',
    id_tipo_actividad: '',
    archivos: [],
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTips, setShowTips] = useState(true);

  // Cargar tipos de actividad
  useEffect(() => {
    const fetchTiposActividad = async () => {
      const tipos = await TiposActividadService.obtenerTiposActividad();
      setTiposActividad(tipos);
      if (tipos.length > 0) {
        // Establecer el tipo de actividad por defecto
        const defaultTipoId = tipos[0].id;
        setFormData(prev => ({ 
          ...prev, 
          id_tipo_actividad: defaultTipoId,
          hora_inicio: prev.hora_inicio || new Date(),
          hora_fin: prev.hora_fin || new Date(new Date().setHours(new Date().getHours() + 1))
        }));
        
        // Eliminar cualquier error relacionado con id_tipo_actividad
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.id_tipo_actividad;
          return newErrors;
        });
      }
    };
    fetchTiposActividad();
  }, []);

  // Validación de campos
  const validateField = (name: keyof FormData, value: any): string => {
    switch (name) {
      case 'descripcion':
        if (!value.trim()) return 'La descripción es requerida';
        if (value.length < 10) return 'La descripción debe tener al menos 10 caracteres';
        if (value.length > 500) return 'La descripción no puede exceder los 500 caracteres';
        return '';
      case 'fecha':
        if (!value) return 'La fecha es requerida';
        return '';
      case 'hora_inicio':
        if (!value) return 'La hora de inicio es requerida';
        return '';
      case 'hora_fin':
        if (!value) return 'La hora de fin es requerida';
        if (formData.hora_inicio && value < formData.hora_inicio) {
          return 'La hora de fin debe ser posterior a la hora de inicio';
        }
        return '';
      case 'id_tipo_actividad':
        if (!value) return 'El tipo de actividad es requerido';
        return '';
      default:
        return '';
    }
  };

  // Verificar si el formulario está completo
  const isFormValid = (): boolean => {
    const hasRequiredFields = !!(
      formData.descripcion?.trim() &&
      formData.fecha &&
      formData.hora_inicio &&
      formData.hora_fin &&
      formData.id_tipo_actividad
    );

    // Comprobar si hay errores activos en algún campo
    const hasErrors = Object.values(errors).some(error => error !== '');
    
    return hasRequiredFields && !hasErrors;
  };

  // Manejar cambios en los campos
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    
    // Si no hay error, eliminamos la entrada del campo en el objeto de errores
    if (error === '') {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } else {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Validar todo el formulario
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof FormData>).forEach(field => {
      if (field !== 'archivos') { // No validamos archivos ya que son opcionales
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    // Actualizamos el estado de errores con los nuevos errores encontrados
    setErrors(newErrors);
    
    // Para diagnóstico, loguear el estado actual del formulario
    if (!isValid) {
      console.log('Formulario inválido. Errores:', newErrors);
      console.log('Estado actual del formulario:', formData);
    }
    
    return isValid;
  };

  // Manejar archivos de FilePond
  const handleUpdateFiles = (files: any[]) => {
    setFormData(prev => ({
      ...prev,
      archivos: files.map(file => file.file)
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (estadoFinal: 'borrador' | 'enviado') => {
    if (!validateForm()) return;
    if (!usuario?.id) {
      console.error('No se encontró el ID del usuario');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Agregar datos básicos de la actividad
      const actividadData = {
        descripcion: formData.descripcion,
        fecha: format(formData.fecha!, 'yyyy-MM-dd'),
        hora_inicio: format(formData.hora_inicio!, 'HH:mm'),
        hora_fin: format(formData.hora_fin!, 'HH:mm'),
        estado: estadoFinal, // Usar el estado pasado como parámetro
        id_tipo_actividad: formData.id_tipo_actividad,
        id_proyecto: proyectoId,
        id_usuario: usuario.id,
      };

      // Agregar datos de la actividad como JSON string
      formDataToSend.append('actividad', JSON.stringify(actividadData));

      // Agregar archivos
      if (formData.archivos && formData.archivos.length > 0) {
        formData.archivos.forEach((archivo) => {
          formDataToSend.append(`archivos`, archivo);
        });
      }

      const response = await ActividadesService.crearActividad(formDataToSend);
      if (response) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error al crear la actividad:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setLoading(false);
    }
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
        }
      }}
    >
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
              Nueva Actividad
            </Typography>
            {proyectoNombre && (
              <Chip
                label={proyectoNombre}
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
        {/* Tips Section */}
        {showTips && (
          <Box 
            sx={{ 
              mb: 3,
              p: 2.5,
              bgcolor: alpha(theme.palette.info.main, 0.05),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(to right, ${theme.palette.info.main}, ${alpha(theme.palette.info.main, 0.1)})`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar
                sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main,
                }}
              >
                <InfoIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" color="info.main" sx={{ mb: 1, fontWeight: 600 }}>
                  Tips para crear una actividad efectiva:
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Usa nombres descriptivos y concisos para facilitar su identificación
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Incluye todos los detalles importantes en la descripción
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Establece una duración realista para la actividad
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Adjunta archivos relevantes para el desarrollo de la actividad
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => setShowTips(false)}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    transform: 'rotate(90deg)',
                    transition: 'all 0.3s ease-in-out',
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Form Fields */}
        <Stack spacing={2.5}>
          {/* Descripción */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            error={!!errors.descripcion}
            helperText={errors.descripcion}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: alpha(errors.descripcion ? theme.palette.error.main : theme.palette.primary.main, 0.1),
                      color: errors.descripcion ? theme.palette.error.main : theme.palette.primary.main
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
                  error: !!errors.fecha,
                  helperText: errors.fecha,
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
                  error: !!errors.hora_inicio,
                  helperText: errors.hora_inicio,
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
                  error: !!errors.hora_fin,
                  helperText: errors.hora_fin,
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

          {/* Tipo de Actividad */}
          <FormControl fullWidth error={!!errors.id_tipo_actividad}>
            <InputLabel>Tipo de Actividad</InputLabel>
            <Select
              value={formData.id_tipo_actividad}
              label="Tipo de Actividad"
              onChange={(e) => handleChange('id_tipo_actividad', e.target.value)}
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
            {errors.id_tipo_actividad && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                {errors.id_tipo_actividad}
              </Typography>
            )}
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
              files={formData.archivos}
              onupdatefiles={handleUpdateFiles}
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
        </Stack>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: 2.5,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          gap: 2,
        }}
      >
        {/* Botón de depuración - solo visible en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <Tooltip title="Debug: Mostrar estado del formulario">
            <IconButton 
              size="small" 
              onClick={() => {
                console.log('Estado del formulario:', formData);
                console.log('Errores:', errors);
                console.log('Formulario válido:', isFormValid());
              }}
              sx={{ mr: 'auto', opacity: 0.5 }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
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
          Cancelar
        </Button>
        <Button 
          onClick={() => handleSubmit('borrador')}
          variant="outlined"
          size="large"
          disabled={loading || !isFormValid()}
          sx={{ 
            borderRadius: '10px',
            px: 3,
            borderColor: alpha(theme.palette.info.main, 0.5),
            color: theme.palette.info.main,
            '&:hover': {
              borderColor: theme.palette.info.main,
              backgroundColor: alpha(theme.palette.info.main, 0.05),
            },
            '&.Mui-disabled': {
              opacity: 0.6,
            },
          }}
        >
          Guardar Borrador
        </Button>
        <Button 
          onClick={() => handleSubmit('enviado')}
          variant="contained"
          size="large"
          disabled={loading || !isFormValid()}
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
            '&.Mui-disabled': {
              background: alpha(theme.palette.background.paper, 0.8),
              color: alpha(theme.palette.text.primary, 0.4),
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: 'none',
            },
          }}
        >
          Enviar Actividad
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CrearActividad; 