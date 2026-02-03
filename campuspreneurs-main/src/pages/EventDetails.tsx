import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

interface Event {
  id: string;
  title: string;
  full_description: string;
  event_date: string;
  location: string;
  event_type: string;
  mode: string;
  registration_deadline: string;
  max_participants: number;
  organizer_name: string;
  organizer_contact: string;
  is_registration_open: boolean;
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (!error) setEvent(data);
    setLoading(false);
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

  return (
    <Layout>
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <Card>
          <CardContent className="p-8 space-y-6">

            <div>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              <div className="flex gap-2">
                <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                  {event.event_type}
                </span>
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {event.mode}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground whitespace-pre-line">
              {event.full_description}
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
              <p><strong>Organizer:</strong> {event.organizer_name}</p>
              <p><strong>Contact:</strong> {event.organizer_contact}</p>
              <p>
                <strong>Registration Deadline:</strong>{" "}
                {new Date(event.registration_deadline).toLocaleDateString("en-IN")}
              </p>
              <p>
                <strong>Max Participants:</strong> {event.max_participants}
              </p>
            </div>

            <Button
              className="w-full"
              disabled={!event.is_registration_open}
              variant="orange"
              onClick={() => navigate(`/events/${id}/register`)}
            >
              {event.is_registration_open
                ? "Register for Event"
                : "Registration Closed"}
            </Button>

          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
