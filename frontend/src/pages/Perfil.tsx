import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import UsuariosService, { UsuarioDetalle, UsuarioActualizar } from '../services/usuarios.service';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  TextField,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  alpha,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  Container,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Domain as DomainIcon,
  VpnKey as VpnKeyIcon,
  SupervisorAccount as SupervisorAccountIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';

// Interfaz para las pestañas
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Componente TabPanel
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`perfil-tabpanel-${index}`}
      aria-labelledby={`perfil-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Función auxiliar para las pestañas
function a11yProps(index: number) {
  return {
    id: `perfil-tab-${index}`,
    'aria-controls': `perfil-tabpanel-${index}`,
  };
}

// Componente principal de la página de perfil
const Perfil = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioDetalle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<UsuarioActualizar>({
    nombres: '',
    appaterno: '',
    apmaterno: '',
    email: '',
    cargo: '',
    empresa: '',
    centro_costo: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Cargar los detalles del usuario
  useEffect(() => {
    const fetchUsuarioDetalle = async () => {
      if (usuario) {
        try {
          const detalle = await UsuariosService.getUsuarioDetalle(usuario.id);
          setUsuarioDetalle(detalle);
          setFormData({
            nombres: detalle.nombres || '',
            appaterno: detalle.appaterno || '',
            apmaterno: detalle.apmaterno || '',
            email: detalle.email || '',
            cargo: detalle.informacionLaboral?.cargo || detalle.cargo || '',
            empresa: detalle.informacionLaboral?.empresa?.nombre || detalle.empresa || '',
            centro_costo: detalle.informacionLaboral?.centroCosto?.nombre || detalle.centro_costo || '',
          });
        } catch (error) {
          console.error('Error al obtener detalles del usuario:', error);
          setMensaje({
            tipo: 'error',
            texto: 'No se pudo cargar la información del perfil',
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUsuarioDetalle();
  }, [usuario]);

  // Manejar cambio de pestañas
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Manejar cambios en el avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Crear preview del avatar
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar cambios en los campos de contraseña
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  // Guardar cambios del perfil
  const handleSaveProfile = async () => {
    if (!usuario) return;
    
    try {
      setLoading(true);
      
      // Actualizar avatar si se seleccionó uno nuevo
      if (avatarFile) {
        const avatarUrl = await UsuariosService.cambiarAvatar(usuario.id, avatarFile);
        formData.avatar = avatarUrl;
      }
      
      // Actualizar datos del perfil
      const usuarioActualizado = await UsuariosService.actualizarUsuario(usuario.id, formData);
      
      // Actualizar estado local
      if (usuarioDetalle) {
        setUsuarioDetalle({
          ...usuarioDetalle,
          ...usuarioActualizado,
          cargo: formData.cargo || usuarioDetalle.cargo,
          empresa: formData.empresa || usuarioDetalle.empresa,
          centro_costo: formData.centro_costo || usuarioDetalle.centro_costo,
        });
      }
      
      setMensaje({
        tipo: 'success',
        texto: 'Perfil actualizado correctamente',
      });
      
      setEditMode(false);
      setAvatarPreview(null);
      setAvatarFile(null);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMensaje({
        tipo: 'error',
        texto: 'Error al actualizar el perfil',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (!usuario) return;
    
    // Validar que las contraseñas coincidan
    if (passwordData.password !== passwordData.confirmPassword) {
      setMensaje({
        tipo: 'error',
        texto: 'Las contraseñas no coinciden',
      });
      return;
    }
    
    // Validar que la contraseña tenga al menos 8 caracteres
    if (passwordData.password.length < 8) {
      setMensaje({
        tipo: 'error',
        texto: 'La contraseña debe tener al menos 8 caracteres',
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Actualizar contraseña
      await UsuariosService.actualizarUsuario(usuario.id, {
        password: passwordData.password,
      });
      
      setMensaje({
        tipo: 'success',
        texto: 'Contraseña actualizada correctamente',
      });
      
      setShowPasswordDialog(false);
      setPasswordData({
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      setMensaje({
        tipo: 'error',
        texto: 'Error al actualizar la contraseña',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cerrar mensaje de notificación
  const handleCloseMensaje = () => {
    setMensaje(null);
  };

  // Renderizar cargando
  if (loading && !usuarioDetalle) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Renderizar contenido principal
  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        py: 0,
        px: { xs: 2, sm: 3, md: 4 },
        height: '100%',
        width: '100%',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          background: theme.palette.background.paper,
          position: 'relative',
          width: '100%',
          transform: 'none',
          transition: 'none',
        }}
      >
        {/* Header con gradiente */}
        <Box
          sx={{
            height: '150px',
            background: `linear-gradient(135deg, 
              ${theme.palette.primary.dark} 0%, 
              #1a237e 50%,
              #0d47a1 100%
            )`,
            position: 'relative',
            zIndex: 0,
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            },
          }}
        />

        {/* Contenedor principal */}
        <Box 
          sx={{ 
            px: { xs: 2, sm: 3, md: 4 }, 
            pb: 4, 
            mt: -14,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Grid container spacing={3}>
            {/* Columna izquierda - Información Personal */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  borderRadius: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  overflow: 'visible',
                  backgroundColor: theme.palette.background.paper,
                  position: 'relative',
                  zIndex: 2,
                  transform: 'none',
                  transition: 'none',
                  '&:hover': {
                    transform: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Avatar centrado */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mt: -10,
                    mb: 3,
                    position: 'relative' 
                  }}>
                    <Avatar
                      src={avatarPreview || usuarioDetalle?.avatar}
                      alt={usuarioDetalle?.nombres}
                      sx={{
                        width: { xs: 150, sm: 180 },
                        height: { xs: 150, sm: 180 },
                        border: `6px solid ${theme.palette.background.paper}`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        fontSize: { xs: '3rem', sm: '4rem' },
                        bgcolor: theme.palette.primary.main,
                      }}
                    >
                      {`${usuarioDetalle?.nombres?.charAt(0) || ''}${usuarioDetalle?.appaterno?.charAt(0) || ''}`}
                    </Avatar>
                    {editMode && (
                      <label htmlFor="avatar-input">
                        <input
                          accept="image/*"
                          id="avatar-input"
                          type="file"
                          style={{ display: 'none' }}
                          onChange={handleAvatarChange}
                        />
                        <IconButton
                          color="primary"
                          aria-label="Cambiar foto de perfil"
                          component="span"
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            backgroundColor: theme.palette.background.paper,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        >
                          <PhotoCameraIcon />
                        </IconButton>
                      </label>
                    )}
                  </Box>

                  {/* Información personal */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {usuarioDetalle?.nombres} {usuarioDetalle?.appaterno} {usuarioDetalle?.apmaterno}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                      }}
                    >
                      {usuarioDetalle?.email}
                    </Typography>
                  </Box>

                  {/* Badges */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        py: 1,
                        px: 3,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <PersonIcon fontSize="small" color="primary" />
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, color: theme.palette.primary.main }}
                      >
                        {usuarioDetalle?.rol === 'supervisor' ? 'Supervisor' : 'Funcionario'}
                      </Typography>
                    </Box>

                    {(usuarioDetalle?.informacionLaboral?.cargo || usuarioDetalle?.cargo) && (
                      <Box
                        sx={{
                          py: 1,
                          px: 3,
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <WorkIcon fontSize="small" color="info" />
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 600, color: theme.palette.info.main }}
                        >
                          {usuarioDetalle?.informacionLaboral?.cargo || usuarioDetalle?.cargo}
                        </Typography>
                      </Box>
                    )}

                    {(usuarioDetalle?.informacionLaboral?.empresa?.nombre || usuarioDetalle?.empresa) && (
                      <Box
                        sx={{
                          py: 1,
                          px: 3,
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <DomainIcon fontSize="small" color="success" />
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 600, color: theme.palette.success.main }}
                        >
                          {usuarioDetalle?.informacionLaboral?.empresa?.nombre || usuarioDetalle?.empresa}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Botones de acción */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    {!editMode ? (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => setEditMode(true)}
                        fullWidth
                        sx={{
                          borderRadius: '12px',
                          py: 1.5,
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                          transform: 'none',
                          transition: 'none',
                          '&:hover': {
                            transform: 'none',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                          }
                        }}
                      >
                        Editar Perfil
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => {
                            setEditMode(false);
                            setAvatarPreview(null);
                            setAvatarFile(null);
                            if (usuarioDetalle) {
                              setFormData({
                                nombres: usuarioDetalle.nombres || '',
                                appaterno: usuarioDetalle.appaterno || '',
                                apmaterno: usuarioDetalle.apmaterno || '',
                                email: usuarioDetalle.email || '',
                                cargo: usuarioDetalle.cargo || '',
                                empresa: usuarioDetalle.empresa || '',
                                centro_costo: usuarioDetalle.centro_costo || '',
                              });
                            }
                          }}
                          sx={{
                            borderRadius: '12px',
                            py: 1.5,
                            flex: 1,
                            transform: 'none',
                            transition: 'none',
                            '&:hover': {
                              transform: 'none'
                            }
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveProfile}
                          disabled={loading}
                          sx={{
                            borderRadius: '12px',
                            py: 1.5,
                            flex: 1,
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                            transform: 'none',
                            transition: 'none',
                            '&:hover': {
                              transform: 'none',
                              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                            }
                          }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
                        </Button>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Columna derecha - Información Laboral y Detalles */}
            <Grid item xs={12} md={8}>
              <Card
                sx={{
                  borderRadius: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  overflow: 'visible',
                  backgroundColor: theme.palette.background.paper,
                  position: 'relative',
                  zIndex: 2,
                  transform: 'none',
                  transition: 'none',
                  '&:hover': {
                    transform: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 3,
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      position: 'relative',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -8,
                        left: 0,
                        width: 40,
                        height: 4,
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 2,
                      },
                    }}
                  >
                    Información Personal y Laboral
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Campos de información personal */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nombres"
                        name="nombres"
                        variant="outlined"
                        fullWidth
                        value={formData.nombres}
                        onChange={handleInputChange}
                        disabled={true}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Apellido Paterno"
                        name="appaterno"
                        variant="outlined"
                        fullWidth
                        value={formData.appaterno}
                        onChange={handleInputChange}
                        disabled={true}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Apellido Materno"
                        name="apmaterno"
                        variant="outlined"
                        fullWidth
                        value={formData.apmaterno || ''}
                        onChange={handleInputChange}
                        disabled={true}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Correo Electrónico"
                        name="email"
                        variant="outlined"
                        fullWidth
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>

                    {/* Campos de información laboral */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 3,
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                        }}
                      >
                        Información Laboral
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Empresa"
                        name="empresa"
                        variant="outlined"
                        fullWidth
                        value={formData.empresa || ''}
                        onChange={handleInputChange}
                        disabled={true}
                        helperText="Dato sincronizado desde el sistema REX"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <DomainIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Centro de Costo"
                        name="centro_costo"
                        variant="outlined"
                        fullWidth
                        value={formData.centro_costo || ''}
                        onChange={handleInputChange}
                        disabled={true}
                        helperText="Dato sincronizado desde el sistema REX"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <DomainIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Cargo"
                        name="cargo"
                        variant="outlined"
                        fullWidth
                        value={formData.cargo || ''}
                        onChange={handleInputChange}
                        disabled={true}
                        helperText="Dato sincronizado desde el sistema REX"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <WorkIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="RUT"
                        variant="outlined"
                        fullWidth
                        value={usuarioDetalle?.rut || ''}
                        disabled
                        helperText="Campo no editable"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Alert
                    severity="info"
                    sx={{
                      mt: 3,
                      borderRadius: '12px',
                      '& .MuiAlert-icon': {
                        alignItems: 'center',
                      },
                    }}
                  >
                    <Typography variant="body2">
                      Los datos laborales mostrados se sincronizan automáticamente con el sistema central REX.
                      Si requiere actualizar esta información, comuníquese con el departamento de recursos humanos.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>

              {/* Card de Seguridad */}
              <Card
                sx={{
                  borderRadius: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  mt: 3,
                  transform: 'none',
                  transition: 'none',
                  '&:hover': {
                    transform: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          color: theme.palette.warning.main,
                          width: 56,
                          height: 56,
                        }}
                      >
                        <VpnKeyIcon sx={{ fontSize: 28 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Seguridad de la Cuenta
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Cambia tu contraseña para mantener tu cuenta segura
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setShowPasswordDialog(true)}
                      sx={{
                        borderRadius: '12px',
                        py: 1.5,
                        px: 3,
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                        transform: 'none',
                        transition: 'none',
                        '&:hover': {
                          transform: 'none',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      Cambiar Contraseña
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Snackbar para mensajes */}
      {mensaje && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={handleCloseMensaje}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            elevation={6}
            variant="filled"
            onClose={handleCloseMensaje}
            severity={mensaje.tipo}
            sx={{ borderRadius: '12px' }}
          >
            {mensaje.texto}
          </Alert>
        </Snackbar>
      )}

      {/* Modal de cambio de contraseña */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${theme.palette.background.paper})`,
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            p: 3, 
            pb: 3,
            mb: 2,
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 24,
              right: 24,
              height: '1px',
              background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.5)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
          }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
              }}
            >
              <VpnKeyIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: theme.palette.text.primary }}>
                Cambiar Contraseña
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Ingresa y confirma tu nueva contraseña
              </Typography>
            </Box>
          </Box>
          <IconButton
            aria-label="cerrar"
            onClick={() => setShowPasswordDialog(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: theme.palette.grey[500],
              bgcolor: alpha(theme.palette.grey[100], 0.5),
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 4, mt: 2 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.text.primary, fontSize: '1rem' }}>
              Nueva Contraseña
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  placeholder="Ingresa tu nueva contraseña"
                  fullWidth
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="confirmPassword"
                  type="password"
                  variant="outlined"
                  placeholder="Confirma tu nueva contraseña"
                  fullWidth
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  helperText="La contraseña debe tener al menos 8 caracteres"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Alert
            severity="info"
            sx={{
              mt: 2,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              '& .MuiAlert-icon': {
                color: theme.palette.info.main,
              },
            }}
          >
            <Typography variant="body2">
              Por seguridad, usa una contraseña que:
              <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
                <li>Tenga al menos 8 caracteres</li>
                <li>Incluya números y letras</li>
                <li>Combine mayúsculas y minúsculas</li>
              </Box>
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions 
          sx={{ 
            p: 3, 
            pt: 2,
            background: alpha(theme.palette.background.paper, 0.5),
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Button
            onClick={() => setShowPasswordDialog(false)}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              px: 3,
              py: 1,
              color: theme.palette.grey[500],
              borderColor: theme.palette.grey[300],
              '&:hover': {
                borderColor: theme.palette.grey[400],
                bgcolor: alpha(theme.palette.grey[50], 0.5),
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            color="primary"
            disabled={loading || !passwordData.password || !passwordData.confirmPassword}
            sx={{
              borderRadius: '12px',
              px: 4,
              py: 1,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
              minWidth: 120,
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Perfil; 