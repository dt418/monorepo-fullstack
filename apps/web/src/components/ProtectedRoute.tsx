import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks';

interface ProtectedRouteProps {
  adminOnly?: boolean;
  children?: React.ReactNode;
}

export function ProtectedRoute({ adminOnly = false, children }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
