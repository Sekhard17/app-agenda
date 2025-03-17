import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  IconButton,
  useTheme,
  Skeleton,
  Chip,
  LinearProgress,
  Button,
  Fade
} from '@mui/material';
import NoDataMessage from '../components/NoDataMessage';
import RecentActivities from '../components/dashboard/RecentActivities';
import { alpha } from '@mui/material/styles';
import { 
  Add as AddIcon,
  FolderSpecial as FolderSpecialIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Today as TodayIcon,
  Folder as FolderIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarTodayIcon,
  Visibility as VisibilityIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import DashboardService, {
  ProyectoResumen,
  SupervisadoResumen,
  EstadisticaResumen,
  Proyecto
} from '../services/dashboard.service';
import { ActividadReciente } from '../services/actividades.service';
import ActividadesHoyModal from '../components/dashboard/ActividadesHoyModal';

// La función formatearFecha se ha movido al componente RecentActivities

// Función para mapear nombres de iconos a componentes React
const getIconComponent = (iconName: string | React.ReactElement) => {
  // Si ya es un componente React, devolverlo directamente
  if (React.isValidElement(iconName)) {
    return iconName;
  }
  
  // Si es un string, mapear al componente correspondiente
  switch (iconName) {
    case 'Today':
      return <TodayIcon />;
    case 'PendingActions':
      return <PendingActionsIcon />;
    case 'FolderSpecial':
      return <FolderSpecialIcon />;
    case 'CheckCircle':
      return <CheckCircleIcon />;
    case 'Folder':
      return <FolderIcon />;
    case 'Assignment':
      return <AssignmentIcon />;
    case 'CalendarToday':
      return <CalendarTodayIcon />;
    default:
      return <TodayIcon />; // Icono por defecto
  }
};

const Dashboard = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  
  // Estados para los datos
  const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
  const [supervisados, setSupervisados] = useState<SupervisadoResumen[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
  const [modalActividadesHoy, setModalActividadesHoy] = useState(false);
  const [actividadesHoy, setActividadesHoy] = useState<Proyecto[]>([]);

  // Función para cargar datos
  const cargarDatos = async () => {
      try {
        setCargando(true);
        
        // Obtener datos reales desde la API
        try {
          // Intentar obtener todos los datos del dashboard de una vez
          const dashboardData = await DashboardService.getDashboardData(
            usuario?.rol === 'supervisor',
            usuario?.rol !== 'supervisor' ? usuario?.id : undefined
          );
          
          if (dashboardData.estadisticas) {
            // Transformar los iconos de string a componentes React
            const estadisticasConIconos = dashboardData.estadisticas.map(est => ({
              ...est,
              icono: est.icono ? getIconComponent(est.icono) : <TodayIcon />
            }));
            
            // Ya no necesitamos el cast porque la interfaz ahora acepta React.ReactElement
            setEstadisticas(estadisticasConIconos);
            
            // Verificar si hay actividades de hoy
            const actividadesHoyEstadistica = estadisticasConIconos.find(est => est.titulo === 'Actividades Hoy');
            if (actividadesHoyEstadistica && actividadesHoyEstadistica.valor === 0) {
              console.log('Contador de actividades hoy es 0, intentando cargar actividades de hoy directamente...');
              // Si el contador es 0, intentamos cargar las actividades directamente
              await cargarActividadesHoy();
              const actividadesCount = actividadesHoy.reduce((total, proyecto) => total + proyecto.actividades.length, 0);
              
              if (actividadesCount > 0) {
                console.log(`Se encontraron ${actividadesCount} actividades, actualizando estadísticas...`);
                // Actualizamos el contador en las estadísticas
                const estadisticasActualizadas = estadisticasConIconos.map(est => 
                  est.titulo === 'Actividades Hoy' 
                    ? { ...est, valor: actividadesCount } 
                    : est
                );
                setEstadisticas(estadisticasActualizadas);
              }
            }
          }
          
          if (dashboardData.proyectos) {
            setProyectos(dashboardData.proyectos);
          }
          
          if (dashboardData.supervisados) {
            setSupervisados(dashboardData.supervisados);
          }
          
          if (dashboardData.actividadesRecientes) {
            const nombreCompleto = usuario ? 
              `${usuario.nombres} ${usuario.appaterno}${usuario.apmaterno ? ` ${usuario.apmaterno}` : ''}` : 
              'Usuario';
            // Actualizar el nombre de usuario en las actividades recientes
            const actividadesActualizadas = dashboardData.actividadesRecientes.map(actividad => ({
              ...actividad,
              usuario: nombreCompleto
            }));
            setActividadesRecientes(actividadesActualizadas);
          }
        } catch (error) {
          console.error('Error al cargar datos del dashboard:', error);
          
          // Si falla, intentamos cargar cada sección por separado
          // Obtener estadísticas (tarjetas)
          try {
            const estadisticasData = await DashboardService.getEstadisticas();
            
            // Transformar los iconos de string a componentes React
            const estadisticasConIconos = estadisticasData.map(est => ({
              ...est,
              icono: est.icono ? getIconComponent(est.icono) : <TodayIcon />
            }));
            
            // Ya no necesitamos el cast porque la interfaz ahora acepta React.ReactElement
            setEstadisticas(estadisticasConIconos);
            
            // Verificar si hay actividades de hoy
            const actividadesHoyEstadistica = estadisticasConIconos.find(est => est.titulo === 'Actividades Hoy');
            if (actividadesHoyEstadistica && actividadesHoyEstadistica.valor === 0) {
              console.log('Contador de actividades hoy es 0, intentando cargar actividades de hoy directamente...');
              // Si el contador es 0, intentamos cargar las actividades directamente
              await cargarActividadesHoy();
              const actividadesCount = actividadesHoy.reduce((total, proyecto) => total + proyecto.actividades.length, 0);
              
              if (actividadesCount > 0) {
                console.log(`Se encontraron ${actividadesCount} actividades, actualizando estadísticas...`);
                // Actualizamos el contador en las estadísticas
                const estadisticasActualizadas = estadisticasConIconos.map(est => 
                  est.titulo === 'Actividades Hoy' 
                    ? { ...est, valor: actividadesCount } 
                    : est
                );
                setEstadisticas(estadisticasActualizadas);
              }
            }
          } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            // Datos de respaldo para estadísticas en caso de error
            const fallbackEstadisticas: any[] = [
              {
                titulo: 'Actividades Hoy',
                valor: 0,
                icono: <TodayIcon />,
                color: theme.palette.primary.main,
                subtexto: 'Sin datos',
                tendencia: 'estable'
              },
              {
                titulo: 'Borradores Pendientes',
                valor: 0,
                icono: <PendingActionsIcon />,
                color: theme.palette.warning.main,
                subtexto: 'Sin datos',
                tendencia: 'estable'
              },
              {
                titulo: 'Mis Proyectos Asignados',
                valor: 0,
                icono: <FolderSpecialIcon />,
                color: theme.palette.info.main,
                subtexto: 'Sin datos',
                tendencia: 'estable'
              },
              {
                titulo: 'Tasa de Completitud',
                valor: 0,
                total: 100,
                icono: <CheckCircleIcon />,
                color: theme.palette.success.main,
                subtexto: 'Sin datos',
                tendencia: 'estable'
              }
            ];
            setEstadisticas(fallbackEstadisticas as unknown as EstadisticaResumen[]);
          }
          
          // Obtener proyectos activos
          try {
            const proyectosData = await DashboardService.getProyectosActivos(
              usuario?.rol === 'supervisor',
              usuario?.rol !== 'supervisor' ? usuario?.id : undefined
            );
            setProyectos(proyectosData);
          } catch (error) {
            console.error('Error al cargar proyectos:', error);
            setProyectos([]);
          }
          
          // Obtener supervisados (solo si el usuario es supervisor)
          if (usuario?.rol === 'supervisor') {
            try {
              const supervisadosData = await DashboardService.getSupervisados();
              setSupervisados(supervisadosData);
            } catch (error) {
              console.error('Error al cargar supervisados:', error);
              setSupervisados([]);
            }
          } else {
            setSupervisados([]);
          }
        }
      } catch (error) {
        console.error('Error general al cargar datos del dashboard:', error);
      } finally {
        setCargando(false);
      }
    };
  
  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
    // Precargamos las actividades de hoy para tenerlas listas cuando se abra el modal
    cargarActividadesHoy();
  }, [theme, usuario]);

  // Filtrar estadísticas según el rol del usuario
  const estadisticasFiltradas = useMemo(() => {
    if (!usuario) return estadisticas;
    
    // Si el usuario es supervisor, filtrar la tarjeta de "Pendientes"
    if (usuario.rol === 'supervisor') {
      return estadisticas.filter(est => est.titulo !== 'Pendientes');
    }
    
    return estadisticas;
  }, [estadisticas, usuario]);

  // Función para cargar las actividades de hoy
  const cargarActividadesHoy = async () => {
    try {
      console.log('Iniciando carga de actividades de hoy...');
      const actividades = await DashboardService.getActividadesHoy();
      console.log('Actividades de hoy recibidas en el componente:', actividades);
      setActividadesHoy(actividades);
      
      if (actividades.length === 0) {
        console.log('No se encontraron actividades para hoy');
      } else {
        console.log(`Se encontraron ${actividades.length} proyectos con actividades para hoy`);
        // Contar el total de actividades en todos los proyectos
        const totalActividades = actividades.reduce((total, proyecto) => total + proyecto.actividades.length, 0);
        console.log(`Total de actividades en todos los proyectos: ${totalActividades}`);
        
        // Actualizar el contador en las estadísticas si es necesario
        if (totalActividades > 0) {
          setEstadisticas(estadisticasActuales => {
            const actividadesHoyEstadistica = estadisticasActuales.find(est => est.titulo === 'Actividades Hoy');
            if (actividadesHoyEstadistica && actividadesHoyEstadistica.valor === 0) {
              console.log('Actualizando contador de actividades hoy en estadísticas:', totalActividades);
              return estadisticasActuales.map(est => 
                est.titulo === 'Actividades Hoy' 
                  ? { ...est, valor: totalActividades } 
                  : est
              );
            }
            return estadisticasActuales;
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar actividades de hoy:', error);
      setActividadesHoy([]);
    }
  };

  // Función para abrir el modal
  const handleOpenActividadesHoy = async () => {
    try {
      await cargarActividadesHoy();
      setModalActividadesHoy(true);
    } catch (error) {
      console.error('Error al abrir el modal de actividades de hoy:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, width: '100%', pb: 4 }}>
      {/* Espacio superior mínimo */}
      <Box sx={{ mb: 0 }}></Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cargando ? (
          // Esqueletos para carga
          Array.from(new Array(4)).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper sx={{ p: 3, borderRadius: '16px' }}>
                <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" />
              </Paper>
            </Grid>
          ))
        ) : estadisticasFiltradas.length > 0 ? (
          // Tarjetas de estadísticas
          estadisticasFiltradas.map((estadistica, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper 
                onClick={estadistica.titulo === 'Actividades Hoy' && usuario?.rol === 'supervisor' ? handleOpenActividadesHoy : undefined}
                sx={{ 
                  position: 'relative',
                  p: 0, 
                  borderRadius: '12px',
                  height: '120px',
                  overflow: 'hidden',
                  boxShadow: '0 3px 15px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: estadistica.titulo === 'Actividades Hoy' && usuario?.rol === 'supervisor' ? 'pointer' : 'default',
                  '&:hover': {
                    transform: estadistica.titulo === 'Actividades Hoy' && usuario?.rol === 'supervisor' ? 'translateY(-3px)' : 'none',
                    boxShadow: estadistica.titulo === 'Actividades Hoy' && usuario?.rol === 'supervisor' ? '0 8px 20px rgba(0,0,0,0.12)' : '0 3px 15px rgba(0,0,0,0.08)',
                  }
                }}
                elevation={0}
              >
                {/* Fondo con gradiente y efecto de brillo */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${estadistica.color}08 100%)`,
                  zIndex: 0,
                }}>
                  <Box sx={{
                    position: 'absolute',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: `${estadistica.color}15`,
                    filter: 'blur(25px)',
                    top: '-50px',
                    right: '-30px',
                  }} />
                </Box>
                
                {/* Contenido principal */}
                <Box sx={{ position: 'relative', zIndex: 1, p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Encabezado con icono y tendencia */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: `${estadistica.color}15`,
                          color: estadistica.color,
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          mr: 1.5
                        }}
                      >
                        {estadistica.icono}
                      </Box>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          letterSpacing: '0.2px'
                        }}
                      >
                        {estadistica.titulo}
                      </Typography>
                    </Box>
                    
                    {estadistica.tendencia && (
                      <Chip 
                        size="small"
                        label={`${estadistica.tendencia === 'subida' ? '↑' : estadistica.tendencia === 'bajada' ? '↓' : ''}${estadistica.porcentaje || 0}%`}
                        color={estadistica.tendencia === 'subida' ? 'success' : estadistica.tendencia === 'bajada' ? 'error' : 'default'}
                        sx={{ 
                          height: '20px', 
                          fontWeight: 600,
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    )}
                  </Box>
                  
                  {/* Valor principal */}
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 'auto', mb: 'auto' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem', lineHeight: 1.1, color: estadistica.color }}>
                      {estadistica.valor}
                    </Typography>
                    {estadistica.total && (
                      <Typography 
                        component="span" 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ ml: 1, fontWeight: 500, fontSize: '0.85rem' }}
                      >
                        / {estadistica.total}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Barra de progreso o texto secundario */}
                  <Box sx={{ mt: 'auto' }}>
                    {estadistica.total ? (
                      <Box sx={{ position: 'relative' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(estadistica.valor / estadistica.total) * 100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: `${estadistica.color}15`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: estadistica.color,
                              borderRadius: 3,
                            }
                          }} 
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            position: 'absolute',
                            right: 0,
                            top: '-18px',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            color: theme.palette.text.secondary
                          }}
                        >
                          {Math.round((estadistica.valor / estadistica.total) * 100)}%
                        </Typography>
                      </Box>
                    ) : estadistica.subtexto && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          fontSize: '0.75rem',
                          color: theme.palette.text.secondary,
                          fontWeight: 500,
                          mt: 0.5
                        }}
                      >
                        {estadistica.subtexto}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))
        ) : (
          // Mensaje cuando no hay estadísticas
          <Grid item xs={12}>
            <Fade in={true} timeout={800}>
              <Paper sx={{ p: 4, borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 3px 15px rgba(0,0,0,0.08)' }}>
                <NoDataMessage 
                  type="card"
                  message="No hay estadísticas disponibles"
                  subMessage="Completa algunas actividades para generar estadísticas"
                  withAnimation={true}
                />
              </Paper>
            </Fade>
          </Grid>
        )}
      </Grid>
      
      {/* Contenido principal */}
      <Grid container spacing={3}>

        {/* Columna principal */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Actividades Recientes como sección independiente */}
            <Grid item xs={12}>
              <RecentActivities 
                actividades={actividadesRecientes}
                cargando={cargando}
                descripcion={usuario?.rol === 'supervisor' ? 
                  "Registro de actividades enviadas por el equipo" : 
                  "Registro de actividades enviadas"}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Panel lateral */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3} direction="column">
            {/* Proyectos Activos */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  borderRadius: '16px',
                  background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(to bottom right, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
                    : `linear-gradient(to bottom right, #ffffff, ${alpha('#f8f9fa', 0.8)})`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`
                }}
              >
                <Box 
                  sx={{ 
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.8)})`,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                      }}
                    >
                      <FolderSpecialIcon sx={{ color: '#fff' }} />
                    </Box>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${alpha(theme.palette.text.primary, 0.8)})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {usuario?.rol === 'supervisor' ? "Proyectos Activos" : "Mis Proyectos Asignados"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {proyectos.length} {proyectos.length === 1 ? 'proyecto' : 'proyectos'} asignados
                      </Typography>
                    </Box>
                  </Box>
                  
                  {usuario?.rol === 'supervisor' && (
                    <IconButton 
                      size="small" 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.12)
                        }
                      }}
                    >
                      <AddIcon sx={{ fontSize: '1.2rem', color: theme.palette.primary.main }} />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ p: 2 }}>
                  {cargando ? (
                    <Box sx={{ p: 2 }}>
                      {Array.from(new Array(3)).map((_, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            mb: 2,
                            p: 2,
                            borderRadius: '12px',
                            background: alpha(theme.palette.background.paper, 0.4)
                          }}
                        >
                          <Skeleton variant="text" width="60%" height={24} />
                          <Skeleton variant="text" width="40%" height={20} />
                        </Box>
                      ))}
                    </Box>
                  ) : proyectos.length === 0 ? (
                    <Box 
                      sx={{ 
                        p: 4,
                        textAlign: 'center',
                        color: theme.palette.text.secondary
                      }}
                    >
                      <FolderIcon sx={{ fontSize: '3rem', opacity: 0.3, mb: 1 }} />
                      <Typography variant="body2">
                        No hay proyectos activos
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ px: 1 }}>
                      {proyectos.map((proyecto: ProyectoResumen, index) => (
                        <Box 
                          key={proyecto.id}
                          sx={{ 
                            position: 'relative',
                            p: 2,
                            mb: index < proyectos.length - 1 ? 2 : 0,
                            borderRadius: '12px',
                            background: alpha(theme.palette.background.paper, 0.4),
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.3s ease',
                            cursor: usuario?.rol === 'supervisor' ? 'pointer' : 'default',
                            overflow: 'hidden',
                            '&:hover': usuario?.rol === 'supervisor' ? {
                              background: alpha(theme.palette.background.paper, 0.7),
                              transform: 'translateY(-2px)',
                              '& .proyecto-actions': {
                                opacity: 1,
                                transform: 'translateX(0)'
                              }
                            } : {},
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: '10%',
                              height: '80%',
                              width: '3px',
                              background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.3)})`,
                              borderRadius: '3px'
                            }
                          }}
                        >
                          <Box sx={{ pl: 2 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                mb: 1,
                                color: theme.palette.text.primary
                              }}
                            >
                              {proyecto.nombre}
                            </Typography>
                            
                            <Box 
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                color: theme.palette.text.secondary,
                                fontSize: '0.8125rem'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AssignmentIcon sx={{ fontSize: '1rem' }} />
                                {proyecto.actividades_totales} actividades
                              </Box>
                              {proyecto.fecha_limite && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CalendarTodayIcon sx={{ fontSize: '1rem' }} />
                                  {new Date(proyecto.fecha_limite).toLocaleDateString()}
                                </Box>
                              )}
                            </Box>

                            <Box 
                              className="proyecto-actions"
                              sx={{ 
                                position: 'absolute',
                                right: 16,
                                top: '50%',
                                transform: 'translateY(-50%) translateX(10px)',
                                opacity: 0,
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                gap: 1
                              }}
                            >
                              <IconButton 
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12)
                                  }
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                              </IconButton>
                              <IconButton 
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12)
                                  }
                                }}
                              >
                                <AddCircleOutlineIcon sx={{ fontSize: '1.1rem' }} />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                      
                      {!cargando && proyectos.length > 0 && (
                        <Box 
                          sx={{ 
                            mt: 2,
                            textAlign: 'center'
                          }}
                        >
                          <Button
                            variant="text"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            sx={{ 
                              color: theme.palette.primary.main,
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08)
                              }
                            }}
                          >
                            Ver todos los proyectos
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
            
            {/* Mi Equipo (solo para supervisores) */}
            {usuario?.rol === 'supervisor' && supervisados.length > 0 && (
              <Grid item xs={12}>
                <Card sx={{ 
                  borderRadius: '20px', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  position: 'relative',
                  background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.2)} 100%)`
                    : `linear-gradient(145deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha(theme.palette.primary.light, 0.15)} 100%)`
                }}>
                  {/* ... contenido de Mi Equipo ... */}
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Agregar el modal al final del componente */}
      <ActividadesHoyModal
        open={modalActividadesHoy}
        onClose={() => setModalActividadesHoy(false)}
        proyectos={actividadesHoy}
      />
    </Box>
  );
};

export default Dashboard;