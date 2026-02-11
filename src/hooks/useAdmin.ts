import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      // Check for superadmin role first
      const { data: superAdminData, error: superAdminError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .maybeSingle();

      if (superAdminError) {
        console.error("Error checking superadmin role:", superAdminError);
      }

      if (superAdminData) {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        setLoading(false);
        return;
      }

      // If not superadmin, check for admin role
      const { data: adminData, error: adminError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (adminError) {
        console.error("Error checking admin role:", adminError);
      }

      setIsAdmin(!!adminData);
      setIsSuperAdmin(false);
      setLoading(false);
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, isSuperAdmin, loading };
}
