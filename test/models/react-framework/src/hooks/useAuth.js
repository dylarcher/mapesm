// useAuth hook - Simplified interface to AuthContext
import { useMutation, useQuery } from 'react-query';
import { useAuthContext } from '../context/AuthContext.js';
import { AuthService } from '../services/AuthService.js';

export const useAuth = () => {
  const authContext = useAuthContext();

  return authContext;
};

// Enhanced auth hook with React Query integration
export const useAuthWithQuery = () => {
  const { user, token, isAuthenticated, login, logout, updateUser } = useAuth();

  // User profile query
  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery(
    ['userProfile', user?.id],
    () => AuthService.getUserProfile(user.id),
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        if (error.status === 401) {
          logout();
        }
      }
    }
  );

  // Login mutation
  const loginMutation = useMutation(
    ({ email, password }) => login(email, password),
    {
      onSuccess: (data) => {
        if (data.success) {
          // Invalidate and refetch user-related queries
          queryClient.invalidateQueries('userProfile');
        }
      }
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (userData) => updateUser(userData),
    {
      onSuccess: (data) => {
        if (data.success) {
          // Invalidate profile query to refresh data
          queryClient.invalidateQueries('userProfile');
        }
      }
    }
  );

  // Password change mutation
  const changePasswordMutation = useMutation(
    ({ currentPassword, newPassword }) =>
      AuthService.changePassword(currentPassword, newPassword),
    {
      onError: (error) => {
        if (error.status === 401) {
          logout();
        }
      }
    }
  );

  return {
    // Auth state
    user: userProfile || user,
    token,
    isAuthenticated,

    // Loading states
    loading: loginMutation.isLoading || profileLoading,

    // Actions
    login: loginMutation.mutate,
    logout,
    updateProfile: updateProfileMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    refetchProfile,

    // Mutation states
    loginError: loginMutation.error?.message,
    updateError: updateProfileMutation.error?.message,
    passwordError: changePasswordMutation.error?.message,

    // Success states
    loginSuccess: loginMutation.isSuccess,
    updateSuccess: updateProfileMutation.isSuccess,
    passwordSuccess: changePasswordMutation.isSuccess
  };
};
