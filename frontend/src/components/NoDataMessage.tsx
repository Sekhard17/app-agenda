import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import TableChartIcon from '@mui/icons-material/TableChart';

interface NoDataMessageProps {
  message?: string;
  subMessage?: string;
  icon?: SvgIconComponent;
  type?: 'chart' | 'table' | 'card' | 'generic';
  height?: number | string;
  width?: number | string;
  withAnimation?: boolean;
}

const NoDataMessage: React.FC<NoDataMessageProps> = ({
  message = 'No hay datos disponibles',
  subMessage = 'Intenta cambiar los filtros o vuelve más tarde',
  icon: CustomIcon,
  type = 'generic',
  height = '100%',
  width = '100%',
  withAnimation = true
}) => {
  const theme = useTheme();

  // Seleccionar el icono basado en el tipo
  let Icon = CustomIcon || AssessmentOutlinedIcon;
  if (!CustomIcon) {
    switch (type) {
      case 'chart':
        Icon = InsightsIcon;
        break;
      case 'table':
        Icon = TableChartIcon;
        break;
      case 'card':
        Icon = AssessmentOutlinedIcon;
        break;
      default:
        Icon = AssessmentOutlinedIcon;
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        height,
        width,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3,
        backgroundColor: 'transparent',
        borderRadius: 2
      }}
    >
      <Box
        className={withAnimation ? 'pulse-animation' : ''}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          opacity: 0.7,
          transition: 'all 0.3s ease',
          '&:hover': {
            opacity: 1,
            transform: 'scale(1.05)'
          },
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)'
            },
            '50%': {
              transform: 'scale(1.05)'
            },
            '100%': {
              transform: 'scale(1)'
            }
          },
          '&.pulse-animation': {
            animation: 'pulse 2s infinite ease-in-out'
          }
        }}
      >
        <Icon
          sx={{
            fontSize: 60,
            color: theme.palette.text.secondary,
            mb: 1
          }}
        />
        <Typography variant="h6" color="textSecondary" align="center">
          {message}
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ maxWidth: 300 }}>
          {subMessage}
        </Typography>
      </Box>
    </Paper>
  );
};

export default NoDataMessage;
