import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Typography,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Collapse,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Search as SearchIcon,
  ClearAll as ClearAllIcon,
  SortByAlpha as SortByAlphaIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  CalendarToday as CalendarTodayIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ProyectoFiltros } from '../../services/proyectos.service';

interface ProyectosFiltrosProps {
  filtros: ProyectoFiltros;
  onFiltrosChange: (filtros: ProyectoFiltros) => void;
  onLimpiarFiltros: () => void;
  totalProyectos: number;
  proyectosFiltrados: number;
}

// Opciones para filtro de estado
const opcionesEstado = [
  { value: '', label: 'Todos los estados' },
  { value: 'planificado', label: 'Planificado' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' }
];

// Opciones para ordenamiento
const opcionesOrdenamiento = [
  { value: 'nombre_asc', label: 'Nombre (A-Z)', icon: <SortByAlphaIcon fontSize="small" /> },
  { value: 'nombre_desc', label: 'Nombre (Z-A)', icon: <SortByAlphaIcon fontSize="small" sx={{ transform: 'scaleY(-1)' }} /> },
  { value: 'fecha_inicio_asc', label: 'Fecha inicio (antigua)', icon: <ArrowUpwardIcon fontSize="small" /> },
  { value: 'fecha_inicio_desc', label: 'Fecha inicio (reciente)', icon: <ArrowDownwardIcon fontSize="small" /> },
  { value: 'fecha_fin_asc', label: 'Fecha fin (próxima)', icon: <CalendarTodayIcon fontSize="small" /> },
  { value: 'progreso_asc', label: 'Progreso (menor primero)', icon: <ArrowUpwardIcon fontSize="small" /> },
  { value: 'progreso_desc', label: 'Progreso (mayor primero)', icon: <ArrowDownwardIcon fontSize="small" /> }
];

const ProyectosFiltros: React.FC<ProyectosFiltrosProps> = ({
  filtros,
  onFiltrosChange,
  onLimpiarFiltros,
  totalProyectos,
  proyectosFiltrados
}) => {
  const theme = useTheme();
  
  // Estados locales
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [ordenAnchorEl, setOrdenAnchorEl] = useState<null | HTMLElement>(null);
  const ordenMenuAbierto = Boolean(ordenAnchorEl);
  
  // Función para actualizar un filtro específico
  const actualizarFiltro = (key: keyof ProyectoFiltros, value: string) => {
    onFiltrosChange({
      ...filtros,
      [key]: value
    });
  };
  
  // Handlers para ordenamiento
  const handleOpenOrdenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setOrdenAnchorEl(event.currentTarget);
  };
  
  const handleCloseOrdenMenu = () => {
    setOrdenAnchorEl(null);
  };
  
  const handleSelectOrden = (orden: string) => {
    actualizarFiltro('ordenarPor', orden);
    handleCloseOrdenMenu();
  };
  
  // Encontrar la etiqueta actual de ordenamiento
  const ordenActualLabel = opcionesOrdenamiento.find(opt => opt.value === filtros.ordenarPor)?.label || 'Ordenar por';
  
  // Verificar si hay filtros activos
  const hayFiltrosActivos = filtros.estado || filtros.fechaInicio || filtros.fechaFin || filtros.busqueda;
  
  return (
    <Paper
      elevation={0}
      component={motion.div}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        p: 2,
        borderRadius: '16px',
        mb: 3,
        background: theme.palette.background.paper,
        boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.08)}`,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        {/* Buscador */}
        <TextField
          placeholder="Buscar proyectos..."
          variant="outlined"
          value={filtros.busqueda}
          onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
          size="small"
          sx={{
            flexGrow: 1,
            minWidth: { xs: '100%', sm: '220px' },
            maxWidth: { xs: '100%', sm: '320px' },
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: alpha(theme.palette.background.default, 0.6),
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.background.default, 0.8),
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: filtros.busqueda ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => actualizarFiltro('busqueda', '')}
                  edge="end"
                  sx={{ mr: -0.5 }}
                >
                  <ClearAllIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
        
        {/* Botones de estado como chips */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1,
          maxWidth: '100%',
          overflowX: 'auto',
          pb: 0.5
        }}>
          {opcionesEstado.map((estado) => (
            <Chip
              key={estado.value}
              label={estado.label}
              variant={filtros.estado === estado.value ? 'filled' : 'outlined'}
              onClick={() => actualizarFiltro('estado', estado.value)}
              size="small"
              sx={{
                borderRadius: '8px',
                px: 0.5,
                height: '32px',
                fontWeight: 500,
                fontSize: '0.8rem',
                color: filtros.estado === estado.value 
                  ? '#fff' 
                  : theme.palette.text.secondary,
                bgcolor: filtros.estado === estado.value 
                  ? theme.palette.primary.main 
                  : 'transparent',
                borderColor: filtros.estado === estado.value 
                  ? theme.palette.primary.main 
                  : alpha(theme.palette.divider, 0.5),
                '&:hover': {
                  bgcolor: filtros.estado === estado.value 
                    ? theme.palette.primary.dark 
                    : alpha(theme.palette.action.hover, 0.1),
                },
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </Box>
        
        {/* Ordenamiento */}
        <Tooltip title="Ordenar proyectos">
          <Button
            variant="outlined"
            onClick={handleOpenOrdenMenu}
            size="small"
            startIcon={<SortByAlphaIcon />}
            endIcon={<ExpandMoreIcon />}
            sx={{
              ml: 'auto',
              borderRadius: '8px',
              height: '32px',
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
              px: 1.5,
              borderColor: alpha(theme.palette.divider, 0.5),
              color: filtros.ordenarPor ? theme.palette.primary.main : theme.palette.text.secondary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.04)
              }
            }}
          >
            {ordenActualLabel}
          </Button>
        </Tooltip>
        
        <Menu
          anchorEl={ordenAnchorEl}
          open={ordenMenuAbierto}
          onClose={handleCloseOrdenMenu}
          PaperProps={{
            sx: {
              mt: 1.5,
              borderRadius: '12px',
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
              minWidth: '220px'
            }
          }}
        >
          {opcionesOrdenamiento.map((opcion) => (
            <MenuItem
              key={opcion.value}
              onClick={() => handleSelectOrden(opcion.value)}
              selected={filtros.ordenarPor === opcion.value}
              sx={{
                py: 1,
                mx: 1,
                my: 0.2,
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: filtros.ordenarPor === opcion.value ? 600 : 400,
                color: filtros.ordenarPor === opcion.value 
                  ? theme.palette.primary.main 
                  : theme.palette.text.primary
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ mr: 1.5, color: theme.palette.text.secondary, display: 'flex' }}>
                  {opcion.icon}
                </Box>
                {opcion.label}
              </Box>
            </MenuItem>
          ))}
        </Menu>
        
        {/* Botón de filtros avanzados */}
        <Tooltip title={mostrarFiltrosAvanzados ? 'Ocultar filtros' : 'Mostrar más filtros'}>
          <Button
            variant="text"
            size="small"
            color="primary"
            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
            endIcon={mostrarFiltrosAvanzados ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            Filtros
          </Button>
        </Tooltip>
        
        {/* Botón para limpiar filtros */}
        {hayFiltrosActivos && (
          <Tooltip title="Limpiar todos los filtros">
            <IconButton 
              size="small" 
              onClick={onLimpiarFiltros}
              sx={{ 
                color: theme.palette.error.main,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.2)
                }
              }}
            >
              <ClearAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {/* Filtros avanzados */}
      <Collapse in={mostrarFiltrosAvanzados}>
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.75rem', fontWeight: 600 }}>
            FILTROS AVANZADOS
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              {/* Fecha de inicio */}
              <DatePicker 
                label="Desde"
                value={filtros.fechaInicio ? new Date(filtros.fechaInicio) : null}
                onChange={(date) => actualizarFiltro('fechaInicio', date ? date.toISOString() : '')}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: {
                      width: { xs: '100%', sm: '180px' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                      }
                    }
                  } 
                }}
              />
              
              {/* Fecha de fin */}
              <DatePicker
                label="Hasta"
                value={filtros.fechaFin ? new Date(filtros.fechaFin) : null}
                onChange={(date) => actualizarFiltro('fechaFin', date ? date.toISOString() : '')}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: {
                      width: { xs: '100%', sm: '180px' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                      }
                    }
                  } 
                }}
              />
            </LocalizationProvider>
          </Box>
        </Box>
      </Collapse>
      
      {/* Contador de resultados */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        mt: hayFiltrosActivos || mostrarFiltrosAvanzados ? 2 : 0,
        pt: hayFiltrosActivos || mostrarFiltrosAvanzados ? 1 : 0,
        borderTop: hayFiltrosActivos || mostrarFiltrosAvanzados ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
      }}>
        <Typography variant="caption" color="text.secondary">
          Mostrando <b>{proyectosFiltrados}</b> de <b>{totalProyectos}</b> proyectos
        </Typography>
      </Box>
    </Paper>
  );
};

export default ProyectosFiltros; 