import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error capturado:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            bgcolor: 'rgba(244, 67, 54, 0.08)',
            border: '1px solid rgba(244, 67, 54, 0.2)',
            my: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon color="error" />
            <Typography color="error" variant="body1" fontWeight={500}>
              Se ha producido un error al cargar este componente
            </Typography>
          </Box>
          {this.state.error && (
            <Typography color="error" variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
              {this.state.error.message}
            </Typography>
          )}
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 