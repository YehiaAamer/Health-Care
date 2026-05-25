// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import LoadingDots from "@/components/shared/LoadingDots";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "patient" | "doctor" | "admin";
}

function getDefaultRouteByRole(role?: string | null) {
  if (role === "doctor") {
    return "/doctor-dashboard";
  }

  if (role === "patient") {
    return "/dashboard";
  }

  if (role === "admin") {
    return "/dashboard";
  }

  return "/auth?tab=login";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4">
              <LoadingDots size={12} colorClass="bg-primary" />
            </div>

            <p className="text-muted-foreground">
              جاري التحقق من تسجيل الدخول...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth?tab=login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  if (requiredRole === "doctor" && user.doctor_status !== "approved") {
    return <Navigate to="/auth?tab=login" replace />;
  }

  return <>{children}</>;
}