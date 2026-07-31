export interface Moderator {
  id: string;
  name: string;
  email: string;
  password?: string;
  status: 'Active' | 'Inactive';
  permissions: string[]; // e.g. ['Dashboard', 'Products', 'Orders', 'Reviews', 'Marketing', 'Settings']
  created_at: string;
}

export interface AuditLog {
  id: string;
  moderatorEmail: string;
  moderatorName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  permissions: string[];
  created_at: string;
}

export interface AdminSession {
  role: 'admin' | 'moderator';
  email: string;
  name: string;
  permissions: string[];
}

// Log a moderator action in the database
export function logActivity(action: string, details: string) {
  if (typeof window === 'undefined') return;
  try {
    const sessionStr = localStorage.getItem('bg_admin_session');
    if (!sessionStr) return;
    const session: AdminSession = JSON.parse(sessionStr);
    
    // Only log moderator actions
    if (session.role !== 'moderator') return;

    fetch('/api/team/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moderatorEmail: session.email,
        moderatorName: session.name,
        action,
        details,
      }),
    }).catch((err) => console.error('Error logging activity to database:', err));
  } catch (e) {
    console.error('Error logging activity:', e);
  }
}

// Get all audit logs (deprecated - now queried via API)
export function getAuditLogs(): AuditLog[] {
  return [];
}

// Seed mock data (deprecated - database seeds dynamically via APIs)
export function seedTeamData() {
  // Server-side seeding handles this now.
}

// Get authentication headers containing moderator credentials for request audits
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const sessionStr = localStorage.getItem('bg_admin_session');
    const token = localStorage.getItem('bg_admin_token');
    if (!sessionStr) return {};
    const session: AdminSession = JSON.parse(sessionStr);
    return {
      'Authorization': `Bearer ${token || ''}`,
      'x-moderator-email': session.email || 'admin@beautyglowry.com',
      'x-moderator-name': session.name || 'Super Admin',
    };
  } catch (e) {
    return {};
  }
}
