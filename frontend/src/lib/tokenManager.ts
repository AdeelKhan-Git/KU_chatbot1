import { ROUTES } from "./routes";
export type UserRole = "student" | "admin";

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
}

export interface AuthData {
  token: {
    access: string;
    refresh: string;
  };
  user: User;
  new_user: boolean;
}
class TokenManager {
  private readonly TOKEN_KEY = "token";
  private readonly USER_KEY = "user";
  private readonly AUTH_STATUS_KEY = "isAuthenticated";
  private readonly EXPIRES_AT_KEY = "expiresAt";

  public isAuthenticated(): boolean {
    const token = this.getToken();
    const expiresAt = this.getExpiresAt();

    if (!token || !expiresAt) return false;

    if (Date.now() > expiresAt) {
      this.clearAuth();
      return false;
    }
    return true;
  }
  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  public getExpiresAt(): number | null {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    return expiresAt ? parseInt(expiresAt, 10) : null;
  }

  public setAuth(token: string, user: User, expiresInHours: number = 24): void {
    const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.AUTH_STATUS_KEY, "true");
    localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
  }

  public updateUser(user: Partial<User>): void {
    const currentUser = this.getUser();
    if (currentUser) {
      const updatedUser: User = { ...currentUser, ...user };
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    }
  }

  public clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.AUTH_STATUS_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  public refreshToken(newToken: string, expiresInHours: number = 24): void {
    const user = this.getUser();
    if (user) {
      this.setAuth(newToken, user, expiresInHours);
    }
  }

  public getUserEmail(): string | null {
    return this.getUser()?.email || null;
  }

  public hasRole(role: UserRole): boolean {
    return this.getUser()?.role === role;
  }

  public isAdmin(): boolean {
    return this.hasRole("admin");
  }

  public isStudent(): boolean {
    return this.hasRole("student");
  }
  public getAuthData(): AuthData | null {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) return null;

    return {
      token: { access: token, refresh: token },
      user,
      new_user: false,
    };
  }
  public setAuthData(authData: AuthData): void {
    this.setAuth(authData.token.access, authData.user, 24);
  }

  public isTokenExpiringSoon(minutes: number = 30): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;

    const expirationThreshold = Date.now() + minutes * 60 * 1000;
    return expiresAt <= expirationThreshold;
  }

  public getTokenValidityTime(): number {
    const expiresAt = this.getExpiresAt();
    return expiresAt ? Math.max(0, expiresAt - Date.now()) : 0;
  }

  public getTokenValidityHours(): number {
    return this.getTokenValidityTime() / (60 * 60 * 1000);
  }

  public logout(redirect: string = ROUTES.HOME): void {
    this.clearAuth();
    window.location.href = redirect;
  }

  public initializeAuth(): boolean {
    return this.isAuthenticated();
  }
}

const tokenManager = new TokenManager();
export default tokenManager;

export const {
  isAuthenticated,
  getToken,
  getUser,
  getExpiresAt,
  setAuth,
  updateUser,
  clearAuth,
  refreshToken,
  getUserEmail,
  hasRole,
  isAdmin,
  isStudent,
  getAuthData,
  setAuthData,
  isTokenExpiringSoon,
  getTokenValidityTime,
  getTokenValidityHours,
  logout,
  initializeAuth,
} = tokenManager;
