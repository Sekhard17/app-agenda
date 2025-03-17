import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Chip,
  Paper,
  InputAdornment,
  alpha,
  useTheme,
  Tooltip,
  Fade,
  Zoom,
  Grow,
  Avatar,
  Divider,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useSnackbar } from 'notistack';
import TiposActividadService, { TipoActividad } from '../services/tipos-actividad.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import HomeIcon from '@mui/icons-material/Home';

interface FormData {
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  activo: boolean;
}

const TiposActividad: React.FC = () => {
  const theme = useTheme();
  const [tipos, setTipos] = useState<TipoActividad[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    icono: '',
    color: '#3f51b5',
    activo: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const cargarTipos = async () => {
    setLoading(true);
    try {
      const data = await TiposActividadService.obtenerTiposActividad(true);
      setTipos(data);
    } catch (error) {
      enqueueSnackbar('Error al cargar los tipos de actividad', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTipos();
  }, []);

  // Filtrar tipos de actividad basado en el término de búsqueda
  const tiposFiltrados = tipos.filter(tipo =>
    tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (tipo?: TipoActividad) => {
    if (tipo) {
      setFormData({
        nombre: tipo.nombre,
        descripcion: tipo.descripcion || '',
        icono: tipo.icono || '',
        color: tipo.color || '#3f51b5',
        activo: tipo.activo,
      });
      setEditingId(tipo.id);
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        icono: '',
        color: '#3f51b5',
        activo: true,
      });
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nombre: '',
      descripcion: '',
      icono: '',
      color: '#3f51b5',
      activo: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await TiposActividadService.actualizarTipoActividad(editingId, formData);
        enqueueSnackbar('Tipo de actividad actualizado correctamente', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
      } else {
        await TiposActividadService.crearTipoActividad(formData);
        enqueueSnackbar('Tipo de actividad creado correctamente', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
      }
      handleCloseDialog();
      cargarTipos();
    } catch (error) {
      enqueueSnackbar('Error al guardar el tipo de actividad', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea desactivar este tipo de actividad?')) {
      try {
        await TiposActividadService.desactivarTipoActividad(id);
        enqueueSnackbar('Tipo de actividad desactivado correctamente', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
        cargarTipos();
      } catch (error) {
        enqueueSnackbar('Error al desactivar el tipo de actividad', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
      }
    }
  };

  const columns: GridColDef[] = [
    { 
      field: 'nombre', 
      headerName: 'Nombre', 
      flex: 1,
      headerAlign: 'left',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: params.row.color || theme.palette.primary.main,
              color: theme.palette.getContrastText(params.row.color || theme.palette.primary.main),
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: `0 2px 4px ${alpha(params.row.color || theme.palette.primary.main, 0.4)}`,
            }}
          >
            {params.row.icono ? params.row.icono.charAt(0) : params.row.nombre.charAt(0)}
          </Avatar>
          <Typography variant="body1" fontWeight={500}>{params.row.nombre}</Typography>
        </Box>
      ),
    },
    { 
      field: 'descripcion', 
      headerName: 'Descripción', 
      flex: 2,
      headerAlign: 'left',
      renderCell: (params) => (
        <Box sx={{ py: 0.5 }}>
          <Tooltip title={params.row.descripcion || ''} arrow placement="top-start">
            <Typography variant="body2" sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              color: theme.palette.text.secondary,
              maxWidth: '100%',
            }}>
              {params.row.descripcion || ''}
            </Typography>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'activo',
      headerName: 'Estado',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%',
          py: 0.5,
        }}>
          <Chip
            label={params.row.activo ? 'Activo' : 'Inactivo'}
            color={params.row.activo ? 'success' : 'error'}
            size="small"
            sx={{
              fontWeight: 600,
              borderRadius: '6px',
              minWidth: '80px',
              height: '28px',
              '& .MuiChip-label': {
                px: 2,
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              },
              boxShadow: params.row.activo 
                ? `0 2px 4px ${alpha(theme.palette.success.main, 0.2)}`
                : `0 2px 4px ${alpha(theme.palette.error.main, 0.2)}`,
            }}
          />
        </Box>
      ),
    },
    {
      field: 'fecha_creacion',
      headerName: 'Fecha Creación',
      width: 200,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: ({ value }) => {
        if (!value) return '';
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) return 'Fecha inválida';
          return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
        } catch (error) {
          return 'Fecha inválida';
        }
      },
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%',
          py: 0.5,
        }}>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            fontWeight: 500,
          }}>
            {params.formattedValue}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', width: '100%', py: 0.5 }}>
          <Tooltip title="Editar" arrow>
            <IconButton 
              size="small" 
              onClick={() => handleOpenDialog(params.row)}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Desactivar" arrow>
            <IconButton 
              size="small" 
              onClick={() => handleDelete(params.row.id)}
              sx={{
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 8px ${alpha(theme.palette.error.main, 0.2)}`,
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

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
                Tipos de Actividad
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
                      <ColorLensIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography
                      sx={{
                        ml: 1,
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      Tipos de Actividad
                    </Typography>
                  </Box>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto' }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                      sx={{
                        borderRadius: '12px',
                        px: 2,
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
                      Nuevo Tipo
                    </Button>
                  </Zoom>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar tipos de actividad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <Tooltip title="Filtros avanzados" arrow>
            <IconButton 
              sx={{ 
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grow in={true} style={{ transformOrigin: '0 0 0' }} timeout={800}>
          <Paper 
            sx={{ 
              height: 'auto',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <DataGrid
              rows={tiposFiltrados}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              autoHeight
              loading={loading}
              localeText={esES.components.MuiDataGrid.defaultProps.localeText}
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
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No hay tipos de actividad
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Crea un nuevo tipo de actividad para comenzar
                    </Typography>
                  </Box>
                ),
                loadingOverlay: () => (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    p: 3,
                  }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      Cargando tipos de actividad...
                    </Typography>
                  </Box>
                ),
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderColor: alpha(theme.palette.divider, 0.1),
                  py: 1,
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#F5F7FF',
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                  },
                },
                '& .MuiDataGrid-row': {
                  '&:nth-of-type(even)': {
                    backgroundColor: alpha(theme.palette.background.default, 0.4),
                  },
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: alpha(theme.palette.primary.main, 0.01),
                },
                '& .MuiDataGrid-virtualScroller': {
                  backgroundColor: theme.palette.background.paper,
                },
                '& .MuiTablePagination-root': {
                  color: theme.palette.text.secondary,
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontWeight: 500,
                },
                '& .MuiTablePagination-select': {
                  borderRadius: '8px',
                },
                '& .MuiIconButton-root.Mui-disabled': {
                  opacity: 0.4,
                },
                '& .MuiDataGrid-toolbarContainer': {
                  padding: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.01),
                },
              }}
            />
          </Paper>
        </Grow>

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
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
          <DialogTitle sx={{ 
            py: 2.5, 
            px: 3,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {editingId ? 'Editar Tipo de Actividad' : 'Nuevo Tipo de Actividad'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {editingId ? 'Modifica los datos del tipo de actividad' : 'Completa el formulario para crear un nuevo tipo'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                fullWidth
                required
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '12px',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  } 
                }}
              />
              <TextField
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '12px',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  } 
                }}
              />
              <TextField
                label="Icono"
                value={formData.icono}
                onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                fullWidth
                variant="outlined"
                helperText="Nombre del icono de Material-UI (ej: AccessTime)"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '12px',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  } 
                }}
              />
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Color del tipo de actividad
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '12px',
                        height: 56,
                      },
                      '& input[type="color"]': {
                        width: '100%',
                        height: '56px',
                        padding: '0',
                        border: 'none',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '12px',
                      backgroundColor: formData.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${alpha(formData.color, 0.4)}`,
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <ColorLensIcon sx={{ color: theme.palette.getContrastText(formData.color) }} />
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['#3f51b5', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#2196f3', '#607d8b'].map((color) => (
                    <Box
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.color === color ? `2px solid ${theme.palette.common.white}` : 'none',
                        boxShadow: formData.color === color 
                          ? `0 0 0 2px ${alpha(color, 0.8)}, 0 4px 8px ${alpha(color, 0.4)}`
                          : `0 2px 4px ${alpha(color, 0.3)}`,
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: `0 4px 8px ${alpha(color, 0.5)}`,
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                  ))}
                </Box>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Vista previa
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '12px', 
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: formData.color,
                      color: theme.palette.getContrastText(formData.color),
                      fontWeight: 600,
                      boxShadow: `0 4px 8px ${alpha(formData.color, 0.3)}`,
                    }}
                  >
                    {formData.icono ? formData.icono.charAt(0) : formData.nombre ? formData.nombre.charAt(0) : 'T'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {formData.nombre || 'Nombre del tipo'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.descripcion || 'Descripción del tipo de actividad'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
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
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
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
              {editingId ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default TiposActividad; 