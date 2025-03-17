import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Collapse,
  IconButton,
  useTheme,
  alpha,
  Fade,
  Grow,
  Avatar,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ApiService from '../services/api.service';
import { API_CONFIG } from '../config/api.config';
import DualView, { ViewType } from '../components/DualView';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

// Interfaces
interface Proyecto {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
  fecha_inicio?: Date;
  fecha_fin?: Date;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  activo: boolean;
}

interface ProyectosResponse {
  proyectos: Proyecto[];
}

const ProyectosInactivos = () => {
  const theme = useTheme();
  
  // Estados
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroProyecto, setFiltroProyecto] = useState<string>('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>('');
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [viewType, setViewType] = useState<ViewType>(() => {
    const savedView = localStorage.getItem('proyectosInactivosViewType') as ViewType;
    return savedView || 'table';
  });

  // Filtrar proyectos
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter(proyecto => {
      const nombreMatch = proyecto.nombre.toLowerCase().includes(filtroProyecto.toLowerCase()) ||
                         (proyecto.descripcion || '').toLowerCase().includes(filtroProyecto.toLowerCase());
      
      const fechaInicioMatch = !filtroFechaInicio || 
        (proyecto.fecha_inicio && format(new Date(proyecto.fecha_inicio), 'yyyy-MM-dd') >= filtroFechaInicio);
      
      const fechaFinMatch = !filtroFechaFin || 
        (proyecto.fecha_fin && format(new Date(proyecto.fecha_fin), 'yyyy-MM-dd') <= filtroFechaFin);

      return nombreMatch && fechaInicioMatch && fechaFinMatch;
    });
  }, [proyectos, filtroProyecto, filtroFechaInicio, filtroFechaFin]);

  // Cargar proyectos inactivos al iniciar
  useEffect(() => {
    fetchProyectosInactivos();
  }, []);

  // Función para obtener los proyectos inactivos
  const fetchProyectosInactivos = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get<ProyectosResponse>(API_CONFIG.ENDPOINTS.PROYECTOS.BASE);
      // Filtrar solo los proyectos inactivos
      const proyectosInactivos = response.proyectos.filter((p) => !p.activo);
      setProyectos(proyectosInactivos);
    } catch (error) {
      console.error('Error al obtener proyectos inactivos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Activar proyecto
  const handleActivarProyecto = async (proyecto: Proyecto) => {
    try {
      await ApiService.patch(API_CONFIG.ENDPOINTS.PROYECTOS.ACTIVAR(proyecto.id));
      await fetchProyectosInactivos();
    } catch (error) {
      console.error('Error al activar el proyecto:', error);
    }
  };

  // Renderizar chip de estado
  const renderEstadoChip = (estado: string) => {
    const estados = {
      planificado: {
        label: 'Planificado',
        color: theme.palette.info.main,
        icon: <CalendarTodayIcon />
      },
      en_progreso: {
        label: 'En Progreso',
        color: theme.palette.warning.main,
        icon: <AccessTimeIcon />
      },
      completado: {
        label: 'Completado',
        color: theme.palette.success.main,
        icon: <CheckCircleIcon />
      },
      cancelado: {
        label: 'Cancelado',
        color: theme.palette.error.main,
        icon: <AssignmentIcon />
      }
    };

    const estadoConfig = estados[estado as keyof typeof estados];
    
    return (
      <Chip 
        label={estadoConfig.label}
        size="small"
        icon={estadoConfig.icon}
        sx={{ 
          bgcolor: alpha(estadoConfig.color, 0.1),
          color: estadoConfig.color,
          fontWeight: 500,
          '& .MuiChip-icon': { color: estadoConfig.color }
        }}
      />
    );
  };

  // Definición de columnas para el DataGrid
  const columns: GridColDef[] = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 200,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params: GridRenderCellParams<Proyecto>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              mr: 2
            }}
          >
            <AssignmentIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {params.row.nombre}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams<Proyecto>) => (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {renderEstadoChip(params.row.estado)}
        </Box>
      ),
    },
    {
      field: 'fecha_inicio',
      headerName: 'Fecha Inicio',
      width: 180,
      type: 'date',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params: { row: Proyecto | undefined | null }) => {
        if (!params?.row) return null;
        return params.row.fecha_inicio ? new Date(params.row.fecha_inicio) : null;
      },
      renderCell: (params: GridRenderCellParams<Proyecto>) => (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 24,
              height: 24,
              mr: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 14 }} />
          </Avatar>
          <Typography variant="body2">
            {params.row.fecha_inicio ? format(new Date(params.row.fecha_inicio), 'dd/MM/yyyy', { locale: es }) : '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'fecha_fin',
      headerName: 'Fecha Fin',
      width: 180,
      type: 'date',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params: { row: Proyecto | undefined | null }) => {
        if (!params?.row) return null;
        return params.row.fecha_fin ? new Date(params.row.fecha_fin) : null;
      },
      renderCell: (params: GridRenderCellParams<Proyecto>) => (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 24,
              height: 24,
              mr: 1,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.main,
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 14 }} />
          </Avatar>
          <Typography variant="body2">
            {params.row.fecha_fin ? format(new Date(params.row.fecha_fin), 'dd/MM/yyyy', { locale: es }) : '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'fecha_actualizacion',
      headerName: 'Última Actualización',
      width: 180,
      type: 'date',
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params: { row: Proyecto | undefined | null }) => {
        if (!params?.row) return null;
        return new Date(params.row.fecha_actualizacion);
      },
      renderCell: (params: GridRenderCellParams<Proyecto>) => (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 24,
              height: 24,
              mr: 1,
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main,
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 14 }} />
          </Avatar>
          <Typography variant="body2">
            {format(new Date(params.row.fecha_actualizacion), 'dd/MM/yyyy', { locale: es })}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams<Proyecto>) => (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleActivarProyecto(params.row)}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              borderColor: alpha(theme.palette.success.main, 0.3),
              color: theme.palette.success.main,
              '&:hover': {
                borderColor: theme.palette.success.main,
                backgroundColor: alpha(theme.palette.success.main, 0.05),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 8px ${alpha(theme.palette.success.main, 0.15)}`,
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Activar
          </Button>
        </Box>
      ),
    },
  ];

  // Renderizar vista de tabla con DataGrid
  const renderTable = () => {
    return (
      <Box sx={{ 
        width: '100%',
        '& .MuiDataGrid-root': {
          border: 'none',
          borderRadius: '16px',
          bgcolor: 'background.paper',
        }
      }}>
        <DataGrid
          rows={proyectosFiltrados}
          columns={columns}
          loading={loading}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          disableRowSelectionOnClick
          autoHeight
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          getRowHeight={() => 'auto'}
          sx={{
            '& .MuiDataGrid-cell': {
              borderColor: alpha(theme.palette.divider, 0.1),
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '64px !important',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderRadius: '16px 16px 0 0',
              minHeight: '56px !important',
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              minHeight: '52px !important',
            },
            '& .MuiDataGrid-virtualScroller': {
              bgcolor: alpha(theme.palette.background.paper, 0.8),
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                p: 3,
              }}>
                <AssignmentIcon 
                  sx={{ 
                    fontSize: 64,
                    color: alpha(theme.palette.text.secondary, 0.2),
                    mb: 2
                  }}
                />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No hay proyectos inactivos
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Todos los proyectos están actualmente activos
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchProyectosInactivos}
                  sx={{ 
                    borderRadius: '12px',
                    textTransform: 'none',
                  }}
                >
                  Actualizar Lista
                </Button>
              </Box>
            ),
            loadingOverlay: () => (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%'
              }}>
                <Typography variant="body2" color="text.secondary">
                  Cargando proyectos...
                </Typography>
              </Box>
            ),
          }}
        />
      </Box>
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
                Proyectos Inactivos
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
                      Proyectos Inactivos
                    </Typography>
                  </Box>
                </Box>

                <DualView
                  viewType={viewType}
                  onViewChange={setViewType}
                  storageKey="proyectosInactivosViewType"
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Encabezado con búsqueda y botones */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3
        }}>
          <TextField
            placeholder="Buscar proyectos..."
            variant="outlined"
            size="small"
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: filtroProyecto ? (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => setFiltroProyecto('')}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                borderRadius: 2,
                bgcolor: 'background.paper',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.2)
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                },
                width: { xs: '100%', sm: '300px' }
              }
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<FilterListIcon />}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              variant={mostrarFiltros ? "contained" : "outlined"}
              color="primary"
              size="small"
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: mostrarFiltros ? 1 : 'none'
              }}
            >
              {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </Box>
        </Box>

        {/* Panel de filtros colapsable */}
        <Collapse in={mostrarFiltros} timeout="auto">
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mr: 2,
                }}
              >
                <FilterListIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Filtros avanzados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Refina tu búsqueda por fechas
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Fecha inicio desde"
                  type="date"
                  fullWidth
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { fontWeight: 500 }
                  }}
                  InputProps={{
                    sx: {
                      borderRadius: '12px',
                      bgcolor: 'background.paper',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Fecha fin hasta"
                  type="date"
                  fullWidth
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { fontWeight: 500 }
                  }}
                  InputProps={{
                    sx: {
                      borderRadius: '12px',
                      bgcolor: 'background.paper',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  fullWidth
                  variant="outlined" 
                  onClick={() => {
                    setFiltroFechaInicio('');
                    setFiltroFechaFin('');
                  }}
                  startIcon={<RefreshIcon />}
                  sx={{ 
                    borderRadius: '12px',
                    height: '56px',
                    textTransform: 'none',
                    fontWeight: 500,
                    borderColor: alpha(theme.palette.divider, 0.2),
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                >
                  Restablecer
                </Button>
                <Button 
                  fullWidth
                  variant="contained" 
                  onClick={fetchProyectosInactivos}
                  startIcon={<SearchIcon />}
                  sx={{ 
                    borderRadius: '12px',
                    height: '56px',
                    textTransform: 'none',
                    fontWeight: 500,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Buscar
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* Lista de Proyectos Inactivos */}
        <Grow in={!loading} timeout={500}>
          <Box>
            {proyectosFiltrados.length === 0 ? (
              // Mensaje cuando no hay proyectos inactivos
              <Grid item xs={12}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4,
                    textAlign: 'center',
                    borderRadius: '16px',
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <AssignmentIcon 
                    sx={{ 
                      fontSize: 64,
                      color: alpha(theme.palette.text.secondary, 0.2),
                      mb: 2
                    }}
                  />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No hay proyectos inactivos
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Todos los proyectos están actualmente activos
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchProyectosInactivos}
                    sx={{ 
                      borderRadius: '12px',
                      textTransform: 'none',
                    }}
                  >
                    Actualizar Lista
                  </Button>
                </Paper>
              </Grid>
            ) : (
              renderTable()
            )}
          </Box>
        </Grow>
      </Box>
    </Fade>
  );
};

export default ProyectosInactivos; 