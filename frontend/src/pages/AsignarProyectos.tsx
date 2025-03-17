import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  alpha,
  useTheme,
  Avatar,
  Fade,
  Zoom,
  Grow,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import { 
  PersonAdd as PersonAddIcon,
  LinkOff as LinkOffIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  LightbulbOutlined as TipIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_CONFIG } from '../config/api.config';
import DualView, { ViewType } from '../components/DualView';


// Interfaces
interface Proyecto {
  id: string;
  nombre: string;
  descripcion?: string;
  id_supervisor: string;
  id_externo_rex?: string;
  activo: boolean;
  estado: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
  fecha_inicio?: Date;
  fecha_fin?: Date;
  responsable_id?: string;
  presupuesto?: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

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



// Componente principal
const AsignarProyectos = () => {
  const theme = useTheme();
  const { } = useAuth();
  const token = Cookies.get('auth_token');
  
  // Estados
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [supervisados, setSupervisados] = useState<Usuario[]>([]);
  const [asignaciones, setAsignaciones] = useState<{[key: string]: string[]}>({});

  const [loadingSupervisados, setLoadingSupervisados] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedUsuario, setSelectedUsuario] = useState<string>('');
  const [selectedProyecto, setSelectedProyecto] = useState<string>('');
  const [filtroProyecto] = useState<string>('');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('');
  
  // Estado para paginación de tabla
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [viewType, setViewType] = useState<ViewType>(() => {
    const savedView = localStorage.getItem('asignarProyectosViewType') as ViewType;
    return savedView || 'table';
  });
  
  // Cargar datos al iniciar
  useEffect(() => {
    fetchProyectos();
    fetchSupervisados();
  }, []);

  // Cargar asignaciones cuando se tengan los supervisados
  useEffect(() => {
    if (supervisados.length > 0) {
      fetchAsignaciones();
    }
  }, [supervisados]);

  // Función para obtener los proyectos
  const fetchProyectos = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.BASE}?activo=true`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProyectos(response.data.proyectos || []);
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      mostrarSnackbar('Error al cargar los proyectos', 'error');
    }
  };

  // Función para obtener los supervisados
  const fetchSupervisados = async () => {
    setLoadingSupervisados(true);
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USUARIOS.BASE}/supervisados`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSupervisados(response.data.supervisados || []);
    } catch (error) {
      console.error('Error al obtener supervisados:', error);
      mostrarSnackbar('Error al cargar los supervisados', 'error');
    } finally {
      setLoadingSupervisados(false);
    }
  };

  // Función para obtener las asignaciones de proyectos
  const fetchAsignaciones = async () => {
    try {
      // Simulamos la obtención de asignaciones (esto se reemplazaría con una llamada a la API real)
      // En un sistema real, esta información vendría del backend
      const asignacionesSimuladas: {[key: string]: string[]} = {};
      
      // Para cada supervisado, obtenemos sus proyectos asignados
      for (const supervisado of supervisados) {
        try {
          const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.BY_USUARIO(supervisado.id)}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          asignacionesSimuladas[supervisado.id] = response.data.proyectos.map((p: any) => p.id);
        } catch (error) {
          console.error(`Error al obtener proyectos del usuario ${supervisado.id}:`, error);
          asignacionesSimuladas[supervisado.id] = [];
        }
      }
      
      setAsignaciones(asignacionesSimuladas);
    } catch (error) {
      console.error('Error al obtener asignaciones:', error);
      mostrarSnackbar('Error al cargar las asignaciones', 'error');
    }
  };

  // Función para mostrar snackbar
  const mostrarSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Abrir diálogo para asignar proyecto
  const handleOpenDialog = (supervisado?: Usuario) => {
    if (supervisado) {
      setSelectedUsuario(supervisado.id);
    }
    setOpenDialog(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Manejadores de paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Manejar cambios en selects
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name === 'usuario') {
      setSelectedUsuario(value);
    } else if (name === 'proyecto') {
      setSelectedProyecto(value);
    }
  };

  // Asignar proyecto a usuario
  const handleAsignarProyecto = async () => {
    if (!selectedUsuario || !selectedProyecto) {
      mostrarSnackbar('Debe seleccionar un usuario y un proyecto', 'error');
      return;
    }

    try {
      // Llamada a la API para asignar el proyecto
      await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.ASIGNAR(selectedUsuario)}`,
        { id_proyecto: selectedProyecto },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Actualizar el estado local
      setAsignaciones(prev => ({
        ...prev,
        [selectedUsuario]: [...(prev[selectedUsuario] || []), selectedProyecto]
      }));
      
      mostrarSnackbar('Proyecto asignado exitosamente', 'success');
      handleCloseDialog();
    } catch (error) {
      console.error('Error al asignar proyecto:', error);
      mostrarSnackbar('Error al asignar el proyecto', 'error');
    }
  };

  // Desasignar proyecto de usuario
  const handleDesasignarProyecto = async (usuarioId: string, proyectoId: string) => {
    try {
      // Llamada a la API para desasignar el proyecto
      await axios.delete(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROYECTOS.DESASIGNAR(usuarioId, proyectoId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Actualizar el estado local
      setAsignaciones(prev => ({
        ...prev,
        [usuarioId]: prev[usuarioId].filter(id => id !== proyectoId)
      }));
      
      mostrarSnackbar('Proyecto desasignado exitosamente', 'success');
    } catch (error) {
      console.error('Error al desasignar proyecto:', error);
      mostrarSnackbar('Error al desasignar el proyecto', 'error');
    }
  };

  // Filtrar supervisados
  const supervisadosFiltrados = supervisados.filter(supervisado => {
    if (filtroUsuario) {
      const nombreCompleto = `${supervisado.nombres} ${supervisado.appaterno} ${supervisado.apmaterno || ''}`.toLowerCase();
      return nombreCompleto.includes(filtroUsuario.toLowerCase()) || 
             supervisado.rut.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
             supervisado.nombre_usuario.toLowerCase().includes(filtroUsuario.toLowerCase());
    }
    return true;
  });

  // Filtrar proyectos
  const proyectosFiltrados = proyectos.filter(proyecto => {
    if (filtroProyecto) {
      return proyecto.nombre.toLowerCase().includes(filtroProyecto.toLowerCase()) ||
             (proyecto.descripcion && proyecto.descripcion.toLowerCase().includes(filtroProyecto.toLowerCase()));
    }
    return true;
  });



  // Renderizar chip de estado
  const renderEstadoChip = (estado: string) => {
    switch (estado) {
      case 'planificado':
        return (
          <Chip 
            label="Planificado" 
            size="small"
            sx={{ 
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.main,
              fontWeight: 500
            }} 
          />
        );
      case 'en_progreso':
        return (
          <Chip 
            label="En Progreso" 
            size="small"
            sx={{ 
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              color: theme.palette.warning.main,
              fontWeight: 500
            }} 
          />
        );
      case 'completado':
        return (
          <Chip 
            label="Completado" 
            size="small"
            sx={{ 
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main,
              fontWeight: 500
            }} 
          />
        );
      case 'cancelado':
        return (
          <Chip 
            label="Cancelado" 
            size="small"
            sx={{ 
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              fontWeight: 500
            }} 
          />
        );
      default:
        return null;
    }
  };

  // Renderizar vista de tarjetas
  const renderCards = () => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const supervisadosPaginados = supervisadosFiltrados.slice(startIndex, endIndex);

    return (
      <Grid container spacing={3}>
        {supervisadosPaginados.map((supervisado) => {
          const proyectosAsignados = asignaciones[supervisado.id] || [];
          
          return (
            <Grid item xs={12} sm={6} md={4} key={supervisado.id}>
              <Card 
                sx={{ 
                  borderRadius: '16px',
                  height: '100%',
                  position: 'relative',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.1)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        bgcolor: theme.palette.primary.main,
                        mr: 2
                      }}
                    >
                      {supervisado.nombres[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h2" fontWeight={600}>
                        {`${supervisado.nombres} ${supervisado.appaterno}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {supervisado.rut}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Proyectos Asignados ({proyectosAsignados.length})
                  </Typography>

                  <List dense>
                    {proyectosAsignados.map((proyectoId) => {
                      const proyecto = proyectos.find(p => p.id === proyectoId);
                      if (!proyecto) return null;

                      return (
                        <ListItem 
                          key={proyecto.id}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => handleDesasignarProyecto(supervisado.id, proyecto.id)}
                              sx={{ 
                                color: theme.palette.error.main,
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                },
                              }}
                            >
                              <LinkOffIcon fontSize="small" />
                            </IconButton>
                          }
                          sx={{
                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                            borderRadius: '8px',
                            mb: 1,
                          }}
                        >
                          <ListItemText 
                            primary={proyecto.nombre}
                            primaryTypographyProps={{
                              variant: 'body2',
                              fontWeight: 500,
                            }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={() => handleOpenDialog(supervisado)}
                    sx={{ 
                      mt: 2,
                      borderRadius: '12px',
                      textTransform: 'none',
                    }}
                  >
                    Asignar Proyecto
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // Renderizar vista de tabla
  const renderTable = () => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const supervisadosPaginados = supervisadosFiltrados.slice(startIndex, endIndex);

    return (
      <TableContainer component={Paper} sx={{ borderRadius: '16px', mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Funcionario</TableCell>
              <TableCell>RUT</TableCell>
              <TableCell>Proyectos Asignados</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {supervisadosPaginados.map((supervisado) => {
              const proyectosAsignados = asignaciones[supervisado.id] || [];
              
              return (
                <TableRow key={supervisado.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: theme.palette.primary.main,
                          mr: 2
                        }}
                      >
                        {supervisado.nombres[0]}
                      </Avatar>
                      <Typography variant="body2">
                        {`${supervisado.nombres} ${supervisado.appaterno}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{supervisado.rut}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {proyectosAsignados.map((proyectoId) => {
                        const proyecto = proyectos.find(p => p.id === proyectoId);
                        if (!proyecto) return null;

                        return (
                          <Chip
                            key={proyecto.id}
                            label={proyecto.nombre}
                            size="small"
                            onDelete={() => handleDesasignarProyecto(supervisado.id, proyecto.id)}
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '& .MuiChip-deleteIcon': {
                                color: theme.palette.error.main,
                                '&:hover': {
                                  color: theme.palette.error.dark,
                                },
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PersonAddIcon />}
                      onClick={() => handleOpenDialog(supervisado)}
                      sx={{ 
                        borderRadius: '8px',
                        textTransform: 'none',
                      }}
                    >
                      Asignar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
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
                Asignar Proyectos
              </Typography>

              {/* Breadcrumb y Botones de Vista */}
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
                      <AssignmentIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography
                      sx={{
                        ml: 1,
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      Asignar Proyectos
                    </Typography>
                  </Box>
                </Box>

                <DualView
                  viewType={viewType}
                  onViewChange={setViewType}
                  storageKey="asignarProyectosViewType"
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Filtros */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre, RUT o usuario..."
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '12px',
                bgcolor: alpha(theme.palette.background.paper, 0.8),
              }
            }}
          />
        </Box>

        {/* Lista de Supervisados */}
        <Grow in={!loadingSupervisados} timeout={500}>
          <Box>
            {supervisadosFiltrados.length === 0 ? (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4,
                  textAlign: 'center',
                  borderRadius: '16px',
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                }}
              >
                <PersonIcon 
                  sx={{ 
                    fontSize: 64,
                    color: alpha(theme.palette.text.secondary, 0.2),
                    mb: 2
                  }}
                />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No se encontraron supervisados
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  No hay supervisados que coincidan con los filtros seleccionados
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchSupervisados}
                  sx={{ 
                    borderRadius: '12px',
                    textTransform: 'none',
                  }}
                >
                  Actualizar Lista
                </Button>
              </Paper>
            ) : (
              <>
                {viewType === 'cards' ? renderCards() : renderTable()}
                <TablePagination
                  component="div"
                  count={supervisadosFiltrados.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Filas por página"
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count}`
                  }
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </>
            )}
          </Box>
        </Grow>

        {/* Diálogo de asignación */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="sm"
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
                  Asignar Proyecto
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecciona el funcionario y el proyecto a asignar
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
                borderRadius: 3,
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
                  Asignar un proyecto a un funcionario le permitirá acceder a la información del proyecto y registrar avances. 
                  Los cambios se aplicarán inmediatamente después de la asignación.
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 1,
                    color: theme.palette.info.main,
                  }}
                >
                  <TipIcon fontSize="inherit" />
                  Tip: Puedes desasignar proyectos desde la tabla principal
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="usuario-label">Supervisado</InputLabel>
                  <Select
                    labelId="usuario-label"
                    id="usuario"
                    name="usuario"
                    value={selectedUsuario}
                    label="Supervisado"
                    onChange={handleSelectChange}
                    startAdornment={
                      <Box 
                        sx={{ 
                          ml: 1.5,
                          mr: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <PersonIcon 
                          fontSize="small" 
                          sx={{ 
                            color: theme.palette.primary.main,
                            opacity: 0.8
                          }} 
                        />
                      </Box>
                    }
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
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {supervisados.map((supervisado) => (
                      <MenuItem 
                        key={supervisado.id} 
                        value={supervisado.id}
                        sx={{
                          borderRadius: 1,
                          mx: 1,
                          my: 0.5,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: theme.palette.primary.main,
                              fontSize: '0.875rem',
                            }}
                          >
                            {supervisado.nombres.charAt(0)}{supervisado.appaterno.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {`${supervisado.nombres} ${supervisado.appaterno}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {supervisado.rut}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="proyecto-label">Proyecto</InputLabel>
                  <Select
                    labelId="proyecto-label"
                    id="proyecto"
                    name="proyecto"
                    value={selectedProyecto}
                    label="Proyecto"
                    onChange={handleSelectChange}
                    startAdornment={
                      <Box 
                        sx={{ 
                          ml: 1.5,
                          mr: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <AssignmentIcon 
                          fontSize="small" 
                          sx={{ 
                            color: theme.palette.primary.main,
                            opacity: 0.8
                          }} 
                        />
                      </Box>
                    }
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
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {proyectosFiltrados.map((proyecto) => (
                      <MenuItem 
                        key={proyecto.id} 
                        value={proyecto.id}
                        sx={{
                          borderRadius: 1,
                          mx: 1,
                          my: 0.5,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5 }}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: alpha(theme.palette.secondary.main, 0.1),
                              color: theme.palette.secondary.main,
                            }}
                          >
                            <AssignmentIcon fontSize="small" />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {proyecto.nombre}
                            </Typography>
                            {proyecto.descripcion && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '300px'
                                }}
                              >
                                {proyecto.descripcion}
                              </Typography>
                            )}
                          </Box>
                          {renderEstadoChip(proyecto.estado)}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions 
            sx={{ 
              p: 2.5,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              size="small"
              sx={{ 
                borderRadius: '8px',
                px: 2,
                borderColor: alpha(theme.palette.divider, 0.2),
                color: theme.palette.text.primary,
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.divider, 0.05),
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAsignarProyecto}
              variant="contained"
              size="small"
              disabled={!selectedUsuario || !selectedProyecto}
              sx={{ 
                borderRadius: '8px',
                px: 2,
                boxShadow: '0 4px 12px rgba(63, 81, 181, 0.2)',
                background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(63, 81, 181, 0.3)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: theme.palette.action.disabledBackground,
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Asignar Proyecto
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
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

export default AsignarProyectos;
