const ADMIN_SESSION_KEY = 'ohada_admin_session';

export function getAdminPassword(): string {
  return (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || 'admin1234';
}

export function isAdminAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function loginAdmin(password: string): boolean {
  const correctPassword = getAdminPassword();
  if (password.trim() === correctPassword.trim()) {
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } catch {
      // Ignore sessionStorage errors
    }
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Ignore sessionStorage errors
  }
}

export function isAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hash === '#admin' ||
    window.location.hash.startsWith('#admin') ||
    new URLSearchParams(window.location.search).has('admin')
  );
}

export function navigateToAdmin(): void {
  if (typeof window === 'undefined') return;
  window.location.hash = 'admin';
}

export function navigateToUser(): void {
  if (typeof window === 'undefined') return;
  window.location.hash = '';
}
