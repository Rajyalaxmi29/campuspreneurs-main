import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Clock, User, Mail, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface UserQuery {
  id: string;
  query_text: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  status: string;
  resolved_at: string | null;
  created_at: string;
  user_profile?: {
    name: string | null;
    email: string;
  } | null;
}

export function AdminQueryList() {
  const [queries, setQueries] = useState<UserQuery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_queries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching queries:", error);
      toast.error("Failed to load queries");
    } else {
      // Fetch profile information for queries with user_id
      const queriesWithProfiles = await Promise.all(
        (data || []).map(async (query) => {
          if (query.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, email")
              .eq("id", query.user_id)
              .single();

            return {
              ...query,
              user_profile: profile || null,
            };
          }
          return query;
        })
      );

      setQueries(queriesWithProfiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueries();

    // Auto-cleanup resolved queries older than 24 hours
    const cleanupOldQueries = async () => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      await supabase
        .from("user_queries")
        .delete()
        .eq("status", "resolved")
        .lt("resolved_at", twentyFourHoursAgo.toISOString());
    };

    cleanupOldQueries();
  }, []);

  const handleMarkResolved = async (queryId: string) => {
    const { error } = await supabase
      .from("user_queries")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", queryId);

    if (error) {
      console.error("Error updating query:", error);
      toast.error("Failed to mark as resolved");
    } else {
      toast.success("Query marked as resolved");
      fetchQueries();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading queries...</p>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-8 bg-card rounded-xl">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No queries submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-poppins font-semibold text-lg text-foreground flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        User Queries ({queries.length})
      </h3>

      <div className="space-y-3">
        {queries.map((query) => (
          <div
            key={query.id}
            className={`bg-card rounded-xl p-4 shadow-card border-l-4 ${
              query.status === "resolved"
                ? "border-l-green-500 opacity-75"
                : "border-l-primary"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-foreground">{query.query_text}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {query.user_profile?.name || query.user_name || "Anonymous"}
                  </span>
                  {query.user_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {query.user_email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(query.created_at), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {query.status === "resolved" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Resolved
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Pending
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkResolved(query.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Mark Resolved
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground italic">
        * Resolved queries are automatically removed after 24 hours.
      </p>
    </div>
  );
}
