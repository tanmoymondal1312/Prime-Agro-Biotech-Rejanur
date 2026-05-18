const TOKEN_KEY = 'reza_portal_token';

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginWithCredentials(phone: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      saveToken(data.token);
      return { success: true };
    }
    return { success: false, error: data.error || 'লগইন ব্যর্থ হয়েছে' };
  } catch {
    return { success: false, error: 'সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে' };
  }
}
