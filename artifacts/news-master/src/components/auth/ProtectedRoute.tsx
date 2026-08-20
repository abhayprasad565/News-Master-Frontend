import { ReactNode } from "react";
import { useGetMe, UserSessionRole } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { canAccessAdmin, destinationForRole, type WebRole } from "@/lib/role-policy";

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: UserSessionRole;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { data, isLoading, error } = useGetMe();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.user) {
    return <Redirect to="/login" />;
  }

  const actualRole = (data.user as any).role as WebRole;
  const hasRequiredRole =
    !requireRole ||
    (requireRole === "admin"
      ? canAccessAdmin(actualRole)
      : data.user.role === requireRole);
  if (!hasRequiredRole) {
    return <Redirect to={destinationForRole(actualRole)} />;
  }

  return <>{children}</>;
}
