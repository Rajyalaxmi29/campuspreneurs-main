import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  event_type: string | null;
  mode: string | null;
  resource_person: string | null;
  problem_statement_deadline: string | null;
  registration_deadline: string | null;
  max_participants: number | null;
  organizer_name: string | null;
  organizer_contact: string | null;
  is_active: boolean;
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    fetchEvent();
    if (user && id) {
      checkRegistration();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (!error) setEvent(data);
    setLoading(false);
  };

  const checkRegistration = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      setAlreadyRegistered(!!data);
    } catch (err) {
      console.error("Error checking registration:", err);
      setAlreadyRegistered(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-center py-20">Loading event...</p>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <p className="text-center py-20">Event not found</p>
      </Layout>
    );
  }

  const eventDate = new Date(event.event_date);
  const registrationDeadlineDate = event.registration_deadline
    ? new Date(event.registration_deadline)
    : null;
  const isRegistrationOpen =
    event.is_active && (!registrationDeadlineDate || registrationDeadlineDate > new Date());

  const handleRegisterClick = () => {
    navigate(`/events/${id}/register`);
  };

  return (
    <Layout>
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <Card>
          <CardContent className="p-8 space-y-6">

            <div>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              <div className="flex gap-2">
                {event.event_type && (
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                    {event.event_type}
                  </span>
                )}
                {event.mode && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {event.mode}
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground whitespace-pre-line">
              {event.description}
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {eventDate.toLocaleDateString("en-IN")}
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {eventDate.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {event.location}
              </div>
            </div>

            <div className="border-t pt-4 text-sm space-y-1">
              <p><strong>Organizer:</strong> {event.organizer_name || "TBA"}</p>
              <p><strong>Contact:</strong> {event.organizer_contact || "TBA"}</p>
              {event.resource_person && (
                <p><strong>Resource Person:</strong> {event.resource_person}</p>
              )}
              <p>
                <strong>Registration Deadline:</strong>{" "}
                {registrationDeadlineDate
                  ? registrationDeadlineDate.toLocaleDateString("en-IN")
                  : "Not set"}
              </p>
              <p>
                <strong>Max Participants:</strong> {event.max_participants ?? "Unlimited"}
              </p>
            </div>

            {!isAdmin && (
              <>
                {alreadyRegistered ? (
                  <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded text-center font-medium">
                    ✓ Already Registered for this Event
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant="orange"
                    onClick={handleRegisterClick}
                  >
                    Register for Event
                  </Button>
                )}
              </>
            )}

          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
