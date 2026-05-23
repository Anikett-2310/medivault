import { useAuthStore } from "@/store/auth";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export function useAuth() {
  const { login, clear, isAuthenticated, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const { user, isLoading, clearUser, getRolePath } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!isAuthenticated) {
      login();
    }
  };

  const handleLogout = () => {
    clear();
    clearUser();
    queryClient.clear();
    navigate({ to: "/login" });
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    login: handleLogin,
    logout: handleLogout,
    getRolePath,
  };
}
