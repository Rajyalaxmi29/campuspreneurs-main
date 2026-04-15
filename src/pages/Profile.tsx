import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading } = useAuth();
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [deptAdminSearch, setDeptAdminSearch] = useState("");
  const [deptAdminResults, setDeptAdminResults] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    role: "student" | "deptadmin";
  }[]>([]);
  const [deptAdminSearchLoading, setDeptAdminSearchLoading] = useState(false);
  const [deptAdminActionLoading, setDeptAdminActionLoading] = useState<string | null>(null);
  const [deptAdminError, setDeptAdminError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const initialUsername =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "";
    setUsernameValue(initialUsername);
  }, [user]);

  const searchDepartmentAdminUsers = async () => {
    const searchTerm = deptAdminSearch.trim();
    setDeptAdminError(null);
    setDeptAdminResults([]);

    if (!searchTerm) {
      setDeptAdminError("Please enter a user name or email to search.");
      return;
    }

    setDeptAdminSearchLoading(true);
    try {
      const ilikeSearch = `%${searchTerm}%`;
      const emailSearch = searchTerm.includes("@") ? searchTerm.trim().toLowerCase() : null;
      let profileQuery = supabase
        .from("profiles")
        .select("id,name,email")
        .order("created_at", { ascending: false })
        .limit(50);

      if (emailSearch) {
        profileQuery = profileQuery.or(
          `email.eq.${emailSearch},name.ilike.${ilikeSearch},email.ilike.${ilikeSearch}`
        );
      } else {
        profileQuery = profileQuery.or(`name.ilike.${ilikeSearch},email.ilike.${ilikeSearch}`);
      }

      const { data: profiles, error: profileError } = await profileQuery;

      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) {
        setDeptAdminError("No user profiles found with that name or email.");
        return;
      }

      const userIds = profiles.map((profile) => profile.id);
      const { data: userRoles, error: userRolesError } = await supabase
        .from("user_roles")
        .select("user_id,role")
        .in("user_id", userIds);

      if (userRolesError) throw userRolesError;

      const roleByUser = userRoles?.reduce((acc, userRole) => {
        acc[userRole.user_id] = userRole.role as "student" | "deptadmin";
        return acc;
      }, {} as Record<string, "student" | "deptadmin">) || {};

      setDeptAdminResults(
        profiles.map((profile) => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: roleByUser[profile.id] || "student",
        }))
      );
    } catch (error: any) {
      console.error("Department admin search failed:", error);
      setDeptAdminError(error?.message || "Unable to search users. Check your permissions.");
    } finally {
      setDeptAdminSearchLoading(false);
    }
  };

  const toggleDepartmentAdminRole = async (profile: {
    id: string;
    name: string | null;
    email: string | null;
    role: "student" | "deptadmin";
  }) => {
    setDeptAdminActionLoading(profile.id);
    setDeptAdminError(null);

    try {
      if (profile.role === "deptadmin") {
        const { data: updateData, error: updateError } = await supabase
          .from("user_roles")
          .update({ role: "student" })
          .eq("user_id", profile.id);

        if (updateError) throw updateError;

        if (!updateData || updateData.length === 0) {
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: profile.id, role: "student" });

          if (insertError) throw insertError;
        }

        setDeptAdminResults((current) =>
          current.map((result) =>
            result.id === profile.id ? { ...result, role: "student" } : result
          )
        );
      } else {
        const { data: updateData, error: updateError } = await supabase
          .from("user_roles")
          .update({ role: "deptadmin" })
          .eq("user_id", profile.id);

        if (updateError) throw updateError;

        if (!updateData || updateData.length === 0) {
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: profile.id, role: "deptadmin" });

          if (insertError) throw insertError;
        }

        setDeptAdminResults((current) =>
          current.map((result) =>
            result.id === profile.id ? { ...result, role: "deptadmin" } : result
          )
        );
      }
    } catch (error: any) {
      console.error("Department admin role update failed:", error);
      setDeptAdminError(error?.message || "Unable to update department admin permission.");
    } finally {
      setDeptAdminActionLoading(null);
    }
  };

  const handleUsernameSave = async () => {
    if (!usernameValue.trim()) {
      toast.error("Username cannot be empty.");
      return;
    }
    setUsernameSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: usernameValue.trim(),
          full_name: usernameValue.trim(),
        },
      });
      if (error) throw error;
      toast.success("Username updated successfully.");
    } catch (error: any) {
      console.error("Failed to update username:", error);
      toast.error(error?.message || "Unable to update username.");
    } finally {
      setUsernameSaving(false);
    }
  };

  const verifyCurrentPassword = async () => {
    if (!currentPassword) {
      toast.error("Enter your current password to verify.");
      return;
    }

    if (!user?.email) {
      toast.error("Unable to verify password without an email address.");
      return;
    }

    setVerifyingPassword(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (error) throw error;
      setPasswordVerified(true);
      toast.success("Current password verified.");
    } catch (error: any) {
      console.error("Password verification failed:", error);
      setPasswordVerified(false);
      toast.error(error?.message || "Current password is incorrect.");
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordVerified) {
      toast.error("Verify your current password first.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordVerified(false);
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast.error(error?.message || "Unable to change password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">Loading profile...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg font-semibold">You need to be logged in to view your profile.</p>
          <Button asChild variant="orange" className="mt-6">
            <Link to="/auth">Go to Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const username =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "User";

  const displayedUsername = usernameValue || username;
  const metadata = user.user_metadata || {};

  return (
    <Layout>
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {displayedUsername.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{displayedUsername}</h1>
              <p className="text-sm text-muted-foreground">Account profile details</p>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="text-lg font-semibold">{username}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>

              {user.created_at && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="text-lg font-semibold">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              )}

            </CardContent>
          </Card>

          {isAdmin && !adminLoading && (
            <Card>
              <CardContent className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Manage Department Admins</h2>
                  <p className="text-sm text-muted-foreground">
                    Search existing user profiles by name or email and assign or revoke department admin access.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dept-admin-search">Search profiles</Label>
                    <Input
                      id="dept-admin-search"
                      value={deptAdminSearch}
                      onChange={(e) => setDeptAdminSearch(e.target.value)}
                      placeholder="Search by name or email"
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      variant="orange"
                      onClick={searchDepartmentAdminUsers}
                      disabled={deptAdminSearchLoading || !deptAdminSearch.trim()}
                    >
                      {deptAdminSearchLoading ? "Searching..." : "Search Profiles"}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Only users with an existing profile may be assigned department admin access.
                    </p>
                  </div>

                  {deptAdminError && (
                    <p className="text-sm text-destructive">{deptAdminError}</p>
                  )}

                  {deptAdminResults.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-3 px-4 text-sm font-medium text-foreground">Name</th>
                            <th className="py-3 px-4 text-sm font-medium text-foreground">Email</th>
                            <th className="py-3 px-4 text-sm font-medium text-foreground">Status</th>
                            <th className="py-3 px-4 text-sm font-medium text-foreground">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deptAdminResults.map((result) => (
                            <tr key={result.id} className="border-b border-border/50">
                              <td className="py-3 px-4 text-foreground">{result.name || "—"}</td>
                              <td className="py-3 px-4 text-foreground">{result.email || "—"}</td>
                              <td className="py-3 px-4 text-foreground text-sm">
                                {result.role === "deptadmin" ? "Department admin" : "Student"}
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  variant={result.role === "deptadmin" ? "outline" : "orange"}
                                  size="sm"
                                  onClick={() => toggleDepartmentAdminRole(result)}
                                  disabled={deptAdminActionLoading === result.id}
                                >
                                  {deptAdminActionLoading === result.id
                                    ? result.role === "deptadmin"
                                      ? "Revoking..."
                                      : "Assigning..."
                                    : result.role === "deptadmin"
                                    ? "Revoke"
                                    : "Make deptadmin"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Edit username</h2>
                <p className="text-sm text-muted-foreground">Update the name shown on your profile.</p>
              </div>

              <div className="space-y-4">
                <Input
                  value={usernameValue}
                  onChange={(e) => setUsernameValue(e.target.value)}
                  placeholder="Enter username"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Current username: <span className="font-medium text-foreground">{username}</span>
                  </div>
                  <Button
                    variant="orange"
                    size="sm"
                    onClick={handleUsernameSave}
                    disabled={usernameSaving || !usernameValue.trim()}
                  >
                    {usernameSaving ? "Saving..." : "Save username"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Change password</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your current password first. Only verified users can change their password.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Current password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={verifyCurrentPassword}
                  disabled={verifyingPassword || !currentPassword}
                >
                  {verifyingPassword ? "Verifying..." : passwordVerified ? "Verified" : "Verify current password"}
                </Button>
              </div>

              {passwordVerified && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    variant="orange"
                    size="sm"
                    onClick={handlePasswordChange}
                    disabled={updatingPassword || !newPassword || !confirmPassword}
                  >
                    {updatingPassword ? "Updating..." : "Change password"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
