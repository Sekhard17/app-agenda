import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  CircularProgress,
  Fade,
  Tooltip,
  Badge,
  Chip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  ChatBubbleOutline as ChatIcon,
  Task as TaskIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import ComentariosService, { Comentario } from '../../services/comentarios.service';
import { motion } from 'framer-motion';

interface ComentariosActividadProps {
  idActividad: string;
  onError?: (mensaje: string) => void;
}

const ComentariosActividad: React.FC<ComentariosActividadProps> = ({
  idActividad,
  onError
}) => {
  const theme = useTheme();
  const { usuario } = useAuth();
  
  // Estados
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [comentarioEditando, setComentarioEditando] = useState<string | null>(null);
  const [contenidoEditando, setContenidoEditando] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [comentarioMenu, setComentarioMenu] = useState<string | null>(null);

  // Cargar comentarios
  const cargarComentarios = async () => {
    try {
      setCargando(true);
      const comentariosData = await ComentariosService.obtenerComentarios(idActividad);
      setComentarios(comentariosData);
      setError(null);
    } catch (error: any) {
      console.error(`Error al cargar comentarios para actividad ${idActividad}:`, error);
      
      // Manejar el error según su tipo
      const errorMessage = error.message || 'No se pudieron cargar los comentarios';
      setError(errorMessage);
      
      // Si es error de permisos, notificar al componente padre
      if (
        errorMessage.includes('No tiene permisos') || 
        errorMessage.includes('permiso denegado') ||
        error.status === 403 ||
        error.response?.status === 403
      ) {
        console.log('Error de permisos detectado, notificando al componente padre');
        if (onError) onError(errorMessage);
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarComentarios();
  }, [idActividad]);

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
  };

  const contarRespuestas = (comentarioId: string) => {
    return comentarios.filter(c => c.padre_id === comentarioId).length;
  };

  // Renderizar comentario
  const renderizarComentario = (comentario: Comentario, esRespuesta = false) => {
    if (esRespuesta && comentario.padre_id === null) return null;
    if (!esRespuesta && comentario.padre_id !== null) return null;

    const esPropio = comentario.id_usuario === usuario?.id;
    const esSupervisor = comentario.usuario.rol === 'supervisor';
    const numRespuestas = contarRespuestas(comentario.id);

    return (
      <motion.div
        key={comentario.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2,
            borderRadius: '16px',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backgroundColor: esSupervisor ? 
              alpha(theme.palette.primary.main, 0.05) : 
              alpha(theme.palette.background.paper, 0.8),
            position: 'relative',
            ml: esRespuesta ? 6 : 0,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
              borderColor: alpha(theme.palette.primary.main, 0.2)
            }
          }}
        >
          {/* Línea conectora para respuestas */}
          {esRespuesta && (
            <Box 
              sx={{ 
                position: 'absolute', 
                left: -30, 
                top: 20, 
                width: 30, 
                height: 30, 
                borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderBottomLeftRadius: 15
              }} 
            />
          )}

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                esSupervisor ? (
                  <Tooltip title="Supervisor de Actividad" arrow>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: theme.palette.primary.main,
                        border: `2px solid ${theme.palette.background.paper}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TaskIcon sx={{ fontSize: '10px', color: 'white' }} />
                    </Box>
                  </Tooltip>
                ) : null
              }
            >
              <Avatar
                sx={{
                  bgcolor: esSupervisor ? theme.palette.primary.main : theme.palette.secondary.main,
                  width: 45,
                  height: 45,
                  boxShadow: `0 4px 12px ${alpha(
                    esSupervisor ? theme.palette.primary.main : theme.palette.secondary.main, 
                    0.3
                  )}`
                }}
              >
                {comentario.usuario.nombres.charAt(0)}
              </Avatar>
            </Badge>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {`${comentario.usuario.nombres} ${comentario.usuario.appaterno}`}
                    {esSupervisor && (
                      <Chip
                        label="Supervisor"
                        size="small"
                        sx={{
                          ml: 1,
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatearFecha(comentario.fecha_creacion)}
                    {comentario.fecha_actualizacion !== comentario.fecha_creacion && (
                      <Tooltip title="Este comentario ha sido editado" arrow>
                        <Typography component="span" variant="caption" sx={{ ml: 1, fontStyle: 'italic' }}>
                          (editado)
                        </Typography>
                      </Tooltip>
                    )}
                  </Typography>
                </Box>

                {esPropio && (
                  <>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setComentarioMenu(comentario.id);
                      }}
                      sx={{ 
                        color: theme.palette.text.secondary,
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main
                        }
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={comentarioMenu === comentario.id}
                      onClose={() => {
                        setAnchorEl(null);
                        setComentarioMenu(null);
                      }}
                      TransitionComponent={Fade}
                      elevation={3}
                      sx={{ 
                        '& .MuiPaper-root': { 
                          borderRadius: '12px',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
                          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                        }
                      }}
                    >
                      <MenuItem
                        onClick={() => {
                          setComentarioEditando(comentario.id);
                          setContenidoEditando(comentario.contenido);
                          setAnchorEl(null);
                          setComentarioMenu(null);
                        }}
                        sx={{ 
                          borderRadius: '8px',
                          mx: 0.5,
                          py: 1,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                        }}
                      >
                        <EditIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                        Editar
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          eliminarComentario(comentario.id);
                          setAnchorEl(null);
                          setComentarioMenu(null);
                        }}
                        sx={{ 
                          borderRadius: '8px',
                          mx: 0.5,
                          py: 1, 
                          color: theme.palette.error.main,
                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
                        }}
                      >
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                        Eliminar
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>

              {comentarioEditando === comentario.id ? (
                <Box sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={contenidoEditando}
                    onChange={(e) => setContenidoEditando(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderWidth: '1px',
                          borderColor: theme.palette.primary.main,
                        }
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setComentarioEditando(null);
                        setContenidoEditando('');
                      }}
                      sx={{ 
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: 2
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => editarComentario(comentario.id)}
                      sx={{ 
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: 2,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Guardar cambios
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      mt: 0.5,
                      color: theme.palette.text.primary
                    }}
                  >
                    {comentario.contenido}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', mt: 1.5, gap: 2, alignItems: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<ReplyIcon fontSize="small" />}
                      sx={{ 
                        borderRadius: '20px',
                        textTransform: 'none',
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        },
                        fontSize: '0.8rem',
                        py: 0.5,
                        minWidth: 'auto'
                      }}
                    >
                      Responder
                    </Button>
                    
                    {numRespuestas > 0 && !esRespuesta && (
                      <Chip
                        size="small"
                        icon={<ChatIcon fontSize="small" />}
                        label={`${numRespuestas} ${numRespuestas === 1 ? 'respuesta' : 'respuestas'}`}
                        sx={{
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main,
                          borderRadius: '20px',
                          '& .MuiChip-label': { px: 1 },
                          '& .MuiChip-icon': { color: theme.palette.secondary.main }
                        }}
                      />
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Paper>
        
        {/* Renderizar respuestas anidadas */}
        {!esRespuesta && comentarios
          .filter(c => c.padre_id === comentario.id)
          .map(respuesta => renderizarComentario(respuesta, true))}
      </motion.div>
    );
  };

  // Editar comentario
  const editarComentario = async (id: string) => {
    if (!contenidoEditando.trim()) return;

    try {
      await ComentariosService.actualizarComentario(id, contenidoEditando.trim());
      setComentarioEditando(null);
      setContenidoEditando('');
      await cargarComentarios();
    } catch (error: any) {
      console.error(`Error al editar comentario ${id}:`, error);
      
      const errorMessage = error.message || 'No se pudo editar el comentario';
      setError(errorMessage);
      
      // Si es error de permisos, notificar al componente padre
      if (
        errorMessage.includes('No tiene permisos') || 
        errorMessage.includes('permiso denegado') ||
        error.status === 403 ||
        error.response?.status === 403
      ) {
        console.log('Error de permisos detectado al editar comentario, notificando al componente padre');
        if (onError) onError(errorMessage);
      }
    }
  };

  // Eliminar comentario
  const eliminarComentario = async (id: string) => {
    try {
      await ComentariosService.eliminarComentario(id);
      await cargarComentarios();
    } catch (error: any) {
      console.error(`Error al eliminar comentario ${id}:`, error);
      
      const errorMessage = error.message || 'No se pudo eliminar el comentario';
      setError(errorMessage);
      
      // Si es error de permisos, notificar al componente padre
      if (
        errorMessage.includes('No tiene permisos') || 
        errorMessage.includes('permiso denegado') ||
        error.status === 403 ||
        error.response?.status === 403
      ) {
        console.log('Error de permisos detectado al eliminar comentario, notificando al componente padre');
        if (onError) onError(errorMessage);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <TaskIcon sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Comentarios de la Actividad
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          {cargando && <CircularProgress size={20} />}
          <Chip
            label={`${comentarios.filter(c => c.padre_id === null).length} comentarios`}
            size="small"
            sx={{
              ml: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 500
            }}
          />
        </Box>
      </Box>

      {/* Renderizar comentarios */}
      <Box sx={{ mb: 4 }}>
        {comentarios.length === 0 && !cargando ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: '16px',
              bgcolor: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              textAlign: 'center'
            }}
          >
            <ChatIcon sx={{ fontSize: '2.5rem', color: alpha(theme.palette.info.main, 0.3), mb: 1 }} />
            <Typography color="textSecondary" variant="body1">
              No hay comentarios en esta actividad todavía.
            </Typography>
            <Typography color="textSecondary" variant="body2" sx={{ mt: 0.5 }}>
              ¡Sé el primero en comentar!
            </Typography>
          </Paper>
        ) : (
          comentarios
            .filter(c => c.padre_id === null)
            .map(comentario => renderizarComentario(comentario))
        )}
      </Box>
    </Box>
  );
};

export default ComentariosActividad;