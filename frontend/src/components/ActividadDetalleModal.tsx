import React from 'react';
import { 
  Dialog, 
  DialogContent,
  Box, 
  Typography, 
  IconButton, 
  Chip, 
  useTheme,
  Tooltip,
  Button,
  Stack,
  Paper,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface ActividadDetalleModalProps {
  open: boolean;
  onClose: () => void;
  actividad: any;
  onActividadActualizada?: () => void;
  esEditable?: boolean;
}

const formatearFecha = (fecha: string) => {
  if (!fecha) return 'Sin fecha';
  return format(new Date(fecha), 'dd MMMM yyyy', { locale: es });
};

const formatearHora = (hora: string) => {
  if (!hora) return 'Sin horario';
  const [h, m] = hora.split(':');
  return `${h}:${m}`;
};

const ActividadDetalleModal: React.FC<ActividadDetalleModalProps> = ({ 
  open, 
  onClose, 
  actividad,
  onActividadActualizada,
  esEditable = false
}) => {
  const theme = useTheme();
  const { usuario } = useAuth();

  if (!actividad) return null;

  // Obtener el nombre del usuario actual
  const nombreUsuario = usuario ? 
    `${usuario.nombres || ''} ${usuario.appaterno || ''} ${usuario.apmaterno || ''}`.trim() :
    'Usuario actual';

  const getEstadoChip = () => {
    const estado = actividad.estado?.toLowerCase() || '';
    const isCompletada = estado === 'completada' || estado === 'completado';

    return (
      <Chip 
        icon={isCompletada ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
        label={isCompletada ? 'Completada' : 'Pendiente'}
        size="medium"
        sx={{
          bgcolor: isCompletada 
            ? alpha(theme.palette.success.main, 0.12)
            : alpha(theme.palette.warning.main, 0.12),
          color: isCompletada 
            ? theme.palette.success.main 
            : theme.palette.warning.main,
          fontWeight: 'bold',
          borderRadius: '16px',
          px: 2,
          height: '32px',
          '& .MuiChip-icon': {
            color: 'inherit',
            fontSize: '1.2rem'
          },
          transition: 'all 0.3s ease',
          '&:hover': { 
            transform: 'scale(1.05)',
            boxShadow: `0 4px 12px ${alpha(
              isCompletada ? theme.palette.success.main : theme.palette.warning.main, 
              0.2
            )}`
          },
        }}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
        transition: { duration: 0.4, ease: 'easeOut' },
        sx: {
          borderRadius: { xs: '16px', sm: '24px' },
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`
            : `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.98)})`,
          backdropFilter: 'blur(10px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 10px 40px rgba(0, 0, 0, 0.5)'
            : '0 10px 40px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          maxWidth: '900px',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        },
      }}
    >
      <DialogContent sx={{ 
        p: 0, 
        display: 'flex', 
        flexDirection: 'column',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.primary.main, 0.2),
          borderRadius: '4px',
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.3),
          }
        }
      }}>
        {/* Header con gradiente */}
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.85)} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.light, 0.9)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, ${alpha('#fff', 0.2)}, transparent)`
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <IconButton
              onClick={onClose}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)',
                color: '#fff',
                '&:hover': { 
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ 
                color: '#fff', 
                letterSpacing: '-0.5px',
                fontSize: { xs: '1.3rem', sm: '1.6rem' },
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: '40%',
                  height: '2px',
                  background: alpha('#fff', 0.3),
                  borderRadius: '2px'
                }
              }}
            >
              Detalle de Actividad
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 } }}>
            {esEditable && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  if (onActividadActualizada) {
                    onActividadActualizada();
                  }
                }}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  backdropFilter: 'blur(4px)',
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-2px)'
                  },
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  px: { xs: 2, sm: 2.5 },
                  py: 1,
                  transition: 'all 0.3s ease',
                  '&:active': { transform: 'scale(0.98)' },
                }}
              >
                Editar Actividad
              </Button>
            )}
            <Tooltip title="Cerrar">
              <IconButton 
                onClick={onClose} 
                sx={{
                  color: '#fff',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(4px)',
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'rotate(90deg)'
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Contenedor principal con scroll */}
        <Box sx={{ 
          flex: 1,
          px: { xs: 2.5, sm: 3 },
          py: { xs: 2.5, sm: 3 },
        }}>
          {/* ID y Estado */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            mb: 3,
            pb: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography 
                variant="body2" 
                sx={{
                  color: theme.palette.text.secondary,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  fontFamily: 'monospace'
                }}
              >
                <Box component="span" sx={{ opacity: 0.7 }}>ID:</Box> {actividad.id || 'No disponible'}
              </Typography>
              {getEstadoChip()}
            </Box>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: 2, 
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  width: 'fit-content'
                }}
              >
                <FolderIcon sx={{ fontSize: '1.2rem', color: theme.palette.primary.main }} />
                <Typography variant="body2">
                  {actividad.proyectos?.nombre || 'Sin proyecto'}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                  width: 'fit-content'
                }}
              >
                <PersonIcon sx={{ fontSize: '1.2rem', color: theme.palette.secondary.main }} />
                <Typography variant="body2">
                  {nombreUsuario}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  width: 'fit-content'
                }}
              >
                <CalendarIcon sx={{ fontSize: '1.2rem', color: theme.palette.success.main }} />
                <Typography variant="body2">
                  {formatearFecha(actividad.fecha)}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  width: 'fit-content'
                }}
              >
                <TimeIcon sx={{ fontSize: '1.2rem', color: theme.palette.info.main }} />
                <Typography variant="body2">
                  {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_fin)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Título de la actividad */}
          <Typography 
            variant="h5" 
            sx={{
              fontWeight: 800,
              mb: 4,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                : `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: theme.palette.mode === 'dark'
                ? '0 2px 10px rgba(255,255,255,0.1)'
                : '0 2px 10px rgba(0,0,0,0.1)',
              lineHeight: 1.2
            }}
          >
            {actividad.titulo || actividad.nombre || 'Sin título'}
          </Typography>

          {/* Descripción */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              mb: 3
            }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                color: theme.palette.warning.main
              }}>
                <DescriptionIcon />
              </Box>
              <Typography variant="overline" fontWeight={600} color="warning.main" fontSize="1rem">
                DESCRIPCIÓN
              </Typography>
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                background: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.paper, 0.4)
                  : alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.1)}`
                }
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.8,
                  color: theme.palette.text.primary,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {actividad.descripcion || 'No hay descripción disponible.'}
              </Typography>
            </Paper>
          </Box>

          {/* Historial */}
          {(actividad.created_at || actividad.updated_at) && (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                mb: 3
              }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.info.main, 0.12),
                  color: theme.palette.info.main
                }}>
                  <TimeIcon />
                </Box>
                <Typography variant="overline" fontWeight={600} color="info.main" fontSize="1rem">
                  HISTORIAL
                </Typography>
              </Box>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  background: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.4)
                    : alpha(theme.palette.background.paper, 0.7),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Stack spacing={2}>
                  {actividad.created_at && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                    }}>
                      <Box 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.success.main,
                          boxShadow: `0 0 0 4px ${alpha(theme.palette.success.main, 0.2)}`
                        }} 
                      />
                      <Box>
                        <Typography variant="subtitle2" color="success.main" fontWeight={600}>
                          Creación
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(actividad.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {actividad.updated_at && actividad.updated_at !== actividad.created_at && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                    }}>
                      <Box 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.info.main,
                          boxShadow: `0 0 0 4px ${alpha(theme.palette.info.main, 0.2)}`
                        }} 
                      />
                      <Box>
                        <Typography variant="subtitle2" color="info.main" fontWeight={600}>
                          Última actualización
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(actividad.updated_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ActividadDetalleModal;