import ApiService from './api.service';
import { Usuario } from './auth.service';

export interface UsuarioActualizar {
  nombres?: string;
  appaterno?: string;
  apmaterno?: string;
  email?: string;
  password?: string;
  cargo?: string;
  avatar?: string;
  empresa?: string;
  centro_costo?: string;
}

// Interfaces para la información laboral
export interface InformacionEmpresa {
  codigo: string;
  nombre: string;
}

export interface InformacionCentroCosto {
  codigo: string;
  nombre: string;
}

export interface InformacionLaboral {
  empresa: InformacionEmpresa;
  centroCosto: InformacionCentroCosto;
  cargo: string;
  supervisor: string;
  fechaInicio: string;
  fechaTermino: string | null;
  estado: string;
}

export interface UsuarioDetalle extends Usuario {
  cargo: string;
  supervisados?: Usuario[];
  avatar?: string;
  rut: string;
  empresa?: string;
  centro_costo?: string;
  informacionLaboral?: InformacionLaboral;
}

class UsuariosService {
  // Obtener un usuario por su ID
  static async getUsuario(id: string): Promise<Usuario> {
    return ApiService.get<{ usuario: Usuario }>(`/usuarios/${id}`).then((data) => data.usuario);
  }
  
  // Obtener detalles completos de un usuario
  static async getUsuarioDetalle(id: string): Promise<UsuarioDetalle> {
    return ApiService.get<UsuarioDetalle>(`/usuarios/${id}/detalle`);
  }
  
  // Actualizar un usuario
  static async actualizarUsuario(id: string, datos: UsuarioActualizar): Promise<Usuario> {
    return ApiService.put<{ usuario: Usuario, message: string }>(`/usuarios/${id}`, datos)
      .then((data) => data.usuario);
  }
  
  // Cambiar avatar de usuario
  static async cambiarAvatar(id: string, archivo: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', archivo);
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    return ApiService.post<{ url: string }>(`/usuarios/${id}/avatar`, formData, config)
      .then((data) => data.url);
  }
  
  // Obtener supervisados (solo para supervisores)
  static async getSupervisados(): Promise<Usuario[]> {
    return ApiService.get<{ supervisados: Usuario[] }>('/usuarios/supervisados')
      .then((data) => data.supervisados);
  }
}

export default UsuariosService; 