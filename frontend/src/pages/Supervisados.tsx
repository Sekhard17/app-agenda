import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  alpha,
  useTheme,
  Avatar,
  Card,
  CardContent,
  InputAdornment,
  Fade,
  Zoom,
  Grow,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Add as AddIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Home as HomeIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_CONFIG } from '../config/api.config';

// Interfaces
interface Usuario {
  id: string;
  rut: string;
  nombres: string;
  appaterno: string;
  apmaterno: string;
  email: string;
  rol: 'funcionario' | 'supervisor';
  id_supervisor?: string;
  nombre_usuario: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

interface EstadisticasSupervisado {
  total_actividades: number;
  actividades_completadas: number;
  actividades_pendientes: number;
  proyectos_asignados: number;
  horas_registradas_mes: number;
}

const Supervisados: React.FC = () => {
  const theme = useTheme();
  const { } = useAuth();
  const token = Cookies.get('auth_token');

  // Estados
  const [supervisados, setSupervisados] = useState<Usuario[]>([]);
  const [estadisticas, setEstadisticas] = useState<{ [key: string]: EstadisticasSupervisado }>({});
  const [loading, setLoading] = useState(true);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSupervisado, setSelectedSupervisado] = useState<Usuario | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Nuevos estados para la vista
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    const savedView = localStorage.getItem('supervisadosViewMode');
    return (savedView as 'table' | 'cards') || 'table';
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Efecto para cargar supervisados
  useEffect(() => {
    fetchSupervisados();
  }, []);

  // Efecto para cargar estadísticas cuando se tienen los supervisados
  useEffect(() => {
    if (supervisados.length > 0) {
      fetchEstadisticas();
    }
  }, [supervisados]);

  // Efecto para guardar la preferencia de vista
  useEffect(() => {
    localStorage.setItem('supervisadosViewMode', viewMode);
  }, [viewMode]);

  // Función para obtener supervisados
  const fetchSupervisados = async () => {
    try {
      setLoading(true);
      // Usar directamente la URL base definida en API_CONFIG
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USUARIOS.SUPERVISADOS}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      setSupervisados(response.data.supervisados || []);
    } catch (error) {
      console.error('Error al obtener supervisados:', error);
      mostrarSnackbar('Error al cargar los supervisados', 'error');
    } finally {
      // Asegurar que el loading termine si no hay supervisados
      if (!supervisados.length) {
        setLoading(false);
      }
    }
  };

  // Función para obtener estadísticas reales de cada supervisado
  const fetchEstadisticas = async () => {
    const estadisticasTemp: { [key: string]: EstadisticasSupervisado } = {};
    
    try {
      for (const supervisado of supervisados) {
        // Usar el endpoint de estadísticas de usuario
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ESTADISTICAS.USUARIO(supervisado.id)}`;
        const response = await axios.get(
          url,
          {
            headers: {
              Authorization: 'Bearer ' + token
            }
          }
        );
        estadisticasTemp[supervisado.id] = response.data;
      }
      setEstadisticas(estadisticasTemp);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      mostrarSnackbar('Error al cargar las estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar snackbar
  const mostrarSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Función para cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Función para abrir diálogo de detalles
  const handleOpenDialog = (supervisado: Usuario) => {
    setSelectedSupervisado(supervisado);
    setOpenDialog(true);
  };

  // Función para cerrar diálogo de detalles
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSupervisado(null);
  };

  // Filtrar supervisados
  const supervisadosFiltrados = supervisados.filter((supervisado) => {
    const nombreCompleto = (supervisado.nombres + ' ' + supervisado.appaterno + ' ' + supervisado.apmaterno).toLowerCase();
    return nombreCompleto.includes(filtroNombre.toLowerCase());
  });

  // Función para cambiar el modo de vista
  const handleViewModeChange = (mode: 'table' | 'cards') => {
    setViewMode(mode);
    setPage(0); // Resetear la página al cambiar de vista
  };

  return (
    <Fade in={true} timeout={800}>
      <Box>
        {/* Encabezado */}
        <Box
          sx={{
            position: 'relative',
            mb: 4
          }}
        >
          {/* Header Content */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              {/* Title */}
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', md: '1.75rem' },
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.5px'
                }}
              >
                Supervisados
              </Typography>

              {/* Breadcrumb y Botones */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  py: 1,
                  px: 2
                }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: theme.palette.primary.dark,
                        transform: 'translateY(-1px)'
                      }
                    }}
                    component="a"
                    href="/"
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'inherit'
                      }}
                    >
                      <HomeIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography
                      sx={{
                        ml: 1,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'inherit'
                      }}
                    >
                      Inicio
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: theme.palette.text.primary
                    }}
                  >
                    <Typography sx={{ mx: 1, color: theme.palette.text.secondary }}>/</Typography>
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography
                      sx={{
                        ml: 1,
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      Supervisados
                    </Typography>
                  </Box>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto' }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Vista de tabla" arrow>
                    <IconButton 
                      onClick={() => handleViewModeChange('table')}
                      sx={{ 
                        borderRadius: '12px',
                        backgroundColor: viewMode === 'table' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        color: viewMode === 'table' ? theme.palette.primary.main : theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: viewMode === 'table' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <ViewListIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Vista de tarjetas" arrow>
                    <IconButton 
                      onClick={() => handleViewModeChange('cards')}
                      sx={{ 
                        borderRadius: '12px',
                        backgroundColor: viewMode === 'cards' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        color: viewMode === 'cards' ? theme.palette.primary.main : theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: viewMode === 'cards' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <ViewModuleIcon />
                    </IconButton>
                  </Tooltip>

                  <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        borderRadius: '12px',
                        px: 2,
                        py: 1,
                        ml: 1,
                        boxShadow: '0 4px 12px rgba(63, 81, 181, 0.2)',
                        background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(63, 81, 181, 0.3)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      Asignar Supervisado
                    </Button>
                  </Zoom>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Barra de búsqueda */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar supervisados por nombre..."
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                },
                '&.Mui-focused': {
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                transition: 'all 0.2s ease-in-out',
              },
            }}
          />
        </Box>

        {/* Vista principal de supervisados */}
        <Grow in={true} style={{ transformOrigin: '0 0 0' }} timeout={800}>
          <Card 
            sx={{ 
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                  <CircularProgress />
                </Box>
              ) : supervisadosFiltrados.length > 0 ? (
                viewMode === 'table' ? (
                  // Vista de tabla
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableCell sx={{ fontWeight: 600, py: 2 }}>Funcionario</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>RUT</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Estadísticas</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {supervisadosFiltrados
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((supervisado) => (
                              <TableRow 
                                key={supervisado.id}
                                hover
                                sx={{
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                                  },
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar 
                                      sx={{ 
                                        mr: 2,
                                        bgcolor: theme.palette.primary.main,
                                        color: theme.palette.primary.contrastText,
                                      }}
                                    >
                                      {supervisado.nombres.charAt(0)}{supervisado.appaterno.charAt(0)}
                                    </Avatar>
                                    <Typography variant="body2" fontWeight={500}>
                                      {`${supervisado.nombres} ${supervisado.appaterno} ${supervisado.apmaterno || ''}`}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={supervisado.rol === 'funcionario' ? 'Funcionario' : 'Supervisor'} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      color: theme.palette.primary.main,
                                      fontWeight: 500,
                                      borderRadius: '6px',
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{supervisado.rut}</TableCell>
                                <TableCell>{supervisado.email}</TableCell>
                                <TableCell>
                                  {estadisticas[supervisado.id] && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Chip 
                                        size="small" 
                                        label={`${estadisticas[supervisado.id].actividades_completadas}/${estadisticas[supervisado.id].total_actividades} act.`}
                                        sx={{ 
                                          borderRadius: '6px',
                                          bgcolor: alpha(theme.palette.success.main, 0.1),
                                          color: theme.palette.success.main,
                                          fontWeight: 500,
                                        }}
                                      />
                                      <Chip 
                                        size="small" 
                                        label={`${estadisticas[supervisado.id].proyectos_asignados} proy.`}
                                        sx={{ 
                                          borderRadius: '6px',
                                          bgcolor: alpha(theme.palette.info.main, 0.1),
                                          color: theme.palette.info.main,
                                          fontWeight: 500,
                                        }}
                                      />
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => handleOpenDialog(supervisado)}
                                    sx={{
                                      borderRadius: '8px',
                                      textTransform: 'none',
                                      borderColor: alpha(theme.palette.primary.main, 0.3),
                                      '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                                      },
                                      transition: 'all 0.2s ease-in-out',
                                    }}
                                  >
                                    Detalles
                                  </Button>
                                </TableCell>
                              </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={supervisadosFiltrados.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={(_, newPage) => setPage(newPage)}
                      onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                      }}
                      labelRowsPerPage="Filas por página:"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    />
                  </>
                ) : (
                  // Vista de tarjetas
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {supervisadosFiltrados
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((supervisado) => (
                          <Grid item xs={12} sm={6} md={4} key={supervisado.id}>
                            <Card
                              sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '16px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                                },
                              }}
                            >
                              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                  <Avatar
                                    sx={{
                                      width: 56,
                                      height: 56,
                                      bgcolor: theme.palette.primary.main,
                                      fontSize: '1.5rem',
                                      fontWeight: 600,
                                      boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                                    }}
                                  >
                                    {supervisado.nombres.charAt(0)}{supervisado.appaterno.charAt(0)}
                                  </Avatar>
                                  <Box sx={{ ml: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                      {`${supervisado.nombres} ${supervisado.appaterno}`}
                                    </Typography>
                                    <Chip
                                      label={supervisado.rol === 'funcionario' ? 'Funcionario' : 'Supervisor'}
                                      size="small"
                                      sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        fontWeight: 500,
                                        borderRadius: '6px',
                                      }}
                                    />
                                  </Box>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <PersonIcon sx={{ fontSize: 20, mr: 1 }} />
                                    RUT: {supervisado.rut}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <EmailIcon sx={{ fontSize: 20, mr: 1 }} />
                                    {supervisado.email}
                                  </Typography>
                                </Box>

                                {estadisticas[supervisado.id] && (
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                      Estadísticas
                                    </Typography>
                                    <Grid container spacing={1}>
                                      <Grid item xs={6}>
                                        <Paper
                                          sx={{
                                            p: 1.5,
                                            textAlign: 'center',
                                            bgcolor: alpha(theme.palette.success.main, 0.1),
                                            borderRadius: '12px',
                                          }}
                                        >
                                          <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                                            {estadisticas[supervisado.id].actividades_completadas}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                                            Actividades Completadas
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Paper
                                          sx={{
                                            p: 1.5,
                                            textAlign: 'center',
                                            bgcolor: alpha(theme.palette.info.main, 0.1),
                                            borderRadius: '12px',
                                          }}
                                        >
                                          <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                                            {estadisticas[supervisado.id].proyectos_asignados}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: theme.palette.info.main }}>
                                            Proyectos Asignados
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                )}

                                <Button
                                  fullWidth
                                  variant="contained"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => handleOpenDialog(supervisado)}
                                  sx={{
                                    mt: 'auto',
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    py: 1,
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                                    '&:hover': {
                                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                                      transform: 'translateY(-1px)',
                                    },
                                  }}
                                >
                                  Ver Detalles
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <TablePagination
                        rowsPerPageOptions={[6, 12, 24]}
                        component="div"
                        count={supervisadosFiltrados.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(event) => {
                          setRowsPerPage(parseInt(event.target.value, 10));
                          setPage(0);
                        }}
                        labelRowsPerPage="Elementos por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                      />
                    </Box>
                  </Box>
                )
              ) : (
                supervisados.length === 0 ? (
                  <Box sx={{ p: 5, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        margin: '0 auto 16px',
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main
                      }}
                    >
                      <PeopleIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography color="text.primary" variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                      No tienes supervisados asignados
                    </Typography>
                    <Typography color="text.secondary" variant="body1" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                      Actualmente no hay funcionarios asignados a tu supervisión. 
                      Cuando se te asignen supervisados, aparecerán en esta página.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        borderRadius: '12px',
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 12px rgba(63, 81, 181, 0.2)',
                        background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(63, 81, 181, 0.3)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      Solicitar Asignación
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ p: 5, textAlign: 'center' }}>
                    <Typography color="text.secondary" variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                      No se encontraron resultados
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      No se encontraron supervisados con el filtro aplicado
                    </Typography>
                  </Box>
                )
              )}
            </CardContent>
          </Card>
        </Grow>

        {/* Diálogo de detalles */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          TransitionComponent={Zoom}
          PaperProps={{
            sx: {
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            },
          }}
        >
          {selectedSupervisado && (
            <>
              <DialogTitle sx={{ 
                py: 2.5, 
                px: 3,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Detalles del Supervisado
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Información y estadísticas de {selectedSupervisado.nombres} {selectedSupervisado.appaterno}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Información personal */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Información Personal
                    </Typography>
                    <List>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1), 
                            color: theme.palette.primary.main 
                          }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="subtitle2" color="text.secondary">Nombre Completo</Typography>}
                          secondary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {selectedSupervisado.nombres} {selectedSupervisado.appaterno} {selectedSupervisado.apmaterno}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1), 
                            color: theme.palette.primary.main 
                          }}>
                            <EmailIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="subtitle2" color="text.secondary">Correo Electrónico</Typography>}
                          secondary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {selectedSupervisado.email}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </Grid>

                  {/* Estadísticas */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Estadísticas
                    </Typography>
                    {estadisticas[selectedSupervisado.id] && (
                      <List>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar sx={{ 
                              bgcolor: alpha(theme.palette.info.main, 0.1), 
                              color: theme.palette.info.main 
                            }}>
                              <AssignmentIcon />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography variant="subtitle2" color="text.secondary">Actividades Totales</Typography>}
                            secondary={
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {estadisticas[selectedSupervisado.id].total_actividades}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar sx={{ 
                              bgcolor: alpha(theme.palette.success.main, 0.1), 
                              color: theme.palette.success.main 
                            }}>
                              <AssignmentTurnedInIcon />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography variant="subtitle2" color="text.secondary">Actividades Completadas</Typography>}
                            secondary={
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {estadisticas[selectedSupervisado.id].actividades_completadas}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar sx={{ 
                              bgcolor: alpha(theme.palette.warning.main, 0.1), 
                              color: theme.palette.warning.main 
                            }}>
                              <WorkIcon />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography variant="subtitle2" color="text.secondary">Proyectos Asignados</Typography>}
                            secondary={
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {estadisticas[selectedSupervisado.id].proyectos_asignados}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar sx={{ 
                              bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                              color: theme.palette.secondary.main 
                            }}>
                              <CalendarIcon />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography variant="subtitle2" color="text.secondary">Horas Registradas (Mes)</Typography>}
                            secondary={
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {estadisticas[selectedSupervisado.id].horas_registradas_mes}h
                              </Typography>
                            }
                          />
                        </ListItem>
                      </List>
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ 
                p: 3, 
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
              }}>
                <Button 
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{ 
                    borderRadius: '10px',
                    px: 3,
                    py: 1,
                    borderColor: alpha(theme.palette.divider, 0.2),
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.divider, 0.05),
                    },
                  }}
                >
                  Cerrar
                </Button>
                <Button 
                  variant="contained"
                  sx={{ 
                    borderRadius: '10px',
                    px: 3,
                    py: 1,
                    boxShadow: '0 4px 12px rgba(63, 81, 181, 0.2)',
                    background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(63, 81, 181, 0.3)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  Ver Actividades
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ 
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '10px',
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default Supervisados;
