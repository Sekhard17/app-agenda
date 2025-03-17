import { useMemo, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { SnackbarProvider } from 'notistack';

// Importar la fuente Inter
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Contexto para el tema
import { ThemeContext } from './context/ThemeContext';

// Contexto de autenticación
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Páginas para el rol de supervisor
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import RevisionActividades from './pages/RevisionActividades';
import GestionProyectos from './pages/GestionProyectos';
import AsignarProyectos from './pages/AsignarProyectos';
import ProyectosInactivos from './pages/ProyectosInactivos';
import Supervisados from './pages/Supervisados';
import TiposActividad from './pages/TiposActividad';

// Páginas para el rol de funcionario
import MisActividades from './pages/MisActividades';
import RegistrarActividad from './pages/RegistrarActividad';

// Crear cliente de consulta
const queryClient = new QueryClient();

import PrivateRoute from './components/PrivateRoute';
import Unauthorized from './pages/Unauthorized';

function App() {
  // Estado para el modo de tema (claro/oscuro)
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    // Recuperar preferencia guardada o usar preferencia del sistema
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      return savedMode;
    }
    // Detectar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Guardar preferencia de tema cuando cambia
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Función para alternar el tema
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Crear tema basado en el modo actual
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
            ...(mode === 'dark' && {
              main: '#90caf9',
            }),
          },
          secondary: {
            main: '#f50057',
            ...(mode === 'dark' && {
              main: '#f48fb1',
            }),
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 600,
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
          },
          h6: {
            fontSize: '1rem',
            fontWeight: 500,
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarColor: mode === 'dark' ? '#6b6b6b #2b2b2b' : '#959595 #f5f5f5',
                '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                  borderRadius: 8,
                  backgroundColor: mode === 'dark' ? '#6b6b6b' : '#959595',
                  minHeight: 24,
                },
                '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                  backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
                },
                '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                  backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
                },
                '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
                },
                '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
                  borderRadius: 8,
                  backgroundColor: mode === 'dark' ? '#2b2b2b' : '#f5f5f5',
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                padding: '8px 16px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                },
              },
              contained: {
                boxShadow: mode === 'dark' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.5)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: '12px',
                boxShadow: mode === 'dark' 
                  ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                  : '0 4px 8px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: mode === 'dark' 
                    ? '0 8px 24px rgba(0, 0, 0, 0.6)' 
                    : '0 8px 24px rgba(0, 0, 0, 0.1)',
                },
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  transition: 'box-shadow 0.2s ease-in-out',
                  '&.Mui-focused': {
                    boxShadow: mode === 'dark' 
                      ? '0 0 0 2px rgba(144, 202, 249, 0.2)' 
                      : '0 0 0 2px rgba(25, 118, 210, 0.2)',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: '6px',
                fontWeight: 500,
              },
            },
          },
          MuiTypography: {
            styleOverrides: {
              root: {
                letterSpacing: '-0.01em',
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Normaliza los estilos CSS */}
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <QueryClientProvider client={queryClient}>
            <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
              <AuthProvider>
                <Router>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    
                    {/* Rutas protegidas dentro del MainLayout */}
                    <Route path="/" element={
                      <PrivateRoute>
                        <MainLayout />
                      </PrivateRoute>
                    }>
                      <Route index element={<Dashboard />} />
                      
                      {/* Rutas para supervisor */}
                      <Route path="revision-actividades" element={
                        <PrivateRoute roles={['supervisor']}>
                          <RevisionActividades />
                        </PrivateRoute>
                      } />
                      <Route path="proyectos" element={
                        <PrivateRoute roles={['supervisor']}>
                          <GestionProyectos />
                        </PrivateRoute>
                      } />
                      <Route path="proyectos/asignar" element={
                        <PrivateRoute roles={['supervisor']}>
                          <AsignarProyectos />
                        </PrivateRoute>
                      } />
                      <Route path="proyectos/inactivos" element={
                        <PrivateRoute roles={['supervisor']}>
                          <ProyectosInactivos />
                        </PrivateRoute>
                      } />
                      <Route path="supervisados" element={
                        <PrivateRoute roles={['supervisor']}>
                          <Supervisados />
                        </PrivateRoute>
                      } />
                      <Route path="tipos-actividad" element={
                        <PrivateRoute roles={['supervisor']}>
                          <TiposActividad />
                        </PrivateRoute>
                      } />
                      
                      {/* Rutas para funcionario */}
                      <Route path="mis-actividades" element={
                        <PrivateRoute roles={['funcionario']}>
                          <MisActividades />
                        </PrivateRoute>
                      } />
                      <Route path="registrar-actividad" element={
                        <PrivateRoute roles={['funcionario']}>
                          <RegistrarActividad />
                        </PrivateRoute>
                      } />
                    </Route>
                    
                    {/* NotFound como página independiente */}
                    <Route path="/not-found" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/not-found" replace />} />
                  </Routes>
                </Router>
              </AuthProvider>
            </SnackbarProvider>
          </QueryClientProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;
