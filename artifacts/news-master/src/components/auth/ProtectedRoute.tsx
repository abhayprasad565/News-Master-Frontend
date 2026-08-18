import { ReactNode } from "react";
import { useGetMe, UserSessionRole } from "@workspace/api-client-react";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: UserSessionRole;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { data, isLoading, error } = useGetMe();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <Redirect
        to={location.startsWith("/admin") ? "/admin/login" : "/login"}
      />
    );
  }

  const actualRole = (data.user as any).role as string;
  const hasRequiredRole =
    !requireRole ||
    data.user.role === requireRole ||
    (requireRole === "admin" && actualRole === "owner");
  if (!hasRequiredRole) {
    return <Redirect to={actualRole === "reader" ? "/stories" : "/admin"} />;
  }

  return <>{children}</>;
}
