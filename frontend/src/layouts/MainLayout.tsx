import React, { useState, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { styled, alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  FolderSpecial as FolderSpecialIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  SupervisorAccount as AdminIcon,
  Person as UserIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import InformeSupervisadoModal from '../components/InformeSupervisadoModal';

// Interfaces para los elementos del menú
interface SubMenuItem {
  text: string;
  path: string;
  onClick?: (event: React.MouseEvent) => void;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  subItems?: SubMenuItem[];
}

// Ancho del drawer
const drawerWidth = 280;

// Componente AppBar personalizado
const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  boxShadow: '0 8px 25px 0 rgba(0,0,0,0.04)',
  backdropFilter: 'blur(10px)',
  backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.8 : 0.75),
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  height: 70,
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// Componente Drawer personalizado
const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    backgroundColor: theme.palette.mode === 'light' 
      ? alpha(theme.palette.primary.main, 0.03)
      : alpha(theme.palette.primary.main, 0.1),
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: '0 0 20px 0 rgba(0,0,0,0.05)',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

// Componente ListItem personalizado para elementos activos
const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  '& .MuiListItemButton-root': {
    borderRadius: '12px',
    margin: '4px 8px',
    transition: 'all 0.2s ease-in-out',
    ...(active && {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.15 : 0.25),
      color: theme.palette.primary.main,
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.2 : 0.3),
      },
    }),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.15),
    },
  },
}));

// Componente principal
const MainLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const { mode, toggleColorMode } = useContext(ThemeContext);
  const { usuario, logout } = useAuth(); // Obtener datos del usuario y función logout desde el contexto de autenticación
  
  // Función para formatear la fecha actual
  const formatearFecha = () => {
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('es-ES', opciones);
  };
  
  // Estado para el menú de usuario
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openUserMenu = Boolean(anchorEl);

  // Estados para los submenús con persistencia en localStorage
  const [openActividadesMenu, setOpenActividadesMenu] = useState(() => {
    const saved = localStorage.getItem('openActividadesMenu');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [openInformesMenu, setOpenInformesMenu] = useState(() => {
    const saved = localStorage.getItem('openInformesMenu');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [openProyectosMenu, setOpenProyectosMenu] = useState(() => {
    const saved = localStorage.getItem('openProyectosMenu');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [openAdminMenu, setOpenAdminMenu] = useState(() => {
    const saved = localStorage.getItem('openAdminMenu');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [openUserMenu2, setOpenUserMenu2] = useState(() => {
    const saved = localStorage.getItem('openUserMenu2');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Estado para controlar la apertura de la modal de informes por supervisado
  const [openInformeSupervisadoModal, setOpenInformeSupervisadoModal] = useState(false);
  
  // Funciones para actualizar el estado y guardarlo en localStorage
  const toggleActividadesMenu = () => {
    const newState = !openActividadesMenu;
    setOpenActividadesMenu(newState);
    localStorage.setItem('openActividadesMenu', JSON.stringify(newState));
  };
  
  const toggleInformesMenu = () => {
    const newState = !openInformesMenu;
    setOpenInformesMenu(newState);
    localStorage.setItem('openInformesMenu', JSON.stringify(newState));
  };
  
  const toggleProyectosMenu = () => {
    const newState = !openProyectosMenu;
    setOpenProyectosMenu(newState);
    localStorage.setItem('openProyectosMenu', JSON.stringify(newState));
  };
  
  const toggleAdminMenu = () => {
    const newState = !openAdminMenu;
    setOpenAdminMenu(newState);
    localStorage.setItem('openAdminMenu', JSON.stringify(newState));
  };
  
  const toggleUserMenu2 = () => {
    const newState = !openUserMenu2;
    setOpenUserMenu2(newState);
    localStorage.setItem('openUserMenu2', JSON.stringify(newState));
  };

  // Manejo de apertura/cierre del drawer
  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Manejo de apertura del menú de usuario
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Manejo de cierre del menú de usuario
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  // Manejo de logout
  const handleLogout = async () => {
    try {
      await logout(); // Usar la función de logout del contexto
      handleUserMenuClose();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Verificar si una ruta está activa
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Manejar la apertura de la modal de informes por supervisado
  const handleOpenInformeSupervisadoModal = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevenir la navegación
    setOpenInformeSupervisadoModal(true);
  };

  // Elementos del menú de administración (común para ambos roles)
  const adminMenuItems: MenuItem[] = [];

  // Elementos del menú para supervisores
  const userMenuItems: MenuItem[] = usuario?.rol === 'supervisor' ? [
    { 
      text: 'Gestión de Actividades', 
      icon: <AssignmentIcon />, 
      path: '/actividades',
      subItems: [
        { text: 'Asignar Actividades', path: '/actividades/asignar' },
        { text: 'Revisar Actividades', path: '/revision-actividades' },
      ] 
    },
    { 
      text: 'Proyectos', 
      icon: <FolderSpecialIcon />, 
      path: '/proyectos',
      subItems: [
        { text: 'Gestión de Proyectos', path: '/proyectos' },
        { text: 'Asignar Proyectos', path: '/proyectos/asignar' },
        { text: 'Proyectos Inactivos', path: '/proyectos/inactivos' },
      ] 
    },
    { 
      text: 'Informes', 
      icon: <BarChartIcon />, 
      path: '/informes',
      subItems: [
        { text: 'Por Supervisado', path: '/informes/supervisados', onClick: handleOpenInformeSupervisadoModal },
        { text: 'Por Fecha', path: '/informes/fecha' },
        { text: 'Por Proyecto', path: '/informes/proyecto' },
        { text: 'Exportar a Excel', path: '/informes/exportar' },
      ] 
    },
    { text: 'Supervisados', icon: <PeopleIcon />, path: '/supervisados' },
    { text: 'Tipos de Actividad', icon: <CategoryIcon />, path: '/tipos-actividad' },
  ] : [
    // Elementos del menú para funcionarios
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Portal de Proyectos', icon: <FolderSpecialIcon />, path: '/portal-proyectos' },
    { text: 'Mis Actividades', icon: <AssignmentIcon />, path: '/mis-actividades' },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Barra superior */}
      <StyledAppBar position="fixed" open={open}>
        <Toolbar
          sx={{
            pr: '24px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Logo en el header cuando la sidebar está cerrada */}
          {!open && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 2,
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Box
                component="img"
                src={mode === 'light' ? '/src/assets/images/logo_servicios.png' : '/src/assets/images/logo_servicios2.png'}
                alt="Logo"
                sx={{
                  height: 40,
                  width: 'auto',
                  mr: 1,
                  transition: 'all 0.3s ease-in-out',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))',
                }}
              />
            </Box>
          )}

          <IconButton
            edge="start"
            color="inherit"
            aria-label="abrir menú"
            onClick={toggleDrawer}
            sx={{
              ...(open && { display: 'none' }),
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              borderRadius: '10px',
              padding: '8px',
              mr: 2,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Sección de búsqueda */}
          <Box
            sx={{
              backgroundColor: alpha(theme.palette.common.white, theme.palette.mode === 'light' ? 0.15 : 0.05),
              borderRadius: '12px',
              px: 2,
              py: 0.8,
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              width: { xs: '40%', md: '30%' },
              mr: 2,
            }}
          >
            <Box component="span" sx={{ color: alpha(theme.palette.text.primary, 0.5), mr: 1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </Box>
            <Box
              component="input"
              placeholder="Buscar..."
              sx={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: theme.palette.text.primary,
                width: '100%',
                fontSize: '0.9rem',
                '&::placeholder': {
                  color: alpha(theme.palette.text.primary, 0.5),
                },
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          
          {/* Fecha actual */}
          <Typography 
            variant="body2" 
            sx={{ 
              mr: 2, 
              fontWeight: 500,
              color: theme.palette.text.secondary,
              display: { xs: 'none', md: 'block' },
              backgroundColor: alpha(theme.palette.background.default, 0.6),
              borderRadius: '10px',
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            {formatearFecha()}
          </Typography>

          {/* Botón de cambio de tema */}
          <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
            <IconButton 
              onClick={toggleColorMode} 
              sx={{
                color: theme.palette.text.secondary,
                backgroundColor: alpha(theme.palette.background.default, 0.6),
                borderRadius: '10px',
                padding: '8px',
                mr: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                },
              }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Botón de usuario */}
          <Box 
            onClick={handleUserMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              borderRadius: '12px',
              padding: '6px 12px',
              transition: 'all 0.2s ease',
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
              },
            }}
          >
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36,
                backgroundColor: theme.palette.primary.main,
                color: '#fff',
                fontWeight: 'bold',
                boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
              }}
            >
              {usuario?.nombres.charAt(0)}{usuario?.appaterno.charAt(0)}
            </Avatar>
            <Box sx={{ ml: 1.5, display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {usuario?.nombres} {usuario?.appaterno}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                {usuario?.rol === 'funcionario' ? 'Funcionario' : 'Supervisor'}
              </Typography>
            </Box>
            <Box 
              component="span" 
              sx={{ 
                ml: 1, 
                color: theme.palette.text.secondary,
                display: { xs: 'none', sm: 'block' },
                transition: 'transform 0.2s ease',
                transform: openUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </Box>
          </Box>

          {/* Menú de usuario mejorado */}
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={openUserMenu}
            onClose={handleUserMenuClose}
            onClick={handleUserMenuClose}
            PaperProps={{
              elevation: 8,
              sx: {
                overflow: 'visible',
                borderRadius: '16px',
                mt: 1.5,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                minWidth: 280,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 20,
                  width: 12,
                  height: 12,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, pb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  sx={{ 
                    width: 50, 
                    height: 50,
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  {usuario?.nombres.charAt(0)}{usuario?.appaterno.charAt(0)}
                </Avatar>
                <Box sx={{ ml: 1.5, width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {usuario?.nombres} {usuario?.appaterno}
                  </Typography>
                  
                  {/* Correo electrónico */}
                  <Typography 
                    variant="body2" 
                    color="textSecondary" 
                    sx={{ 
                      mt: 0.5, 
                      fontSize: '0.85rem',
                      display: 'block',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {usuario?.email}
                  </Typography>
                  
                  {/* Badge del rol */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mt: 0.8,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderRadius: '4px',
                      px: 1,
                      py: 0.2,
                      width: 'fit-content',
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: theme.palette.primary.main,
                        mr: 0.8,
                      }} 
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {usuario?.rol === 'supervisor' ? 'Supervisor' : 'Funcionario'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <MenuItem 
              onClick={() => {
                handleUserMenuClose();
                navigate('/perfil');
              }}
              sx={{ borderRadius: '8px', mx: 1, my: 0.5 }}
            >
              <ListItemIcon>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </ListItemIcon>
              <Typography variant="body2">Mi Perfil</Typography>
            </MenuItem>
            
            <MenuItem sx={{ borderRadius: '8px', mx: 1, my: 0.5 }}>
              <ListItemIcon>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </ListItemIcon>
              <Typography variant="body2">Configuración</Typography>
            </MenuItem>
            
            <MenuItem sx={{ borderRadius: '8px', mx: 1, my: 0.5 }}>
              <ListItemIcon>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </ListItemIcon>
              <Typography variant="body2">Notificaciones</Typography>
            </MenuItem>
            
            <Divider sx={{ my: 1 }} />
            
            <MenuItem onClick={handleLogout} sx={{ borderRadius: '8px', mx: 1, my: 0.5, color: theme.palette.error.main }}>
              <ListItemIcon sx={{ color: theme.palette.error.main }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </ListItemIcon>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Cerrar Sesión</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      {/* Menú lateral */}
      <StyledDrawer variant="permanent" open={open}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pt: 3,
            pb: 2,
            position: 'relative',
          }}
        >
          <Box 
            component="img"
            src={mode === 'light' ? '/src/assets/images/logo_servicios.png' : '/src/assets/images/logo_servicios2.png'}
            alt="Logo"
            sx={{
              height: open ? 80 : 45,
              width: 'auto',
              display: 'block',
              transition: 'all 0.3s ease-in-out',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))',
              opacity: 1,
              mb: open ? 1 : 0,
              transform: 'scale(1)',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />
          {open && (
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                mt: 1,
                color: theme.palette.primary.main,
                letterSpacing: '0.5px',
              }}
            >
              Agenda de Actividades
            </Typography>
          )}
          <IconButton 
            onClick={toggleDrawer}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(4px)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
              },
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 2, opacity: 0.6 }} />
        
        {/* Sección de Administración */}
        {open && adminMenuItems.length > 0 && (
          <Box sx={{ px: 3, mb: 1 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                py: 0.5,
              }}
              onClick={toggleAdminMenu}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AdminIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  sx={{ 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '0.7rem',
                  }}
                >
                  {usuario?.rol === 'supervisor' ? 'Supervisor' : 'Funcionario'}
                </Typography>
              </Box>
              {openAdminMenu ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Box>
          </Box>
        )}
        
        {adminMenuItems.length > 0 && (
          <Collapse in={open ? openAdminMenu : true} timeout="auto" unmountOnExit={false}>
            <List component="nav" dense={!open}>
              {adminMenuItems.map((item) => (
                <StyledListItem 
                  key={item.text} 
                  disablePadding 
                  sx={{ 
                    display: 'block',
                    mb: 0.5,
                  }} 
                  active={isActive(item.path)}
                >
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: open ? 2 : 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontSize: '0.95rem',
                        fontWeight: isActive(item.path) ? 600 : 400,
                      }}
                      sx={{ opacity: open ? 1 : 0 }} 
                    />
                  </ListItemButton>
                </StyledListItem>
              ))}
            </List>
          </Collapse>
        )}
        
        {adminMenuItems.length === 0 ? null : <Divider sx={{ my: 2, opacity: 0.6 }} />}
        
        {/* Sección de Usuario */}
        {open && (
          <Box sx={{ px: 3, mb: 1 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                py: 0.5,
              }}
              onClick={toggleUserMenu2}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <UserIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  sx={{ 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '0.7rem',
                  }}
                >
                  Agenda de Actividades
                </Typography>
              </Box>
              {openUserMenu2 ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Box>
          </Box>
        )}
        
        <Collapse in={open ? openUserMenu2 : true} timeout="auto" unmountOnExit={false}>
          <List component="nav" dense={!open}>
            {userMenuItems.map((item) => (
              <React.Fragment key={item.text}>
                <StyledListItem 
                  disablePadding 
                  sx={{ 
                    display: 'block',
                    mb: 0.5,
                  }} 
                  active={isActive(item.path) || (item.subItems && item.subItems.some(subItem => isActive(subItem.path)))}
                >
                  <ListItemButton
                    component={item.subItems ? 'div' : Link}
                    to={item.subItems ? undefined : item.path}
                    onClick={item.subItems ? () => {
                      if (item.text === 'Gestión de Actividades') toggleActividadesMenu();
                      else if (item.text === 'Proyectos') toggleProyectosMenu();
                      else if (item.text === 'Informes') toggleInformesMenu();
                    } : undefined}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: open ? 2 : 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{ 
                            fontSize: '0.95rem',
                            fontWeight: isActive(item.path) || (item.subItems && item.subItems.some(subItem => isActive(subItem.path))) ? 600 : 400,
                          }}
                        />
                        {item.subItems && (
                          <IconButton edge="end" sx={{ padding: 0 }}>
                            {(item.text === 'Gestión de Actividades' && openActividadesMenu) || 
                             (item.text === 'Proyectos' && openProyectosMenu) || 
                             (item.text === 'Informes' && openInformesMenu) ? 
                              <ExpandLessIcon fontSize="small" /> : 
                              <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        )}
                      </>
                    )}
                  </ListItemButton>
                </StyledListItem>
                
                {/* Submenú para elementos con subitems */}
                {item.subItems && (
                  <Collapse 
                    in={
                      open && (
                        (item.text === 'Gestión de Actividades' && openActividadesMenu) || 
                        (item.text === 'Proyectos' && openProyectosMenu) || 
                        (item.text === 'Informes' && openInformesMenu)
                      )
                    } 
                    timeout="auto" 
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <StyledListItem 
                          key={subItem.text} 
                          disablePadding 
                          sx={{ 
                            display: 'block',
                            mb: 0.5,
                          }} 
                          active={isActive(subItem.path)}
                        >
                          <ListItemButton
                            component={subItem.onClick ? 'button' : Link}
                            to={subItem.onClick ? undefined : subItem.path}
                            onClick={subItem.onClick}
                            sx={{
                              minHeight: 40,
                              justifyContent: open ? 'initial' : 'center',
                              px: open ? 2 : 2.5,
                              pl: open ? 4 : 2.5,
                            }}
                          >
                            <ListItemText 
                              primary={subItem.text} 
                              primaryTypographyProps={{ 
                                fontSize: '0.85rem',
                                fontWeight: isActive(subItem.path) ? 600 : 400,
                              }}
                              sx={{ 
                                opacity: open ? 1 : 0,
                                ml: 1
                              }} 
                            />
                          </ListItemButton>
                        </StyledListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            ))}
          </List>
        </Collapse>
      </StyledDrawer>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          pt: '64px', // Altura del AppBar
        }}
      >
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>

      {/* Modal de Informes por Supervisado */}
      <InformeSupervisadoModal 
        open={openInformeSupervisadoModal} 
        onClose={() => setOpenInformeSupervisadoModal(false)} 
      />
    </Box>
  );
};

export default MainLayout;
