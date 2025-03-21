// Configuración de la API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
    },
    USUARIOS: {
      BASE: '/usuarios',
      BY_ID: (id: string) => `/usuarios/${id}`,
      SUPERVISADOS: '/usuarios/supervisados',
    },
    ACTIVIDADES: {
      BASE: '/actividades',
      BY_ID: (id: string) => `/actividades/${id}`,
      BY_USUARIO: (usuarioId: string) => `/actividades/usuario/${usuarioId}`,
    },
    PROYECTOS: {
      BASE: '/proyectos',
      BY_ID: (id: string) => `/proyectos/${id}`,
      BY_USUARIO: (usuarioId: string) => `/proyectos/usuario/${usuarioId}`,
      ASIGNAR: (usuarioId: string) => `/proyectos/asignar/${usuarioId}`,
      DESASIGNAR: (usuarioId: string, proyectoId: string) => `/proyectos/desasignar/${usuarioId}/${proyectoId}`,
      ACTIVAR: (id: string) => `/proyectos/${id}/activar`,
      DESACTIVAR: (id: string) => `/proyectos/${id}/desactivar`,
    },
    DOCUMENTOS: {
      BASE: '/documentos',
      BY_ID: (id: string) => `/documentos/${id}`,
    },
    ESTADISTICAS: {
      BASE: '/estadisticas',
      USUARIO: (id: string) => `/estadisticas/usuarios/${id}`,
      PROYECTO: (id: string) => `/estadisticas/proyectos/${id}/estadisticas`,
      ACTIVIDADES_POR_PROYECTO: '/estadisticas/actividades-por-proyecto',
      ACTIVIDADES_POR_USUARIO: '/estadisticas/actividades-por-usuario',
    },
    TIPOS_ACTIVIDAD: {
      BASE: '/tipos-actividad',
      BY_ID: (id: string) => `/tipos-actividad/${id}`,
    },
    INFORMES: {
      BASE: '/informes',
      SUPERVISADO_EXCEL: (id: string) => `/informes/supervisado/${id}/excel`,
    },
    COMENTARIOS: {
      BASE: '/comentarios',
      BY_ID: (id: string) => `/comentarios/${id}`,
    },
    RECURSOS: {
      BASE: '/recursos',
      BY_ID: (id: string) => `/recursos/${id}`,
      BY_PROYECTO: (proyectoId: string) => `/recursos/proyecto/${proyectoId}`,
      ARCHIVAR: (id: string) => `/recursos/${id}/archivar`,
      RESTAURAR: (id: string) => `/recursos/${id}/restaurar`,
      URL_FIRMADA: (id: string) => `/recursos/${id}/url-firmada`,
    },
  },
  TIMEOUT: 30000, // 30 segundos
};
