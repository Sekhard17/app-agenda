import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Breadcrumbs,
  Link,
  IconButton,
  InputBase,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  SelectChangeEvent
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import ActividadesLista from '../components/actividades/ActividadesLista';
import ProyectosService from '../services/proyectos.service';

const Actividades: React.FC = () => {
  const theme = useTheme();
  
  // Estados
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string>('');
  const [proyectos, setProyectos] = useState<any[]>([]);
  
  // Cargar proyectos para el filtro
  useEffect(() => {
    const obtenerProyectos = async () => {
      try {
        const data = await ProyectosService.getProyectosActivos();
        setProyectos(data);
        // Si hay proyectos, seleccionar el primero por defecto
        if (data.length > 0) {
          setProyectoSeleccionado(data[0].id);
        }
      } catch (error) {
        console.error('Error al cargar proyectos:', error);
      }
    };
    
    obtenerProyectos();
  }, []);
  
  // Manejar cambio de proyecto
  const handleCambioProyecto = (event: SelectChangeEvent<string>) => {
    setProyectoSeleccionado(event.target.value);
  };
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      {/* Cabecera */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
          >
            <Link 
              component={RouterLink} 
              to="/dashboard"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <HomeIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} />
              Inicio
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <DashboardIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} />
              Actividades
            </Typography>
          </Breadcrumbs>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary,
              lineHeight: 1.2
            }}
          >
            Gestión de Actividades
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: '10px',
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              textTransform: 'none',
              px: 3
            }}
          >
            Nueva Actividad
          </Button>
        </Box>
      </Box>
      
      {/* Filtros y búsqueda */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 4, 
          borderRadius: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, maxWidth: '500px' }}>
          <Paper
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              borderRadius: '12px',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              bgcolor: alpha(theme.palette.background.default, 0.4)
            }}
          >
            <IconButton sx={{ p: '10px' }} aria-label="buscar">
              <SearchIcon />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Buscar actividades..."
              inputProps={{ 'aria-label': 'buscar actividades' }}
            />
          </Paper>
          
          <IconButton 
            sx={{ 
              borderRadius: '12px', 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }}
          >
            <FilterListIcon />
          </IconButton>
        </Box>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="proyecto-select-label">Proyecto</InputLabel>
          <Select
            labelId="proyecto-select-label"
            id="proyecto-select"
            value={proyectoSeleccionado}
            onChange={handleCambioProyecto}
            label="Proyecto"
            sx={{ borderRadius: '12px' }}
          >
            {proyectos.map((proyecto) => (
              <MenuItem key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      
      {/* Contenido principal */}
      <Paper 
        sx={{ 
          p: 3, 
          borderRadius: '16px',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`
        }}
      >
        {proyectoSeleccionado ? (
          <ActividadesLista 
            proyectoId={proyectoSeleccionado} 
          />
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Selecciona un proyecto para ver sus actividades
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Actividades; 