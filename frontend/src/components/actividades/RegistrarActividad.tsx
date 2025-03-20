import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  SelectChangeEvent,
  FormHelperText,
  Grid
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface RegistrarActividadProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const RegistrarActividad: React.FC<RegistrarActividadProps> = ({ onClose, onSuccess }) => {
  const theme = useTheme();
  // Estados para el stepper
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fin: '',
    tipo_actividad: '',
    proyecto: '',
    comentarios: ''
  });
  
  // Estados para validación
  const [errors, setErrors] = useState<Record<string, string>>({
    titulo: '',
    descripcion: '',
    hora_inicio: '',
    hora_fin: '',
    tipo_actividad: '',
    proyecto: ''
  });
  
  // Pasos del stepper
  const steps = [
    {
      label: 'Información Básica',
      description: 'Título y descripción de la actividad',
      icon: <AssignmentIcon />
    },
    {
      label: 'Tiempo',
      description: 'Fecha y horario',
      icon: <ScheduleIcon />
    },
    {
      label: 'Detalles',
      description: 'Tipo y proyecto',
      icon: <CategoryIcon />
    },
    {
      label: 'Resumen',
      description: 'Revisar y guardar',
      icon: <DescriptionIcon />
    }
  ];
  
  // Validar el formulario según el paso actual
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    switch (step) {
      case 0:
        if (!formData.titulo.trim()) {
          newErrors.titulo = 'El título es requerido';
          isValid = false;
        }
        if (!formData.descripcion.trim()) {
          newErrors.descripcion = 'La descripción es requerida';
          isValid = false;
        }
        break;
      case 1:
        if (!formData.hora_inicio) {
          newErrors.hora_inicio = 'La hora de inicio es requerida';
          isValid = false;
        }
        if (!formData.hora_fin) {
          newErrors.hora_fin = 'La hora de fin es requerida';
          isValid = false;
        }
        if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
          newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
          isValid = false;
        }
        break;
      case 2:
        if (!formData.tipo_actividad) {
          newErrors.tipo_actividad = 'El tipo de actividad es requerido';
          isValid = false;
        }
        if (!formData.proyecto) {
          newErrors.proyecto = 'El proyecto es requerido';
          isValid = false;
        }
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Manejar el cambio de paso
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Manejar cambios en el formulario
  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  // Manejar cambios en los selects
  const handleSelectChange = (field: string) => (event: SelectChangeEvent<string>) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };
  
  // Manejar el envío del formulario
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Aquí iría la lógica para enviar los datos al backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación de llamada API
      
      onSuccess?.();
      // Mostrar mensaje de éxito y cerrar o redirigir
    } catch (err) {
      setError('Error al registrar la actividad. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Renderizar el contenido según el paso actual
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            sx={{ p: 3 }}
          >
            <TextField
              fullWidth
              label="Título"
              value={formData.titulo}
              onChange={handleChange('titulo')}
              error={!!errors.titulo}
              helperText={errors.titulo}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.4),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.default, 0.6)
                  }
                }
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Descripción"
              value={formData.descripcion}
              onChange={handleChange('descripcion')}
              error={!!errors.descripcion}
              helperText={errors.descripcion}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.4),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.default, 0.6)
                  }
                }
              }}
            />
          </Box>
        );
      case 1:
        return (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            sx={{ p: 3 }}
          >
            <TextField
              fullWidth
              type="date"
              label="Fecha"
              value={formData.fecha}
              onChange={handleChange('fecha')}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.4),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.default, 0.6)
                  }
                }
              }}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                type="time"
                label="Hora de inicio"
                value={formData.hora_inicio}
                onChange={handleChange('hora_inicio')}
                error={!!errors.hora_inicio}
                helperText={errors.hora_inicio}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.4),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.background.default, 0.6)
                    }
                  }
                }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="time"
                label="Hora de fin"
                value={formData.hora_fin}
                onChange={handleChange('hora_fin')}
                error={!!errors.hora_fin}
                helperText={errors.hora_fin}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.4),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.background.default, 0.6)
                    }
                  }
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            sx={{ p: 3 }}
          >
            <FormControl
              fullWidth
              error={!!errors.tipo_actividad}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.4),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.default, 0.6)
                  }
                }
              }}
            >
              <InputLabel>Tipo de Actividad</InputLabel>
              <Select
                value={formData.tipo_actividad}
                onChange={handleSelectChange('tipo_actividad')}
                label="Tipo de Actividad"
              >
                <MenuItem value="" sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7 }}>
                    <CategoryIcon fontSize="small" />
                    <Typography>Seleccione un tipo</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="1" sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    <Typography>Reunión</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="2" sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon fontSize="small" />
                    <Typography>Tarea</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="3" sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description fontSize="small" />
                    <Typography>Proyecto</Typography>
                  </Box>
                </MenuItem>
              </Select>
              {errors.tipo_actividad && (
                <FormHelperText>{errors.tipo_actividad}</FormHelperText>
              )}
            </FormControl>
            <FormControl
              fullWidth
              error={!!errors.proyecto}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.4),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.default, 0.6)
                  }
                }
              }}
            >
              <InputLabel>Proyecto</InputLabel>
              <Select
                value={formData.proyecto}
                onChange={handleSelectChange('proyecto')}
                label="Proyecto"
              >
                <MenuItem value="" sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7 }}>
                    <Assignment fontSize="small" />
                    <Typography>Seleccione un proyecto</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="1" sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon fontSize="small" />
                    <Typography>Proyecto A</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="2" sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon fontSize="small" />
                    <Typography>Proyecto B</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="3" sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon fontSize="small" />
                    <Typography>Proyecto C</Typography>
                  </Box>
                </MenuItem>
              </Select>
              {errors.proyecto && (
                <FormHelperText>{errors.proyecto}</FormHelperText>
              )}
            </FormControl>
          </Box>
        );
      case 3:
        return (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            sx={{ p: 3 }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                mb: 3,
                fontWeight: 600,
                color: theme.palette.primary.main
              }}
            >
              Resumen de la Actividad
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.default, 0.4),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Assignment sx={{ color: theme.palette.primary.main }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {formData.titulo || 'Sin título'}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: alpha(theme.palette.text.primary, 0.8) }}>
                    {formData.descripcion || 'Sin descripción'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary">
                      Fecha
                    </Typography>
                  </Box>
                  <Typography variant="body1">{formData.fecha}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary">
                      Horario
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {formData.hora_inicio} - {formData.hora_fin}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CategoryIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary">
                      Tipo de Actividad
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {formData.tipo_actividad ? 'Tipo ' + formData.tipo_actividad : 'No seleccionado'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AssignmentIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary">
                      Proyecto
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {formData.proyecto ? 'Proyecto ' + formData.proyecto : 'No seleccionado'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.background.default, 0.9) }}>
      <Paper
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        elevation={3}
        sx={{
          width: { xs: '95%', sm: '80%', md: '70%', lg: '60%' },
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          boxShadow: theme.shadows[10]
        }}
      >
        <Box sx={{
          p: 3,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <IconButton
            onClick={onClose}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s'
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Registrar Nueva Actividad
          </Typography>
        </Box>

        <Box sx={{ px: 4, py: 3 }}>
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{
              '& .MuiStepConnector-line': {
                height: 3,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.08)
              },
              '& .MuiStepConnector-active .MuiStepConnector-line': {
                bgcolor: alpha(theme.palette.primary.main, 0.5)
              },
              '& .MuiStepConnector-completed .MuiStepConnector-line': {
                bgcolor: theme.palette.primary.main
              }
            }}
          >
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={() => (
                    <motion.div
                      initial={false}
                      animate={{
                        scale: index === activeStep ? 1.1 : 1,
                        opacity: index <= activeStep ? 1 : 0.5
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: index <= activeStep
                            ? theme.palette.primary.main
                            : alpha(theme.palette.primary.main, 0.12),
                          color: index <= activeStep
                            ? theme.palette.primary.contrastText
                            : theme.palette.text.secondary,
                          transition: 'all 0.3s ease',
                          boxShadow: index === activeStep
                            ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}`
                            : 'none'
                        }}
                      >
                        {step.icon}
                      </Box>
                    </motion.div>
                  )}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: index === activeStep ? 600 : 400,
                      color: index === activeStep
                        ? theme.palette.text.primary
                        : theme.palette.text.secondary
                    }}
                  >
                    {step.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      display: 'block',
                      mt: 0.5
                    }}
                  >
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          sx={{ mt: 4, mb: 2 }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
              }}
            >
              {error}
            </Alert>
          )}
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowBackIcon />}
          >
            Anterior
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            endIcon={loading ? <CircularProgress size={20} /> : null}
            disabled={loading}
          >
            {activeStep === steps.length - 1 ? 'Guardar' : 'Siguiente'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegistrarActividad;