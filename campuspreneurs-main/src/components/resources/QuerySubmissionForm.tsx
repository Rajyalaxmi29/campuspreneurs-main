import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Send, HelpCircle } from "lucide-react";

export function QuerySubmissionForm() {
  const { user } = useAuth();
  const [queryText, setQueryText] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!queryText.trim()) {
      toast.error("Please enter your query");
      return;
    }

    if (!user && !email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("user_queries").insert({
      query_text: queryText.trim(),
      user_id: user?.id || null,
      user_email: user?.email || email.trim() || null,
      user_name: name.trim() || null,
      status: "pending",
    });

    if (error) {
      console.error("Error submitting query:", error);
      toast.error("Failed to submit query. Please try again.");
    } else {
      toast.success("Your query has been submitted successfully!");
      setQueryText("");
      setEmail("");
      setName("");
    }

    setSubmitting(false);
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-poppins font-semibold text-lg text-foreground">
            Any Additional Queries?
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Have questions about the event? Submit your query and we'll get back to you.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!user && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name (Optional)</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Your Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!user}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="query">Your Query *</Label>
          <Textarea
            id="query"
            placeholder="Type your question or concern here..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            rows={4}
            className="resize-none"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          <Send className="w-4 h-4 mr-2" />
          {submitting ? "Submitting..." : "Submit Query"}
        </Button>
      </form>
    </div>
  );
}
