import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
}

export default function EventRegister() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Wait for auth to load before checking authentication
    if (authLoading) return;

    // Check authentication first
    if (!user) {
      toast.error("Authentication Required — Please log in to register for this event.");
      navigate("/auth");
      return;
    }

    if (!eventId) return;

    fetchEvent();
    checkRegistration();
  }, [user, authLoading, eventId, navigate]);


  const fetchEvent = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, description, event_date, location")
      .eq("id", eventId)
      .single();

    setEvent(data);
    setLoading(false);
  };

  const checkRegistration = async () => {
    console.log("Checking registration for eventId:", eventId, "userId:", user?.id);
    try {
      // First, let's check if the table exists and get all records for this user
      const { data: allUserRegistrations, error: fetchError } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("user_id", user?.id);

      console.log("All user registrations:", allUserRegistrations, "error:", fetchError);

      // Then check specifically for this event
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user?.id)
        .maybeSingle();

      console.log("Specific event registration check - data:", data, "error:", error);

      if (error) {
        console.error("Error checking registration:", error);
        setAlreadyRegistered(false);
      } else {
        setAlreadyRegistered(!!data);
        console.log("Already registered set to:", !!data);
      }
    } catch (err) {
      console.error("Unexpected error in checkRegistration:", err);
      setAlreadyRegistered(false);
    }
  };

  const handleRegister = async () => {
    setSubmitting(true);

    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      user_id: user?.id,
    });

    if (!error) {
      navigate(`/events/${eventId}`);
    }

    setSubmitting(false);
  };

  if (loading || !event) {
    return (
      <Layout>
        <p className="text-center py-20">Loading...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container mx-auto px-4 py-16 max-w-xl">
        <Card>
          <CardContent className="p-6 space-y-6">

            <h1 className="text-2xl font-bold">{event.title}</h1>

            <p className="text-muted-foreground">
              {event.description}
            </p>

            <div className="text-sm text-muted-foreground">
              <p><strong>Date:</strong> {new Date(event.event_date).toLocaleDateString("en-IN")}</p>
              <p><strong>Location:</strong> {event.location}</p>
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <p><strong>Name:</strong> {user?.user_metadata?.full_name || "Student"}</p>
              <p><strong>Email:</strong> {user?.email}</p>
            </div>

            <Button
              className="w-full"
              variant="orange"
              disabled={alreadyRegistered || submitting}
              onClick={handleRegister}
            >
              {alreadyRegistered
                ? "Already Registered"
                : submitting
                ? "Registering..."
                : "Confirm Registration"}
            </Button>

          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
