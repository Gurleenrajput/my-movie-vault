import { useState, useEffect } from "react";
import { Loader2, Users, Shield, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useApproveUser, useRemoveUserRole } from "@/hooks/useUserRoles";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: "admin" | "user" | null;
  role_id: string | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Record<string, "admin" | "user">>({});
  
  const approveUser = useApproveUser();
  const removeUserRole = useRemoveUserRole();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const { data, error } = await supabase.functions.invoke("list-users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    const role = selectedRole[userId] || "user";
    await approveUser.mutateAsync({ userId, role });
    fetchUsers();
  };

  const handleRemoveRole = async (roleId: string) => {
    await removeUserRole.mutateAsync(roleId);
    fetchUsers();
  };

  const pendingUsers = users.filter((u) => !u.role);
  const approvedUsers = users.filter((u) => u.role);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Users */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <UserX className="w-4 h-4" />
            Pending Approval ({pendingUsers.length})
          </h3>
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No pending users</p>
          ) : (
            <div className="space-y-2">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Select
                    value={selectedRole[user.id] || "user"}
                    onValueChange={(value: "admin" | "user") =>
                      setSelectedRole((prev) => ({ ...prev, [user.id]: value }))
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(user.id)}
                    disabled={approveUser.isPending}
                  >
                    {approveUser.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Users */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Approved Users ({approvedUsers.length})
          </h3>
          {approvedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No approved users yet</p>
          ) : (
            <div className="space-y-2">
              {approvedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove User Role</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove the role for {user.email}?
                          They will no longer be able to add movies.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => user.role_id && handleRemoveRole(user.role_id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
