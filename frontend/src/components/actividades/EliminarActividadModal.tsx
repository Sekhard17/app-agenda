import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  alpha,
  Zoom,
  Avatar,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  DeleteForever as DeleteForeverIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import ActividadesService from '../../services/actividades.service';

interface EliminarActividadModalProps {
  open: boolean;
  onClose: () => void;
  actividadId: string;
  onEliminar: () => void;
}

const EliminarActividadModal: React.FC<EliminarActividadModalProps> = ({
  open,
  onClose,
  actividadId,
  onEliminar
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEliminar = async () => {
    setLoading(true);
    setError('');

    try {
      const resultado = await ActividadesService.eliminarActividad(actividadId);
      if (resultado) {
        onEliminar();
        onClose();
      } else {
        throw new Error('No se pudo eliminar la actividad');
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la actividad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
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
          overflow: 'hidden',
        }
      }}
    >
      {/* Barra de color superior */}
      <Box 
        sx={{ 
          height: '8px', 
          width: '100%', 
          bgcolor: theme.palette.error.main,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }} 
      />

      {/* Header */}
      <DialogTitle 
        sx={{ 
          p: 3,
          background: `linear-gradient(to bottom, ${alpha(theme.palette.error.main, 0.05)}, transparent)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              width: 48,
              height: 48,
            }}
          >
            <DeleteForeverIcon />
          </Avatar>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
            Eliminar Actividad
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose}
          disabled={loading}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.error.main,
              transform: 'rotate(90deg)',
              transition: 'all 0.3s ease-in-out',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: '12px' }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 3,
            bgcolor: alpha(theme.palette.warning.main, 0.05),
            borderRadius: '16px',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
          }}
        >
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              color: theme.palette.warning.main,
              width: 40,
              height: 40,
            }}
          >
            <WarningIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" color="warning.main" sx={{ fontWeight: 600, mb: 0.5 }}>
              ¿Estás seguro de eliminar esta actividad?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a esta actividad.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: 2.5,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{ 
            borderRadius: '10px',
            px: 3,
            borderColor: alpha(theme.palette.divider, 0.2),
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              backgroundColor: alpha(theme.palette.divider, 0.05),
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleEliminar}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteForeverIcon />}
          sx={{
            borderRadius: '10px',
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.24)',
            background: 'linear-gradient(135deg, #D32F2F 0%, #EF5350 100%)',
            color: '#fff',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': {
              background: 'linear-gradient(135deg, #EF5350 0%, #D32F2F 100%)',
              boxShadow: '0 8px 16px rgba(211, 47, 47, 0.32)',
              transform: 'translateY(-1px)',
            },
            '&.Mui-disabled': {
              background: alpha(theme.palette.error.main, 0.6),
            }
          }}
        >
          {loading ? 'Eliminando...' : 'Eliminar Actividad'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EliminarActividadModal; 