import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  MenuItem, 
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  FormHelperText,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  CircularProgress,
  Stepper,
  Step,
  StepButton
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Send as SendIcon, 
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
  Work as WorkIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ActividadesService, { Actividad } from '../services/actividades.service';
import TiposActividadService, { TipoActividad } from '../services/tipos-actividad.service';
import ApiService from '../services/api.service';
import { API_CONFIG } from '../config/api.config';
import { isBefore, parseISO } from 'date-fns';

// Interfaz para los proyectos
interface Proyecto {
  id: string;
  nombre: string;
}

// Interfaz para la actividad a crear
interface ActividadForm {
  id_tipo_actividad: string; // UUID del tipo de actividad
  descripcion: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'borrador' | 'enviado';
  id_proyecto?: string;
}

const RegistrarActividad = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  
  // Estado para los tipos de actividad
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [cargandoTipos, setCargandoTipos] = useState(true);
  
  // Estado para la actividad
  const [actividad, setActividad] = useState<ActividadForm>({
    id_tipo_actividad: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fin: '18:00',
    estado: 'borrador',
  });
  
  // Estado para los proyectos disponibles
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  
  // Estado para errores de validación
  const [errores, setErrores] = useState<Record<string, string>>({});
  
  // Estado para notificaciones
  const [notificacion, setNotificacion] = useState({
    abierta: false,
    mensaje: '',
    tipo: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Estado para verificación de superposición
  const [verificandoSuperposicion, setVerificandoSuperposicion] = useState(false);
  const [tieneSuperposicion, setTieneSuperposicion] = useState(false);
  const [actividadesSuperposicion, setActividadesSuperposicion] = useState<Actividad[]>([]);
  
  // Nuevo estado para el paso activo
  const [pasoActivo, setPasoActivo] = useState(0);
  
  // Cargar tipos de actividad al iniciar
  useEffect(() => {
    const cargarTiposActividad = async () => {
      try {
        setCargandoTipos(true);
        const tipos = await TiposActividadService.obtenerTiposActividad();
        setTiposActividad(tipos);
        
        // Si hay tipos de actividad, seleccionar el primero por defecto
        if (tipos && tipos.length > 0) {
          setActividad(prev => ({
            ...prev,
            id_tipo_actividad: tipos[0].id
          }));
        }
      } catch (error) {
        console.error('Error al cargar tipos de actividad:', error);
        setTiposActividad([]);
      } finally {
        setCargandoTipos(false);
      }
    };
    
    cargarTiposActividad();
  }, []);
  
  // Cargar proyectos al iniciar
  useEffect(() => {
    const cargarProyectos = async () => {
      try {
        if (!usuario?.id) {
          console.warn('No hay ID de usuario disponible para cargar proyectos');
          return;
        }
        
        setCargandoProyectos(true);
        // Usar el endpoint correcto con el ID del usuario
        const response = await ApiService.get<any>(API_CONFIG.ENDPOINTS.PROYECTOS.BY_USUARIO(usuario.id));
        
        let proyectosData: Proyecto[] = [];
        if (response) {
          if (response.proyectos && Array.isArray(response.proyectos)) {
            proyectosData = response.proyectos;
          } else if (Array.isArray(response)) {
            proyectosData = response;
          }
        }
        
        setProyectos(proyectosData);
      } catch (error) {
        console.error('Error al cargar proyectos:', error);
        // No mostrar notificación para no interrumpir la experiencia del usuario
        // ya que los proyectos son opcionales
        setProyectos([]); // Establecer array vacío para evitar errores
      } finally {
        setCargandoProyectos(false);
      }
    };
    
    if (usuario) {
      cargarProyectos();
    }
  }, [usuario]);
  
  // Manejar cambios en los campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActividad(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error al cambiar el valor
    if (errores[name]) {
      setErrores(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Manejar cambios en selects
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setActividad(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error al cambiar el valor
    if (errores[name]) {
      setErrores(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Verificar superposición de horarios
  const verificarSuperposicion = async (): Promise<boolean> => {
    if (!actividad.fecha || !actividad.hora_inicio || !actividad.hora_fin) {
      return false;
    }
    
    try {
      setVerificandoSuperposicion(true);
      
      // Obtener actividades del usuario para la fecha seleccionada
      const actividadesUsuario = await ActividadesService.getActividadesUsuario();
      
      // Filtrar actividades para la fecha seleccionada
      const actividadesFecha = actividadesUsuario.filter(act => 
        act.fecha === actividad.fecha
      );
      
      // Verificar superposición
      const superposiciones = actividadesFecha.filter(act => {
        // Convertir horas a minutos para facilitar comparación
        const convertirAMinutos = (hora: string) => {
          const [h, m] = hora.split(':').map(Number);
          return h * 60 + m;
        };
        
        const inicioNuevo = convertirAMinutos(actividad.hora_inicio);
        const finNuevo = convertirAMinutos(actividad.hora_fin);
        const inicioExistente = convertirAMinutos(act.hora_inicio);
        const finExistente = convertirAMinutos(act.hora_fin);
        
        // Verificar si hay superposición
        return (
          (inicioNuevo <= inicioExistente && finNuevo > inicioExistente) || // Nuevo inicia antes y termina durante existente
          (inicioNuevo < finExistente && finNuevo >= finExistente) || // Nuevo inicia durante y termina después
          (inicioNuevo >= inicioExistente && finNuevo <= finExistente) // Nuevo está completamente dentro de existente
        );
      });
      
      setTieneSuperposicion(superposiciones.length > 0);
      setActividadesSuperposicion(superposiciones);
      
      return superposiciones.length === 0;
    } catch (error) {
      console.error('Error al verificar superposición:', error);
      return true; // En caso de error, permitir continuar
    } finally {
      setVerificandoSuperposicion(false);
    }
  };
  
  // Validar formulario
  const validarFormulario = async (): Promise<boolean> => {
    const nuevosErrores: Record<string, string> = {};
    
    if (!actividad.descripcion?.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria';
    }
    
    if (!actividad.fecha) {
      nuevosErrores.fecha = 'La fecha es obligatoria';
    } else {
      // Validar que la fecha no sea anterior a hoy
      const fechaSeleccionada = parseISO(actividad.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (isBefore(fechaSeleccionada, hoy)) {
        nuevosErrores.fecha = 'No se pueden registrar actividades en fechas pasadas';
      }
    }
    
    if (!actividad.hora_inicio) {
      nuevosErrores.hora_inicio = 'La hora de inicio es obligatoria';
    }
    
    if (!actividad.hora_fin) {
      nuevosErrores.hora_fin = 'La hora de fin es obligatoria';
    } else if (actividad.hora_inicio && actividad.hora_fin <= actividad.hora_inicio) {
      nuevosErrores.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
    }
    
    setErrores(nuevosErrores);
    
    // Si hay errores básicos, no continuar con la verificación de superposición
    if (Object.keys(nuevosErrores).length > 0) {
      return false;
    }
    
    // Verificar superposición de horarios
    const noHaySuperposicion = await verificarSuperposicion();
    
    return noHaySuperposicion;
  };
  
  // Manejar errores del backend
  const manejarErrorBackend = (error: any) => {
    console.error('Error al procesar actividad:', error);
    
    // Intentar extraer mensaje de error específico
    let mensajeError = 'Error al procesar la actividad. Por favor, intenta nuevamente.';
    
    if (error?.response?.data?.message) {
      mensajeError = error.response.data.message;
    } else if (error?.message) {
      // Detectar mensajes específicos del backend
      if (error.message.includes('superposición')) {
        mensajeError = 'Existe superposición de horarios con otra actividad';
      } else if (error.message.includes('días anteriores')) {
        mensajeError = 'No se pueden registrar actividades en fechas pasadas';
      }
    }
    
    setNotificacion({
      abierta: true,
      mensaje: mensajeError,
      tipo: 'error'
    });
  };
  
  // Guardar como borrador
  const guardarBorrador = async () => {
    const esValido = await validarFormulario();
    if (!esValido) return;
    
    try {
      // Preparar datos para enviar al backend
      const actividadData = {
        descripcion: actividad.descripcion,
        fecha: actividad.fecha,
        hora_inicio: actividad.hora_inicio,
        hora_fin: actividad.hora_fin,
        estado: 'borrador',
        id_usuario: usuario?.id,
        id_proyecto: actividad.id_proyecto || undefined,
        id_tipo_actividad: actividad.id_tipo_actividad
      };
      
      const resultado = await ActividadesService.crearActividad(actividadData as any);
      
      if (resultado) {
        setNotificacion({
          abierta: true,
          mensaje: 'Actividad guardada como borrador correctamente',
          tipo: 'success'
        });
        
        // Redireccionar después de un breve tiempo
        setTimeout(() => {
          navigate('/mis-actividades');
        }, 1500);
      } else {
        throw new Error('No se pudo guardar la actividad');
      }
    } catch (error) {
      manejarErrorBackend(error);
    }
  };
  
  // Enviar actividad
  const enviarActividad = async () => {
    const esValido = await validarFormulario();
    if (!esValido) return;
    
    try {
      // Preparar datos para enviar al backend
      const actividadData = {
        descripcion: actividad.descripcion,
        fecha: actividad.fecha,
        hora_inicio: actividad.hora_inicio,
        hora_fin: actividad.hora_fin,
        estado: 'enviado',
        id_usuario: usuario?.id,
        id_proyecto: actividad.id_proyecto || undefined,
        id_tipo_actividad: actividad.id_tipo_actividad
      };
      
      const resultado = await ActividadesService.crearActividad(actividadData as any);
      
      if (resultado) {
        setNotificacion({
          abierta: true,
          mensaje: 'Actividad enviada correctamente',
          tipo: 'success'
        });
        
        // Redireccionar después de un breve tiempo
        setTimeout(() => {
          navigate('/mis-actividades');
        }, 1500);
      } else {
        throw new Error('No se pudo enviar la actividad');
      }
    } catch (error) {
      manejarErrorBackend(error);
    }
  };
  
  // Limpiar formulario
  const limpiarFormulario = () => {
    setActividad({
      id_tipo_actividad: tiposActividad[0]?.id || '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: '09:00',
      hora_fin: '18:00',
      estado: 'borrador',
    });
    setErrores({});
    setTieneSuperposicion(false);
    setActividadesSuperposicion([]);
  };
  
  // Funciones para navegación de pasos
  const irSiguientePaso = () => {
    setPasoActivo((prevPaso) => prevPaso + 1);
  };

  const irPasoAnterior = () => {
    setPasoActivo((prevPaso) => prevPaso - 1);
  };

  const irAPaso = (paso: number) => {
    setPasoActivo(paso);
  };
  
  return (
    <Box 
      sx={{ 
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent'
      }}
    >
      {/* Breadcrumb elegante */}
      <Box sx={{ mb: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 1,
          pl: 0.5
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            '& > a, & > div': {
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              '&:not(:last-child):after': {
                content: '""',
                display: 'block',
                width: '6px',
                height: '6px',
                borderTop: `1.5px solid ${alpha(theme.palette.text.secondary, 0.4)}`,
                borderRight: `1.5px solid ${alpha(theme.palette.text.secondary, 0.4)}`,
                transform: 'rotate(45deg)',
                margin: '0 12px'
              }
            }
          }}>
            <Box 
              component="a" 
              href="/" 
              sx={{ 
                color: theme.palette.text.secondary,
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              <HomeIcon sx={{ fontSize: 16, mr: 0.75, opacity: 0.8 }} />
              Inicio
            </Box>
            
            <Box 
              component="a" 
              href="/mis-actividades" 
              sx={{ 
                color: theme.palette.text.secondary,
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              <FolderIcon sx={{ fontSize: 16, mr: 0.75, opacity: 0.8 }} />
              Mis Actividades
            </Box>
            
            <Box sx={{ 
              color: theme.palette.primary.main, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.85rem',
              py: 0.5,
              px: 1,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <SaveIcon sx={{ fontSize: 16, mr: 0.75 }} />
              Registrar
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Contenedor principal con efecto glassmorphism */}
      <Paper 
        elevation={0}
        sx={{ 
          flex: 1,
          width: '100%',
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.5)
            : alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          mt: 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: `linear-gradient(180deg, 
              ${alpha(theme.palette.primary.main, 0.05)} 0%, 
              ${alpha(theme.palette.background.paper, 0)} 100%)`,
            zIndex: 0
          }
        }}
      >
        {/* Stepper Horizontal Moderno */}
        <Stepper 
          activeStep={pasoActivo} 
          alternativeLabel
          sx={{ 
            mb: 5,
            pt: 2,
            position: 'relative',
            zIndex: 1,
            '& .MuiStepLabel-root': {
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.05)
              }
            },
            '& .MuiStepLabel-label': {
              mt: 1.5,
              fontSize: '0.9rem',
              fontWeight: 500,
              color: theme.palette.text.secondary,
              '&.Mui-active': {
                color: theme.palette.primary.main,
                fontWeight: 600
              }
            },
            '& .MuiStepIcon-root': {
              width: 35,
              height: 35,
              transition: 'all 0.3s ease',
              '&.Mui-active': {
                color: theme.palette.primary.main,
                transform: 'scale(1.2)',
                filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.4)})`
              },
              '&.Mui-completed': {
                color: theme.palette.success.main,
                filter: `drop-shadow(0 2px 8px ${alpha(theme.palette.success.main, 0.3)})`
              }
            },
            '& .MuiStepConnector-line': {
              borderColor: alpha(theme.palette.divider, 0.2),
              borderTopWidth: 2,
              borderRadius: 4
            },
            '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
              borderColor: theme.palette.primary.main
            },
            '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
              borderColor: theme.palette.success.main
            }
          }}
        >
          <Step>
            <StepButton onClick={() => irAPaso(0)}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexDirection: 'column',
                position: 'relative'
              }}>
                <Box sx={{
                  p: 1,
                  borderRadius: '50%',
                  background: pasoActivo === 0 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                  transition: 'all 0.3s ease'
                }}>
                  <DescriptionIcon sx={{ 
                    fontSize: 24,
                    color: pasoActivo === 0 
                      ? theme.palette.primary.main 
                      : theme.palette.text.secondary
                  }} />
                </Box>
                Información Básica
              </Box>
            </StepButton>
          </Step>
          <Step>
            <StepButton onClick={() => irAPaso(1)}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexDirection: 'column',
                position: 'relative'
              }}>
                <Box sx={{
                  p: 1,
                  borderRadius: '50%',
                  background: pasoActivo === 1 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                  transition: 'all 0.3s ease'
                }}>
                  <ScheduleIcon sx={{ 
                    fontSize: 24,
                    color: pasoActivo === 1 
                      ? theme.palette.primary.main 
                      : theme.palette.text.secondary
                  }} />
                </Box>
                Fecha y Horario
              </Box>
            </StepButton>
          </Step>
          <Step>
            <StepButton onClick={() => irAPaso(2)}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexDirection: 'column',
                position: 'relative'
              }}>
                <Box sx={{
                  p: 1,
                  borderRadius: '50%',
                  background: pasoActivo === 2 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                  transition: 'all 0.3s ease'
                }}>
                  <WorkIcon sx={{ 
                    fontSize: 24,
                    color: pasoActivo === 2 
                      ? theme.palette.primary.main 
                      : theme.palette.text.secondary
                  }} />
                </Box>
                Proyecto
              </Box>
            </StepButton>
          </Step>
        </Stepper>

        {/* Contenido del paso actual */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          '& > div': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.8),
            borderRadius: 3,
            p: { xs: 2, sm: 3 },
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backdropFilter: 'blur(10px)'
          }
        }}>
          {/* Paso 1: Información Básica */}
          <Box sx={{ 
            display: pasoActivo === 0 ? 'block' : 'none',
            '& .MuiTextField-root, & .MuiFormControl-root': {
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.default, 0.3)
                  : alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transition: 'all 0.3s ease',
                padding: '4px 8px',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.default, 0.4)
                    : alpha(theme.palette.background.paper, 0.9),
                },
                '&.Mui-focused': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha(theme.palette.background.paper, 1),
                },
                '& fieldset': {
                  borderWidth: 0
                },
                '& input, & textarea': {
                  padding: '12px 8px',
                  fontSize: '0.95rem',
                  '&::placeholder': {
                    opacity: 0.7
                  }
                },
                '& .MuiInputAdornment-root': {
                  marginRight: 1,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.2rem',
                    color: theme.palette.primary.main,
                    opacity: 0.8
                  }
                }
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.95rem',
                fontWeight: 500,
                transform: 'translate(14px, -8px) scale(0.85)',
                background: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.default, 0.8)
                  : alpha(theme.palette.background.paper, 0.9),
                padding: '0 8px',
                borderRadius: 4,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              },
              '& .MuiFormHelperText-root': {
                fontSize: '0.8rem',
                marginTop: 1,
                marginLeft: 1,
                opacity: 0.7
              }
            }
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="tipo-actividad-label">Tipo de Actividad</InputLabel>
                  <Select
                    labelId="tipo-actividad-label"
                    name="id_tipo_actividad"
                    value={actividad.id_tipo_actividad}
                    onChange={handleSelectChange}
                    required
                    disabled={cargandoTipos || tiposActividad.length === 0}
                  >
                    {tiposActividad.map((tipo) => (
                      <MenuItem key={tipo.id} value={tipo.id} sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            p: 1, 
                            borderRadius: 2, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            mr: 2
                          }}>
                            {tipo.icono}
                          </Box>
                          <Box>
                            <Typography variant="body1">{tipo.nombre}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tipo.descripcion}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Selecciona el tipo que mejor describa tu actividad
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  value={actividad.descripcion || ''}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  error={!!errores.descripcion}
                  helperText={errores.descripcion || 'Describe detalladamente la actividad realizada, incluyendo objetivos y resultados'}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& textarea': {
                        fontSize: '0.95rem',
                        lineHeight: 1.6
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Paso 2: Fecha y Horario */}
          <Box sx={{ 
            display: pasoActivo === 1 ? 'block' : 'none',
            '& .MuiTextField-root': {
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.default, 0.3)
                  : alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
                '&.Mui-focused': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                '& fieldset': {
                  borderWidth: 0
                }
              }
            }
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Fecha"
                  type="date"
                  name="fecha"
                  value={actividad.fecha || ''}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errores.fecha}
                  helperText={errores.fecha}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ 
                        mr: 1, 
                        color: theme.palette.primary.main,
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        📅
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hora de Inicio"
                  type="time"
                  name="hora_inicio"
                  value={actividad.hora_inicio || ''}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errores.hora_inicio}
                  helperText={errores.hora_inicio}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ 
                        mr: 1, 
                        color: theme.palette.primary.main,
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        ⏰
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hora de Fin"
                  type="time"
                  name="hora_fin"
                  value={actividad.hora_fin || ''}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errores.hora_fin}
                  helperText={errores.hora_fin}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ 
                        mr: 1, 
                        color: theme.palette.primary.main,
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        ⌛
                      </Box>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Paso 3: Proyecto */}
          <Box sx={{ 
            display: pasoActivo === 2 ? 'block' : 'none',
            '& .MuiFormControl-root': {
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.default, 0.3)
                  : alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
                '&.Mui-focused': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                '& fieldset': {
                  borderWidth: 0
                }
              }
            }
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="proyecto-label">Proyecto</InputLabel>
                  <Select
                    labelId="proyecto-label"
                    name="id_proyecto"
                    value={actividad.id_proyecto || ''}
                    label="Proyecto"
                    onChange={handleSelectChange}
                    disabled={cargandoProyectos || proyectos.length === 0}
                    displayEmpty
                    startAdornment={
                      <FolderIcon sx={{ 
                        ml: 1,
                        mr: 1, 
                        color: theme.palette.primary.main,
                        opacity: 0.7
                      }} />
                    }
                  >
                    {proyectos.length === 0 ? (
                      <MenuItem value="" disabled>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          py: 1
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay proyectos disponibles
                          </Typography>
                        </Box>
                      </MenuItem>
                    ) : (
                      proyectos.map((proyecto) => (
                        <MenuItem key={proyecto.id} value={proyecto.id}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            py: 1
                          }}>
                            <Box sx={{ 
                              width: 32,
                              height: 32,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 2
                            }}>
                              <FolderIcon sx={{ 
                                fontSize: 20,
                                color: theme.palette.primary.main
                              }} />
                            </Box>
                            <Typography>{proyecto.nombre}</Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>
                    Selecciona el proyecto asociado a esta actividad (opcional)
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Botones de navegación y acciones */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          pt: 3,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          position: 'relative',
          zIndex: 1
        }}>
          <Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={limpiarFormulario}
              sx={{ 
                borderRadius: 3,
                mr: 2,
                borderWidth: 2,
                padding: '10px 24px',
                fontSize: '0.9rem',
                textTransform: 'none',
                fontWeight: 600,
                letterSpacing: '0.5px',
                background: `linear-gradient(45deg, ${alpha(theme.palette.error.main, 0.05)}, ${alpha(theme.palette.error.light, 0.05)})`,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.light, 0.1)})`
                }
              }}
            >
              Limpiar
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {pasoActivo > 0 && (
              <Button
                variant="outlined"
                startIcon={<NavigateBeforeIcon />}
                onClick={irPasoAnterior}
                sx={{ 
                  borderRadius: 3,
                  borderWidth: 2,
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.light, 0.05)})`,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.1)})`
                  }
                }}
              >
                Anterior
              </Button>
            )}

            {pasoActivo < 2 && (
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={irSiguientePaso}
                sx={{ 
                  borderRadius: 3,
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                  }
                }}
              >
                Siguiente
              </Button>
            )}

            {pasoActivo === 2 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={guardarBorrador}
                  sx={{ 
                    borderRadius: 3,
                    borderWidth: 2,
                    padding: '10px 24px',
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.light, 0.05)})`,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.1)})`
                    }
                  }}
                >
                  Guardar Borrador
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={enviarActividad}
                  sx={{ 
                    borderRadius: 3,
                    padding: '10px 24px',
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                    }
                  }}
                >
                  Enviar Actividad
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* Alerta de superposición */}
      {tieneSuperposicion && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mt: 3, 
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.warning.light, 0.2),
            border: `1px solid ${theme.palette.warning.main}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <WarningIcon color="warning" />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                Superposición de horarios detectada
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                La actividad que intentas registrar se superpone con las siguientes actividades existentes:
              </Typography>
              <Box sx={{ mt: 1, ml: 2 }}>
                {actividadesSuperposicion.map((act, index) => (
                  <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
                    • {act.nombre || 'Actividad sin nombre'}: {act.hora_inicio} - {act.hora_fin}
                  </Typography>
                ))}
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Por favor, ajusta el horario para evitar superposiciones.
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* Notificaciones */}
      <Snackbar
        open={notificacion.abierta}
        autoHideDuration={6000}
        onClose={() => setNotificacion(prev => ({ ...prev, abierta: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotificacion(prev => ({ ...prev, abierta: false }))} 
          severity={notificacion.tipo}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notificacion.mensaje}
        </Alert>
      </Snackbar>
      
      {/* Indicador de carga durante verificación de superposición */}
      {verificandoSuperposicion && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        >
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              borderRadius: 2,
            }}
          >
            <CircularProgress />
            <Typography>Verificando disponibilidad de horario...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default RegistrarActividad;
