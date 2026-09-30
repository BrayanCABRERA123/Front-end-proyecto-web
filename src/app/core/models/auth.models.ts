// contratos del security-service (/api/v1/auth y /api/v1/users/me)

export type UserRole = 'ADMIN' | 'OPERATOR' | 'CLIENT';

export interface AuthUser {
  id: number;
  email: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: UserRole[];
  active: boolean;
  lastLogin: string | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: string;
  user: AuthUser;
}

export interface RegisterRequest {
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  password: string;
}

// lo que el usuario puede cambiar de su propio perfil (PATCH /users/me)
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string | null;
}

// cuenta que crea el administrador con roles explícitos (POST /admin/users)
export interface CreateUserAccountRequest {
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  password: string;
  roles: UserRole[];
}

// una página de resultados del backend (listados paginados)
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// lo que se guarda en el navegador mientras la sesión está abierta
export interface StoredSession {
  accessToken: string;
  expiresAt: string;
  user: AuthUser;
}

// cuerpo de error RFC 9457 que devuelve el backend
export interface ApiProblem {
  status: number;
  title?: string;
  detail?: string;
  code?: string;
  errors?: Record<string, string>;
  violations?: string[];
}
