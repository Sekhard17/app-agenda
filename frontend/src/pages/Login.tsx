import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ParticlesBackground from '../components/ParticlesBackground';

// Esquema de validación con Zod
const loginSchema = z.object({
  nombre_usuario: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Tipo para los datos del formulario
type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { mode, toggleColorMode } = useContext(ThemeContext);
  const { login, error, loading, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Configuración del formulario con react-hook-form y zod
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nombre_usuario: '',
      password: '',
    },
  });

  // Manejar el envío del formulario
  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login(data);
      navigate('/');
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
      console.error('Error en el componente Login:', error);
    }
  };

  // Alternar la visibilidad de la contraseña
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Estado para controlar las animaciones
  const [showElements, setShowElements] = useState(false);

  // Efecto para activar las animaciones después de que el componente se monte
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowElements(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        inset: 0,
        padding: 0,
        margin: 0,
        overflow: 'hidden',
      }}
    >
      {/* Fondo animado de partículas */}
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <ParticlesBackground />
      </Box>

      {/* Botón para alternar el tema */}
      <Zoom in={showElements} timeout={800}>
        <IconButton
          onClick={toggleColorMode}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: theme.palette.text.primary,
            backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': { 
              transform: 'rotate(30deg)', 
              backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            },
            zIndex: 10,
          }}
          aria-label={`Cambiar a modo ${mode === 'light' ? 'oscuro' : 'claro'}`}
        >
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Zoom>

      <Box
        sx={{ 
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <Zoom in={showElements} timeout={800}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: { xs: '90%', sm: '450px' },
              maxWidth: '450px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: '16px',
              transition: 'all 0.3s ease-in-out',
              backdropFilter: 'blur(10px)',
              backgroundColor: mode === 'light' 
                ? 'rgba(255, 255, 255, 0.9)' 
                : 'rgba(30, 30, 30, 0.85)',
              boxShadow: mode === 'light'
                ? '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                : '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: mode === 'light'
                  ? '0 16px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  : '0 16px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              },
              margin: '0 auto',
            }}
          >
            {/* Logo con animación */}
            <Fade in={showElements} timeout={1200}>
              <Box
                component="img"
                src={mode === 'light' ? '/src/assets/images/logo_servicios.png' : '/src/assets/images/logo_servicios2.png'}
                alt="Logo"
                sx={{
                  width: isMobile ? '80%' : '60%',
                  maxWidth: 250,
                  mb: 3,
                  transition: 'transform 0.3s ease-in-out',
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              />
            </Fade>

            <Fade in={showElements} timeout={1400}>
              <Typography 
                component="h1" 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: theme.palette.text.primary,
                }}
              >
                Iniciar Sesión
              </Typography>
            </Fade>

            <Fade in={showElements} timeout={1600}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center" 
                sx={{ 
                  mb: 3,
                  maxWidth: '90%',
                  opacity: 0.8,
                }}
              >
                Ingresa tus credenciales para acceder a la Agenda de Actividades
              </Typography>
            </Fade>


          {/* Mensaje de error con animación */}
          {error && (
            <Fade in={true} timeout={500}>
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 2,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Formulario de login con animaciones */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: '100%' }}>
            <Fade in={showElements} timeout={1800}>
              <Box>
                <Controller
                  name="nombre_usuario"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      required
                      fullWidth
                      id="nombre_usuario"
                      label="Nombre de Usuario"
                      autoComplete="username"
                      autoFocus
                      error={!!errors.nombre_usuario}
                      helperText={errors.nombre_usuario?.message}
                      disabled={loading}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s ease-in-out',
                          '&.Mui-focused': {
                            boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.2)',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Fade>

            <Fade in={showElements} timeout={2000}>
              <Box>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      required
                      fullWidth
                      id="password"
                      label="Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                              sx={{
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: mode === 'light' 
                                    ? 'rgba(0, 0, 0, 0.04)' 
                                    : 'rgba(255, 255, 255, 0.08)',
                                },
                              }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s ease-in-out',
                          '&.Mui-focused': {
                            boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.2)',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Fade>

            <Fade in={showElements} timeout={2200}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={!loading && <LoginIcon />}
                sx={{
                  py: 1.5,
                  mt: 1,
                  mb: 2,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  position: 'relative',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" sx={{ position: 'absolute' }} />
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Fade>
          </Box>
        </Paper>
        </Zoom>

        <Fade in={showElements} timeout={2400}>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ 
              position: 'fixed',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              backdropFilter: 'blur(5px)',
              padding: '8px 16px',
              borderRadius: '20px',
              backgroundColor: mode === 'light' 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'rgba(0, 0, 0, 0.3)',
              zIndex: 10,
            }}
          >
            © {new Date().getFullYear()} Agenda de Actividades
          </Typography>
        </Fade>
      </Box>
    </Box>
  );
};

export default Login;
