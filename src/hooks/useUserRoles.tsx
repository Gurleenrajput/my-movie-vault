import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "user";
  created_at: string;
}

export interface PendingUser {
  id: string;
  email: string;
  created_at: string;
}

// Check if current user is admin
export function useIsAdmin() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user,
  });
}

// Check if current user is approved (has any role)
export function useIsApproved() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["isApproved", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking approval status:", error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user,
  });
}

// Get all user roles (admin only)
export function useUserRoles() {
  return useQuery({
    queryKey: ["userRoles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as UserRole[];
    },
  });
}

// Approve a user (give them 'user' role)
export function useApproveUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
      toast.success("User approved successfully");
    },
    onError: (error) => {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user");
    },
  });
}

// Remove a user's role
export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
      toast.success("User role removed");
    },
    onError: (error) => {
      console.error("Error removing user role:", error);
      toast.error("Failed to remove user role");
    },
  });
}
