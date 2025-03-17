import React, { ReactNode } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  IconButton,
  Typography,
  LinearProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  icon,
  action,
  loading = false,
  refreshing = false,
  onRefresh,
  children
}) => {
  const theme = useTheme();

  return (
    <Card sx={{ 
      borderRadius: '16px', 
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)}, ${alpha(theme.palette.background.paper, 0.8)})`,
    }} elevation={0}>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon && <Box sx={{ mr: 1.5, color: theme.palette.primary.main }}>{icon}</Box>}
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {title}
            </Typography>
          </Box>
        }
        subheader={
          subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: icon ? 4 : 0 }}>
              {subtitle}
            </Typography>
          )
        }
        action={
          action || (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onRefresh && (
                <Tooltip title="Refrescar">
                  <IconButton size="small" onClick={onRefresh} disabled={refreshing || loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }
        sx={{ px: 3, pt: 3, pb: 2 }}
      />
      {refreshing && <LinearProgress />}
      <Divider />
      <CardContent sx={{ p: 2 }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default DashboardCard; 