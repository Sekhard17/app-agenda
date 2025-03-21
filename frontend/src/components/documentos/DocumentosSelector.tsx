import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  alpha,
  useTheme,
  CircularProgress,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Fade
} from '@mui/material';
import { 
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  TableChart as ExcelIcon,
  Task as WordIcon
} from '@mui/icons-material';
import { Documento } from '../../services/documentos.service';
import DocumentosService from '../../services/documentos.service';

interface DocumentosSelectorProps {
  actividadId?: string;
  documentos: Documento[];
  onDocumentosChange?: (documentos: Documento[]) => void;
  cargando?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  label?: string;
  error?: string;
}

const DocumentosSelector: React.FC<DocumentosSelectorProps> = ({
  actividadId,
  documentos = [],
  onDocumentosChange,
  cargando = false,
  disabled = false,
  maxFiles = 5,
  label = "Documentos adjuntos",
  error
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localCargando, setLocalCargando] = useState<boolean>(true);
  
  // Efecto para simular un pequeño retraso antes de mostrar contenido
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalCargando(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Efecto para actualizar el estado local de carga cuando cambia props
  useEffect(() => {
    if (cargando) {
      setLocalCargando(true);
    }
  }, [cargando]);
  
  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);
  
  // Función para obtener icono según tipo de archivo
  const getFileIcon = (file: Documento) => {
    const fileType = file.tipo_archivo?.toLowerCase() || '';
    
    if (fileType.includes('pdf')) {
      return <PdfIcon color="error" />;
    } else if (fileType.includes('image')) {
      return <ImageIcon color="primary" />;
    } else if (fileType.includes('video')) {
      return <VideoIcon color="secondary" />;
    } else if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('csv')) {
      return <ExcelIcon color="success" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <WordIcon color="info" />;
    } else {
      return <FileIcon color="action" />;
    }
  };
  
  // Función para formatear tamaño de archivo
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamaño desconocido';
    
    if (bytes < 1024) {
      return `${bytes} bytes`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  // Abrir selector de archivos
  const handleSelectFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Manejar cambio de archivos
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!actividadId) {
      setErrorMsg("No se puede subir documentos sin un ID de actividad");
      return;
    }
    
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    if (documentos.length + files.length > maxFiles) {
      setErrorMsg(`No se pueden adjuntar más de ${maxFiles} documentos`);
      return;
    }
    
    setUploading(true);
    setErrorMsg(null);
    
    try {
      // Subir cada archivo y obtener su documento correspondiente
      const nuevosDocumentos: Documento[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nombre_archivo', file.name);
        
        if (file.type) {
          formData.append('tipo_archivo', file.type);
        }
        
        formData.append('tamaño_bytes', file.size.toString());
        
        // Subir el documento
        const resultado = await DocumentosService.subirDocumento(actividadId, formData);
        
        if (resultado) {
          nuevosDocumentos.push(resultado);
        }
      }
      
      // Actualizar la lista de documentos
      if (nuevosDocumentos.length > 0 && onDocumentosChange) {
        onDocumentosChange([...documentos, ...nuevosDocumentos]);
      }
    } catch (error) {
      console.error('Error al subir documentos:', error);
      setErrorMsg('Error al subir documentos. Inténtelo de nuevo.');
    } finally {
      setUploading(false);
      // Limpiar el input para permitir subir el mismo archivo múltiples veces
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Eliminar documento
  const handleDeleteDocument = async (docId: string) => {
    if (disabled) return;
    
    try {
      const success = await DocumentosService.eliminarDocumento(docId);
      
      if (success && onDocumentosChange) {
        const nuevosDocumentos = documentos.filter(doc => doc.id !== docId);
        onDocumentosChange(nuevosDocumentos);
      } else {
        setErrorMsg('Error al eliminar el documento');
      }
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      setErrorMsg('Error al eliminar el documento');
    }
  };
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: error ? theme.palette.error.main : theme.palette.text.primary,
        fontWeight: 600,
      }}>
        <AttachFileIcon fontSize="small" />
        {label}
        {maxFiles > 0 && <Typography variant="caption" color="text.secondary">
          (máx. {maxFiles})
        </Typography>}
      </Typography>
      
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          {error}
        </Typography>
      )}
      
      {errorMsg && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          {errorMsg}
        </Typography>
      )}
      
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: '12px',
          border: `1px solid ${error ? theme.palette.error.main : alpha(theme.palette.divider, 0.2)}`,
          backgroundColor: error ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.background.paper, 0.6),
          minHeight: 150,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: localCargando || cargando ? 'center' : 'flex-start'
        }}
      >
        {/* Spinner de carga principal */}
        {(localCargando || cargando) ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            p: 4,
            minHeight: 150
          }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando documentos...
            </Typography>
          </Box>
        ) : (
          <Fade in={!localCargando && !cargando} timeout={800}>
            <Box sx={{ width: '100%' }}>
              {/* Lista de documentos */}
              {documentos.length > 0 && (
                <List sx={{ mb: 2, p: 0 }}>
                  {documentos.map((doc, index) => (
                    <React.Fragment key={doc.id || `temp-${index}`}>
                      <ListItem
                        sx={{
                          borderRadius: '8px',
                          mb: 1,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getFileIcon(doc)}
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.nombre_archivo}
                          secondary={formatFileSize(doc.tamaño_bytes)}
                          primaryTypographyProps={{
                            variant: 'body2',
                            sx: {
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                          }}
                        />
                        {!disabled && (
                          <ListItemSecondaryAction>
                            <Tooltip title="Eliminar">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleDeleteDocument(doc.id)}
                                sx={{
                                  color: theme.palette.error.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                      {index < documentos.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
              
              {/* Botón de subir documentos */}
              {!disabled && documentos.length < maxFiles && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  mt: documentos.length > 0 ? 2 : 0 
                }}>
                  <Button
                    variant="outlined"
                    startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                    onClick={handleSelectFiles}
                    disabled={uploading || disabled}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      px: 3,
                      py: 1,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    {uploading ? 'Subiendo...' : documentos.length > 0 ? 'Añadir más documentos' : 'Adjuntar documentos'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.zip,.rar"
                  />
                </Box>
              )}
              
              {/* Mensaje de estado vacío */}
              {!uploading && documentos.length === 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 3,
                  textAlign: 'center',
                  minHeight: 120
                }}>
                  <DescriptionIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: alpha(theme.palette.text.secondary, 0.3),
                      mb: 1
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    {disabled 
                      ? 'No hay documentos adjuntos a esta actividad' 
                      : 'Adjunta documentos relevantes para esta actividad'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Paper>
    </Box>
  );
};

export default DocumentosSelector; 