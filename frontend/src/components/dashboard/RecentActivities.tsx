import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Chip, 
  Divider, 
  useTheme,
  Fade,
  Card,
  CardHeader,
  CardContent,
  Grid,
  alpha
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import NoDataMessage from '../NoDataMessage';
import { ActividadReciente } from '../../services/actividades.service';

// Función para formatear fechas en un formato amigable
const formatearFecha = (fechaStr: string): string => {
  try {
    const fecha = new Date(fechaStr);
    
    // Verificar si la fecha es válida
    if (isNaN(fecha.getTime())) {
      return 'Fecha desconocida';
    }
    
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    // Formatear según si es hoy, ayer o una fecha anterior
    if (fecha.toDateString() === hoy.toDateString()) {
      // Es hoy, mostrar solo la hora en formato 24h
      return `Hoy a las ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
    } else if (fecha.toDateString() === ayer.toDateString()) {
      // Es ayer, mostrar solo la hora en formato 24h
      return `Ayer a las ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
    } else {
      // Es otra fecha, mostrar fecha y hora en formato corto
      return `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()} ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
    }
  } catch (e) {
    console.error('Error al formatear fecha:', e);
    return 'Fecha desconocida';
  }
};

// Función para formatear hora en formato 24 horas
const formatearHora = (hora: string): string => {
  if (!hora) return '';
  return hora.substring(0, 5); // Retorna solo HH:mm
};

interface RecentActivitiesProps {
  actividades: ActividadReciente[];
  cargando: boolean;
  descripcion?: string;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ 
  actividades, 
  cargando,
  descripcion = "Registro de actividades enviadas"
}) => {
  const theme = useTheme();

  // Filtrar solo actividades enviadas y limitar a 3
  const actividadesFiltradas = actividades
    .filter(act => act.estado?.toLowerCase() === 'enviado')
    .slice(0, 3);

  return (
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
      <CardHeader
        title={
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
              <VisibilityIcon sx={{ color: '#fff' }} />
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
                Últimas Actividades
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {descripcion}
              </Typography>
            </Box>
          </Box>
        }
      />
      
      <Divider sx={{ mx: 3, opacity: 0.6 }} />
      
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        {cargando ? (
          // Esqueletos de carga
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Cargando actividades...
            </Typography>
          </Box>
        ) : actividadesFiltradas.length === 0 ? (
          <Fade in={true} timeout={800}>
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <NoDataMessage 
                type="table"
                message="No hay actividades enviadas"
                subMessage="Las actividades que envíes aparecerán aquí"
                withAnimation={true}
              />
            </Box>
          </Fade>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2.5}>
              {actividadesFiltradas.map((actividad) => (
                <Grid item xs={12} key={actividad.id}>
                  <Paper 
                    sx={{ 
                      p: 0, 
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'stretch',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      cursor: 'default'
                    }}
                    elevation={0}
                  >
                    {/* Barra lateral de color según estado */}
                    <Box 
                      sx={{ 
                        width: '6px', 
                        background: `linear-gradient(to bottom, ${theme.palette.info.main}, ${theme.palette.info.light})`,
                        flexShrink: 0
                      }} 
                    />
                    
                    {/* Contenido principal */}
                    <Box sx={{ display: 'flex', p: 2, width: '100%', alignItems: 'center' }}>
                      <Avatar 
                        src={actividad.avatar} 
                        alt={actividad.usuario}
                        sx={{ 
                          mr: 2, 
                          width: 45, 
                          height: 45,
                          bgcolor: theme.palette.primary.main,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                        }}
                      >
                        {!actividad.avatar && actividad.usuario.charAt(0)}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                              {actividad.usuario}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontSize: '0.85rem',
                                fontStyle: 'italic'
                              }}
                            >
                              {actividad.accion}
                            </Typography>
                          </Box>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: theme.palette.text.secondary
                            }}
                          >
                            {formatearFecha(actividad.timestamp)}
                          </Box>
                        </Box>
                        
                        {/* Información del proyecto y actividad */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          {actividad.proyecto && (
                            <Chip 
                              label={actividad.proyecto}
                              size="small"
                              sx={{ 
                                height: '24px', 
                                borderRadius: '8px',
                                fontWeight: 500,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                              }}
                            />
                          )}
                          {actividad.actividad && (
                            <Chip 
                              label={actividad.actividad}
                              size="small"
                              sx={{ 
                                height: '24px', 
                                borderRadius: '8px',
                                fontWeight: 500,
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                              }}
                            />
                          )}
                        </Box>
                        
                        {/* Detalles adicionales */}
                        {(actividad.fecha || actividad.hora_inicio) && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 2,
                              alignItems: 'center'
                            }}
                          >
                            {actividad.fecha && (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                fontSize: '0.75rem', 
                                color: theme.palette.text.secondary,
                                bgcolor: alpha(theme.palette.background.default, 0.5),
                                px: 1,
                                py: 0.5,
                                borderRadius: '8px'
                              }}>
                                <CalendarTodayIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                                {new Date(actividad.fecha).toLocaleDateString()}
                              </Box>
                            )}
                            {actividad.hora_inicio && (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                fontSize: '0.75rem', 
                                color: theme.palette.text.secondary,
                                bgcolor: alpha(theme.palette.background.default, 0.5),
                                px: 1,
                                py: 0.5,
                                borderRadius: '8px'
                              }}>
                                <AccessTimeIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                                {formatearHora(actividad.hora_inicio)}
                                {actividad.hora_fin && ` - ${formatearHora(actividad.hora_fin)}`}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
