import React from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Chip, 
  IconButton, 
  LinearProgress, 
  Avatar, 
  AvatarGroup,
  Tooltip,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon,
  FolderSpecial as FolderSpecialIcon,
  ViewQuilt as ViewQuiltIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  ImportContacts as ImportContactsIcon,
  Build as BuildIcon,
  SportsEsports as SportsEsportsIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { Proyecto, UsuarioAsignado } from '../../services/proyectos.service';
import { motion } from 'framer-motion';

interface ProyectoCardProps {
  proyecto: Proyecto;
  onClick?: (id: string) => void;
}

// Mapeo de iconos según tipo de proyecto
const getIconoProyecto = (nombre: string) => {
  const nombreLower = nombre.toLowerCase();
  
  if (nombreLower.includes('desarrollo') || nombreLower.includes('software')) return <CodeIcon />;
  if (nombreLower.includes('informe') || nombreLower.includes('reporte')) return <DescriptionIcon />;
  if (nombreLower.includes('educación') || nombreLower.includes('capacitación')) return <SchoolIcon />;
  if (nombreLower.includes('investigación') || nombreLower.includes('estudio')) return <ImportContactsIcon />;
  if (nombreLower.includes('empresa') || nombreLower.includes('negocio')) return <BusinessIcon />;
  if (nombreLower.includes('mantenimiento') || nombreLower.includes('soporte')) return <BuildIcon />;
  if (nombreLower.includes('diseño') || nombreLower.includes('gráfico')) return <ViewQuiltIcon />;
  if (nombreLower.includes('juego') || nombreLower.includes('entretenimiento')) return <SportsEsportsIcon />;
  if (nombreLower.includes('internacional') || nombreLower.includes('global')) return <PublicIcon />;
  
  // Icono predeterminado
  return <FolderSpecialIcon />;
};

// Mapeo de colores según estado
const getColorEstado = (estado: string, theme: any) => {
  switch(estado) {
    case 'planificado':
      return theme.palette.info.main;
    case 'en_progreso':
      return theme.palette.primary.main;
    case 'completado':
      return theme.palette.success.main;
    case 'cancelado':
      return theme.palette.error.main;
    default:
      return theme.palette.primary.main;
  }
};

// Función para obtener etiqueta de estado
const getEtiquetaEstado = (estado: string) => {
  switch(estado) {
    case 'planificado': return 'Planificado';
    case 'en_progreso': return 'En Progreso';
    case 'completado': return 'Completado';
    case 'cancelado': return 'Cancelado';
    default: return 'Desconocido';
  }
};

const ProyectoCard: React.FC<ProyectoCardProps> = ({ proyecto, onClick }) => {
  const theme = useTheme();
  const colorEstado = getColorEstado(proyecto.estado, theme);
  
  // Calcular el progreso del proyecto
  const progreso = proyecto.progreso || 
    (proyecto.total_actividades && proyecto.actividades_completadas 
      ? Math.round((proyecto.actividades_completadas / proyecto.total_actividades) * 100) 
      : 0);
  
  // Formatear fecha límite si existe
  const fechaLimite = proyecto.fecha_fin 
    ? new Date(proyecto.fecha_fin).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }) 
    : null;
  
  // Verificar días restantes
  const diasRestantes = fechaLimite 
    ? Math.ceil((new Date(proyecto.fecha_fin!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Determinar si hay urgencia por fecha
  const esUrgente = diasRestantes !== null && diasRestantes <= 7 && diasRestantes > 0;
  const estaVencido = diasRestantes !== null && diasRestantes < 0;
  
  return (
    <motion.div
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onClick={() => onClick && onClick(proyecto.id)}
        sx={{
          borderRadius: '16px',
          p: 0,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.12)}`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.18)}`,
          },
          border: `1px solid ${alpha(colorEstado, 0.15)}`,
        }}
      >
        {/* Barra superior de estado */}
        <Box 
          sx={{ 
            height: '8px', 
            width: '100%', 
            backgroundColor: colorEstado,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2
          }} 
        />
        
        {/* Cabecera */}
        <Box sx={{ p: 3, pb: 0, position: 'relative', mt: 0.8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{ 
                  backgroundColor: alpha(colorEstado, 0.2),
                  color: colorEstado,
                  width: 48,
                  height: 48,
                  mr: 2
                }}
              >
                {getIconoProyecto(proyecto.nombre)}
              </Avatar>
              
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '1.1rem',
                    mb: 0.5,
                    color: theme.palette.text.primary,
                  }}
                >
                  {proyecto.nombre}
                </Typography>
                
                <Chip
                  label={getEtiquetaEstado(proyecto.estado)}
                  size="small"
                  sx={{
                    bgcolor: alpha(colorEstado, 0.1),
                    color: colorEstado,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    height: '22px',
                    borderRadius: '6px',
                    mb: 0.5
                  }}
                />
              </Box>
            </Box>
            
            <IconButton 
              size="small" 
              sx={{ 
                mt: -0.5, 
                mr: -0.5,
                color: theme.palette.text.secondary
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Descripción truncada */}
          {proyecto.descripcion && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mt: 1.5, 
                fontSize: '0.85rem',
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                textOverflow: 'ellipsis',
                height: '2.6em',
                lineHeight: '1.3em'
              }}
            >
              {proyecto.descripcion}
            </Typography>
          )}
        </Box>
        
        {/* Barra de progreso */}
        <Box sx={{ px: 3, mt: 2, mb: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Progreso
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {progreso}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progreso} 
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(colorEstado, 0.15),
              '& .MuiLinearProgress-bar': {
                backgroundColor: colorEstado,
                borderRadius: 3,
              }
            }}
          />
        </Box>
        
        {/* Datos adicionales */}
        <Box sx={{ p: 3, pt: 2, mt: 'auto' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap', 
            gap: 1,
          }}>
            {/* Actividades */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: theme.palette.text.secondary,
                  mr: 2
                }}
              >
                <AssignmentIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {proyecto.actividades_completadas || 0}/{proyecto.total_actividades || 0}
                </Typography>
              </Box>
              
              {/* Fecha límite */}
              {fechaLimite && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: estaVencido 
                      ? theme.palette.error.main 
                      : esUrgente 
                        ? theme.palette.warning.main 
                        : theme.palette.text.secondary
                  }}
                >
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: estaVencido || esUrgente ? 600 : 500,
                    }}
                  >
                    {fechaLimite}
                    {estaVencido && ' (vencido)'}
                    {esUrgente && !estaVencido && ` (${diasRestantes} días)`}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Miembros del proyecto */}
            {proyecto.usuarios_asignados && proyecto.usuarios_asignados.length > 0 && (
              <AvatarGroup 
                max={4}
                sx={{ 
                  '& .MuiAvatar-root': { 
                    width: 28, 
                    height: 28, 
                    fontSize: '0.75rem',
                    bgcolor: theme.palette.primary.main,
                    border: `2px solid ${theme.palette.background.paper}`
                  },
                }}
              >
                {proyecto.usuarios_asignados.map((usuario: UsuarioAsignado) => (
                  <Tooltip key={usuario.id} title={`${usuario.nombres} ${usuario.appaterno}`}>
                    <Avatar>
                      {usuario.nombres.charAt(0)}{usuario.appaterno.charAt(0)}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            )}
          </Box>
        </Box>
      </Card>
    </motion.div>
  );
};

export default ProyectoCard; 