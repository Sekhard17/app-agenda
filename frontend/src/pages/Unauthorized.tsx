import { Box, Typography, Button, useTheme, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LockOutlined as LockIcon } from '@mui/icons-material';

const Unauthorized = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Box
        sx={{
          backgroundColor: alpha(theme.palette.error.main, 0.1),
          borderRadius: '50%',
          padding: 3,
          marginBottom: 3,
        }}
      >
        <LockIcon
          sx={{
            fontSize: 64,
            color: theme.palette.error.main,
          }}
        />
      </Box>

      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 700,
          color: theme.palette.error.main,
          textAlign: 'center',
        }}
      >
        Acceso No Autorizado
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.secondary,
          textAlign: 'center',
          maxWidth: 600,
          marginBottom: 4,
        }}
      >
        No tienes los permisos necesarios para acceder a esta página.
        Por favor, contacta con tu supervisor si crees que esto es un error.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Volver Atrás
        </Button>

        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          Ir al Inicio
        </Button>
      </Box>
    </Box>
  );
};

export default Unauthorized; 