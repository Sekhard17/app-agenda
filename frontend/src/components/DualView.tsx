import React, { useEffect } from 'react';
import { 
  Box, 
  ToggleButton, 
  ToggleButtonGroup, 
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';

export type ViewType = 'table' | 'cards';

interface DualViewProps {
  viewType: ViewType;
  onViewChange: (view: ViewType) => void;
  storageKey: string;
}

const DualView: React.FC<DualViewProps> = ({ 
  viewType, 
  onViewChange,
  storageKey 
}) => {
  const theme = useTheme();

  // Cargar preferencia al montar
  useEffect(() => {
    const savedView = localStorage.getItem(storageKey) as ViewType;
    if (savedView) {
      onViewChange(savedView);
    }
  }, [storageKey, onViewChange]);

  // Manejar cambio de vista
  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: ViewType | null) => {
    if (newView !== null) {
      localStorage.setItem(storageKey, newView);
      onViewChange(newView);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <ToggleButtonGroup
        value={viewType}
        exclusive
        onChange={handleViewChange}
        aria-label="vista"
        size="small"
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          '& .MuiToggleButton-root': {
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&.Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              }
            }
          }
        }}
      >
        <ToggleButton value="table" aria-label="vista tabla">
          <Tooltip title="Vista de Tabla">
            <ViewListIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="cards" aria-label="vista tarjetas">
          <Tooltip title="Vista de Tarjetas">
            <ViewModuleIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default DualView; 