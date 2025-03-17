import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Avatar,
  Chip,
  Button,
  useTheme,
  alpha,
  Fade,
  Collapse,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  ArrowForward as ArrowForwardIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Today as TodayIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Proyecto, Actividad } from '../../services/dashboard.service';

interface ActividadesHoyModalProps {
  open: boolean;
  onClose: () => void;
  proyectos: Proyecto[];
}

const ActividadesHoyModal: React.FC<ActividadesHoyModalProps> = ({ open, onClose, proyectos }) => {
  const theme = useTheme();
  const [expandedProyecto, setExpandedProyecto] = React.useState<string | null>(null);

  // Calcular total de actividades
  const totalActividades = proyectos.reduce((acc, proyecto) => acc + proyecto.actividades.length, 0);

  // Agrupar actividades por usuario dentro de cada proyecto
  const getActividadesPorUsuario = (actividades: Proyecto['actividades']) => {
    const actividadesPorUsuario = new Map();
    actividades.forEach(actividad => {
      if (!actividadesPorUsuario.has(actividad.usuario.id)) {
        actividadesPorUsuario.set(actividad.usuario.id, {
          usuario: actividad.usuario,
          actividades: []
        });
      }
      actividadesPorUsuario.get(actividad.usuario.id).actividades.push(actividad);
    });
    return Array.from(actividadesPorUsuario.values());
  };

  const handleExpandProyecto = (proyectoId: string) => {
    setExpandedProyecto(expandedProyecto === proyectoId ? null : proyectoId);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.85)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        m: 0, 
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              width: 40,
              height: 40
            }}
          >
            <TodayIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Actividades de Hoy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalActividades} actividades en total
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Contenido */}
      <DialogContent sx={{ p: 3 }}>
        <AnimatePresence>
          {proyectos.map((proyecto, index) => (
            <motion.div
              key={proyecto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Paper
                sx={{
                  mb: 2,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}
                elevation={0}
              >
                {/* Encabezado del proyecto */}
                <Box
                  onClick={() => handleExpandProyecto(proyecto.id)}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        width: 32,
                        height: 32
                      }}
                    >
                      <FolderIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {proyecto.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {proyecto.actividades.length} actividades
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small">
                    {expandedProyecto === proyecto.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                {/* Contenido expandible */}
                <Collapse in={expandedProyecto === proyecto.id}>
                  <Box sx={{ p: 2, pt: 0 }}>
                    {getActividadesPorUsuario(proyecto.actividades).map((grupoUsuario) => (
                      <Fade in={true} timeout={300} key={grupoUsuario.usuario.id}>
                        <Box sx={{ mb: 2 }}>
                          {/* Encabezado del usuario */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, ml: 1 }}>
                            <Avatar
                              src={grupoUsuario.usuario.avatar}
                              sx={{
                                width: 28,
                                height: 28,
                                mr: 1,
                                bgcolor: theme.palette.primary.main
                              }}
                            >
                              {grupoUsuario.usuario.nombre.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                              {grupoUsuario.usuario.nombre}
                            </Typography>
                          </Box>

                          {/* Lista de actividades */}
                          <Box sx={{ pl: 4 }}>
                            {grupoUsuario.actividades.map((actividad: Actividad) => (
                              <Box
                                key={actividad.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 1.5,
                                  p: 1,
                                  borderRadius: '8px',
                                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                  }
                                }}
                              >
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {actividad.titulo}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {actividad.hora}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Chip
                                  label="Enviada"
                                  size="small"
                                  color="success"
                                  sx={{
                                    height: '24px',
                                    borderRadius: '12px',
                                    fontWeight: 500
                                  }}
                                />
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Fade>
                    ))}
                  </Box>
                </Collapse>

                {/* Botón de acción */}
                <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    endIcon={<ArrowForwardIcon />}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: '20px',
                      textTransform: 'none',
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      }
                    }}
                  >
                    Ver todas las actividades
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          ))}
        </AnimatePresence>

        {proyectos.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              px: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.7),
              border: `1px dashed ${theme.palette.divider}`,
              mx: 2
            }}
          >
            <InfoIcon sx={{ 
              fontSize: 48, 
              color: theme.palette.info.main, 
              opacity: 0.7, 
              mb: 2 
            }} />
            <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
              No hay actividades hoy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
              No se han registrado actividades para hoy.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActividadesHoyModal; 