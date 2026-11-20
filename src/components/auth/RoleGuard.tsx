import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { userProfile } = useAuth();

  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default RoleGuard;
