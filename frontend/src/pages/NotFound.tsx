import { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, useTheme, Paper, Fade, Grow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [showElements, setShowElements] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // Animación secuencial de elementos
    const timer1 = setTimeout(() => setShowElements(true), 300);
    const timer2 = setTimeout(() => setShowButtons(true), 1200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Elementos decorativos de fondo */}
      {Array.from({ length: 20 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: Math.random() * 300 + 50,
            height: Math.random() * 300 + 50,
            borderRadius: '50%',
            background: theme.palette.mode === 'dark'
              ? `rgba(255, 255, 255, ${Math.random() * 0.03 + 0.01})`
              : `rgba(0, 0, 0, ${Math.random() * 0.03 + 0.01})`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(40px)',
            zIndex: 0,
          }}
        />
      ))}

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Grow in={true} timeout={1000}>
          <Paper
            elevation={6}
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: '24px',
              background: theme.palette.mode === 'dark'
                ? 'rgba(26, 32, 53, 0.8)'
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 10px 30px rgba(0, 0, 0, 0.5)'
                : '0 10px 30px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Elemento decorativo */}
            <Box
              sx={{
                position: 'absolute',
                top: '-100px',
                right: '-100px',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                opacity: 0.1,
                zIndex: 0,
              }}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Fade in={showElements} timeout={800}>
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontSize: { xs: '8rem', sm: '12rem', md: '15rem' },
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-5px',
                    mb: 0,
                    lineHeight: 1,
                    textShadow: theme.palette.mode === 'dark'
                      ? '0 5px 30px rgba(0, 0, 0, 0.5)'
                      : '0 5px 30px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  404
                </Typography>
              </Fade>

              <Fade in={showElements} timeout={1000} style={{ transitionDelay: '200ms' }}>
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 30%, ${theme.palette.text.secondary} 90%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.5px',
                  }}
                >
                  Página no encontrada
                </Typography>
              </Fade>

              <Fade in={showElements} timeout={1200} style={{ transitionDelay: '400ms' }}>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 5,
                    maxWidth: '600px',
                    color: theme.palette.text.secondary,
                    lineHeight: 1.6,
                    fontSize: '1.1rem',
                  }}
                >
                  Lo sentimos, la página que estás buscando no existe o ha sido movida.
                  Por favor, verifica la URL o regresa al inicio.
                </Typography>
              </Fade>

              <Fade in={showButtons} timeout={800}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<HomeIcon />}
                    onClick={() => navigate('/')}
                    sx={{
                      borderRadius: '12px',
                      py: 1.5,
                      px: 4,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                        : '0 4px 20px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 8px 25px rgba(0, 0, 0, 0.6)'
                          : '0 8px 25px rgba(0, 0, 0, 0.2)',
                      },
                    }}
                  >
                    Volver al inicio
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{
                      borderRadius: '12px',
                      py: 1.5,
                      px: 4,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderWidth: '2px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderWidth: '2px',
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    Regresar
                  </Button>
                </Box>
              </Fade>
            </Box>
          </Paper>
        </Grow>
      </Container>
    </Box>
  );
};

export default NotFound;
