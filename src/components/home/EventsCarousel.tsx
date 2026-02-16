import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "./EventCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  event_type: string | null;
  mode: string | null;
  organizer_name: string | null;
  organizer_contact: string | null;
  resource_person: string | null;
  problem_statement_deadline: string | null;
  registration_deadline: string | null;
  max_participants: number | null;
  is_active: boolean;
  image_url?: string | null;
}

export function EventsCarousel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showModal, setShowModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: "smooth",
      });
    }
  };

  const prevSlide = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: "smooth",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming events at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-poppins font-bold text-foreground mb-2">
              Events List
            </h2>
            <p className="text-muted-foreground">
              Explore all upcoming events and workshops
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative group">
            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
              style={{
                scrollBehavior: "smooth",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={(event) => {
                    setSelectedEvent(event);
                    setShowModal(true);
                  }}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background shadow-md hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background shadow-md hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextSlide}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Event Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>

              {/* Event Image */}
              {selectedEvent.image_url && (
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(selectedEvent.event_date)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{formatTime(selectedEvent.event_date)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedEvent.location}</p>
                  </div>

                  {selectedEvent.mode && (
                    <div>
                      <p className="text-sm text-muted-foreground">Mode</p>
                      <Badge variant="secondary">{selectedEvent.mode}</Badge>
                    </div>
                  )}

                  {selectedEvent.event_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Event Type</p>
                      <p className="font-medium">{selectedEvent.event_type}</p>
                    </div>
                  )}

                  {selectedEvent.organizer_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Organizer</p>
                      <p className="font-medium">{selectedEvent.organizer_name}</p>
                    </div>
                  )}

                  {selectedEvent.resource_person && (
                    <div>
                      <p className="text-sm text-muted-foreground">Resource Person</p>
                      <p className="font-medium">{selectedEvent.resource_person}</p>
                    </div>
                  )}

                  {selectedEvent.max_participants && (
                    <div>
                      <p className="text-sm text-muted-foreground">Max Participants</p>
                      <p className="font-medium">{selectedEvent.max_participants}</p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                {selectedEvent.organizer_contact && (
                  <div>
                    <h3 className="font-semibold mb-2">Contact</h3>
                    <p className="text-muted-foreground">{selectedEvent.organizer_contact}</p>
                  </div>
                )}

                {/* Registration Deadline */}
                {selectedEvent.registration_deadline && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Registration Deadline</p>
                    <p className="font-semibold">
                      {formatDate(selectedEvent.registration_deadline)} at{" "}
                      {formatTime(selectedEvent.registration_deadline)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

