import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAdmin } from "@/hooks/useAdmin";
import { EventFormDialog } from "@/components/admin/EventFormDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  event_type: string;
  mode: string;
  is_active: boolean;
  image_url?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  // Admin state
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await (supabase as any)
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (!error && data) setEvents(data as Event[]);
    setLoading(false);
  };

  const handleSave = async (data: Omit<Event, "id" | "created_at" | "updated_at">) => {
    setSaving(true);
    try {
      if (selectedEvent) {
        // Update existing
        const { error } = await (supabase as any)
          .from("events")
          .update(data)
          .eq("id", selectedEvent.id);
        if (error) throw error;
        toast.success("Event updated");
      } else {
        // Create new
        const { error } = await (supabase as any)
          .from("events")
          .insert([data]);
        if (error) throw error;
        toast.success("Event created");
      }
      setFormOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("events")
        .delete()
        .eq("id", selectedEvent.id);
      if (error) throw error;
      toast.success("Event deleted");
      setDeleteOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setFormOpen(true);
  };

  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event);
    setDeleteOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedEvent(null);
    setFormOpen(true);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <Layout>
        <p className="text-center py-20">Loading events...</p>
      </Layout>
    );
  }

  // Calculate stats
  const totalEvents = events.length;
  const upcomingEvents = events.filter(event =>
    new Date(event.event_date) > new Date()
  ).length;

  return (
    <Layout>
      {/* Header */}
      <section className="bg-primary py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-5xl font-poppins font-bold text-primary-foreground">
            Events
          </h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Stay updated with the latest workshops, seminars, and competitions happening on campus. Join us to learn, network, and innovate together.
          </p>
          <div className="mt-6 flex justify-center gap-8 text-primary-foreground">
            <div className="text-center">
              <span className="text-3xl font-bold">{totalEvents}</span>
              <p className="text-sm">Total Events</p>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold">{upcomingEvents}</span>
              <p className="text-sm">Upcoming</p>
            </div>
          </div>
          {isAdmin && (
            <Button
              onClick={openCreateDialog}
              className="mt-6"
              variant="heroOutline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>
      </section>

      {/* Events List */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="space-y-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition">
              <CardContent className="p-6 flex flex-col md:flex-row gap-6">

                {/* Date Column */}
                <div className="w-full md:w-40 bg-muted rounded-lg p-4 text-center">
                  <p className="text-lg font-bold">
                    {formatDate(event.event_date)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(event.event_date)}
                  </p>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                      {event.event_type}
                    </span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {event.mode}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold">{event.title}</h2>
                  <p className="text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(event)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDeleteDialog(event)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="orange"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    View Details
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      </section>

      {/* Admin Dialogs */}
      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={selectedEvent}
        onSave={handleSave}
        loading={saving}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Event"
        description={`Are you sure you want to delete "${selectedEvent?.title}"? This action cannot be undone.`}
        loading={saving}
      />

    </Layout>
  );
}