import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * ProtectedRoute component that redirects unauthenticated users
 * Use this to wrap components that require authentication
 */
export function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    // Save the attempted location for redirecting after sign-in
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * PublicRoute component that redirects authenticated users
 * Use this for sign-in/sign-up pages
 */
export function PublicRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Redirect to dashboard/home if already authenticated
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}
