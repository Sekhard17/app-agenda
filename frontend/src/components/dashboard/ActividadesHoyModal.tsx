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
  Paper,
  Tooltip,
  AvatarGroup,
  Badge,
  Divider,
  TablePagination,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Folder as FolderIcon,
  ArrowForward as ArrowForwardIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Today as TodayIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Proyecto, Actividad } from '../../services/dashboard.service';

interface ActividadesHoyModalProps {
  open: boolean;
  onClose: () => void;
  proyectos: Proyecto[];
}

const ACTIVIDADES_POR_PAGINA = 5;

const ActividadesHoyModal: React.FC<ActividadesHoyModalProps> = ({ open, onClose, proyectos }) => {
  const theme = useTheme();
  const [expandedProyecto, setExpandedProyecto] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(ACTIVIDADES_POR_PAGINA);
  const [loading, setLoading] = React.useState(false);

  // Calcular total de actividades y usuarios únicos
  const totalActividades = proyectos.reduce((acc, proyecto) => acc + proyecto.actividades.length, 0);
  const usuariosUnicos = new Set(
    proyectos.flatMap(p => p.actividades.map(a => a.usuario.id))
  ).size;

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

  const handleChangePage = (event: unknown, newPage: number) => {
    setLoading(true);
    setTimeout(() => {
      setPage(newPage);
      setLoading(false);
    }, 300);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    setTimeout(() => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
      setLoading(false);
    }, 300);
  };

  // Paginar proyectos
  const proyectosPaginados = React.useMemo(() => {
    const inicio = page * rowsPerPage;
    const fin = inicio + rowsPerPage;
    return proyectos.slice(inicio, fin);
  }, [proyectos, page, rowsPerPage]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.85)})`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        m: 0, 
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.08)}, transparent)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Badge
            badgeContent={totalActividades}
            color="primary"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                height: '22px',
                minWidth: '22px',
                borderRadius: '11px',
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 48,
                height: 48,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                }
              }}
            >
              <TodayIcon />
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Actividades de Hoy
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Total de actividades">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AssignmentIcon sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }} />
                  <Typography variant="body2" color="text.secondary">
                    {totalActividades} actividades
                  </Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Usuarios activos">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GroupIcon sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }} />
                  <Typography variant="body2" color="text.secondary">
                    {usuariosUnicos} usuarios
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              transform: 'rotate(90deg)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Contenido */}
      <DialogContent 
        sx={{ 
          p: 3,
          pt: 4,
          mt: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.primary.main, 0.1),
            borderRadius: '4px',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.2),
            },
          },
        }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {proyectosPaginados.map((proyecto, index) => (
                <motion.div
                  key={proyecto.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Paper
                    sx={{
                      mb: 2,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
                        transform: 'translateY(-2px)',
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                      }
                    }}
                    elevation={0}
                  >
                    {/* Encabezado del proyecto */}
                    <Box
                      onClick={() => handleExpandProyecto(proyecto.id)}
                      sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: expandedProyecto === proyecto.id ? 
                          alpha(theme.palette.primary.main, 0.03) : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05)
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                            width: 40,
                            height: 40,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'rotate(-10deg)',
                            }
                          }}
                        >
                          <FolderIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            transition: 'color 0.2s ease',
                            '&:hover': {
                              color: theme.palette.primary.main,
                            }
                          }}>
                            {proyecto.nombre}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AssignmentIcon sx={{ fontSize: '1rem' }} />
                              {proyecto.actividades.length} actividades
                            </Typography>
                            <AvatarGroup
                              max={3}
                              sx={{
                                '& .MuiAvatar-root': {
                                  width: 24,
                                  height: 24,
                                  fontSize: '0.75rem',
                                  border: `2px solid ${theme.palette.background.paper}`,
                                }
                              }}
                            >
                              {Array.from(new Set(proyecto.actividades.map(a => a.usuario.id))).map(userId => {
                                const user = proyecto.actividades.find(a => a.usuario.id === userId)?.usuario;
                                return (
                                  <Tooltip key={userId} title={user?.nombre || 'Usuario'}>
                                    <Avatar
                                      src={user?.avatar}
                                      alt={user?.nombre}
                                      sx={{ width: 24, height: 24 }}
                                    >
                                      {user?.nombre.charAt(0)}
                                    </Avatar>
                                  </Tooltip>
                                );
                              })}
                            </AvatarGroup>
                          </Box>
                        </Box>
                      </Box>
                      <IconButton 
                        size="small"
                        sx={{
                          transition: 'all 0.3s ease',
                          transform: expandedProyecto === proyecto.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: expandedProyecto === proyecto.id ? theme.palette.primary.main : theme.palette.text.secondary,
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    </Box>

                    {/* Contenido expandible */}
                    <Collapse in={expandedProyecto === proyecto.id}>
                      <Divider sx={{ opacity: 0.1 }} />
                      <Box sx={{ p: 2.5, pt: 2 }}>
                        {getActividadesPorUsuario(proyecto.actividades).map((grupoUsuario) => (
                          <Fade in={true} timeout={300} key={grupoUsuario.usuario.id}>
                            <Box sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
                              {/* Encabezado del usuario */}
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mb: 2,
                                pb: 1,
                                borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.1)}`
                              }}>
                                <Avatar
                                  src={grupoUsuario.usuario.avatar}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    mr: 1.5,
                                    border: `2px solid ${theme.palette.background.paper}`,
                                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                                  }}
                                >
                                  {grupoUsuario.usuario.nombre.charAt(0)}
                                </Avatar>
                                <Typography 
                                  variant="subtitle1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: theme.palette.text.primary
                                  }}
                                >
                                  {grupoUsuario.usuario.nombre}
                                </Typography>
                              </Box>

                              {/* Lista de actividades */}
                              <Box sx={{ pl: 4 }}>
                                {grupoUsuario.actividades.map((actividad: Actividad, index: number) => (
                                  <motion.div
                                    key={actividad.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                  >
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 1.5,
                                        p: 1.5,
                                        borderRadius: '12px',
                                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                          transform: 'translateX(4px)'
                                        }
                                      }}
                                    >
                                      <Box sx={{ flex: 1 }}>
                                        <Typography 
                                          variant="body1" 
                                          sx={{ 
                                            fontWeight: 500,
                                            color: theme.palette.text.primary,
                                            mb: 0.5
                                          }}
                                        >
                                          {actividad.titulo}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTimeIcon sx={{ fontSize: '1rem' }} />
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
                                          fontWeight: 600,
                                          fontSize: '0.75rem',
                                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                                          color: theme.palette.success.main,
                                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                                          '&:hover': {
                                            backgroundColor: alpha(theme.palette.success.main, 0.15),
                                          }
                                        }}
                                      />
                                    </Box>
                                  </motion.div>
                                ))}
                              </Box>
                            </Box>
                          </Fade>
                        ))}
                      </Box>
                    </Collapse>

                    {/* Botón de acción */}
                    <Box sx={{ 
                      p: 2, 
                      pt: expandedProyecto === proyecto.id ? 3 : 0,
                      mt: expandedProyecto === proyecto.id ? 1 : 0,
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      minHeight: expandedProyecto === proyecto.id ? 'auto' : '64px',
                      borderTop: expandedProyecto === proyecto.id ? 
                        `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                    }}>
                      <Button
                        endIcon={<ArrowForwardIcon />}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: '20px',
                          textTransform: 'none',
                          px: 2,
                          py: 0.5,
                          borderColor: alpha(theme.palette.primary.main, 0.5),
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        Ver todas las actividades
                      </Button>
                    </Box>
                  </Paper>
                </motion.div>
              ))}

              {proyectos.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 8,
                      px: 3,
                      borderRadius: '16px',
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
                    <Typography variant="h6" color="text.primary" sx={{ mb: 1, fontWeight: 600 }}>
                      No hay actividades hoy
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                      No se han registrado actividades para el día de hoy.
                    </Typography>
                  </Box>
                </motion.div>
              )}

              {/* Paginación */}
              {proyectos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 2,
                      p: 1,
                      borderRadius: '12px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      backgroundColor: theme.palette.background.paper,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <TablePagination
                      component="div"
                      count={proyectos.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25]}
                      labelRowsPerPage="Proyectos por página"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                      sx={{
                        '.MuiTablePagination-select': {
                          borderRadius: '8px',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          p: '4px 8px',
                          '&:focus': {
                            borderColor: theme.palette.primary.main,
                          }
                        },
                        '.MuiTablePagination-selectIcon': {
                          color: theme.palette.primary.main,
                        },
                        '.MuiTablePagination-displayedRows': {
                          fontWeight: 500,
                        },
                        '.MuiButtonBase-root': {
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          },
                          '&.Mui-disabled': {
                            opacity: 0.5,
                          }
                        }
                      }}
                    />
                  </Paper>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ActividadesHoyModal; 