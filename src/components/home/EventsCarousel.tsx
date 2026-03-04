import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string;
}

export function EventsCarousel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Show only a short preview in cards; full text appears in dialog.
  const getPreviewDescription = (text: string, wordLimit = 4, charLimit = 36) => {
    if (!text) return "";
    const cleaned = text.trim().replace(/\s+/g, " ");
    const words = cleaned.split(" ");

    if (words.length > wordLimit) {
      return `${words.slice(0, wordLimit).join(" ")}...`;
    }

    if (cleaned.length > charLimit) {
      return `${cleaned.slice(0, charLimit).trimEnd()}...`;
    }

    return cleaned;
  };

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);

  const openDetails = (evt: Event) => {
    setDetailsEvent(evt);
    setDetailsOpen(true);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        // only show active events; if you're testing with stale data you may
        // need to mark records as active or remove this filter temporarily.
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      console.log("supabase returned events", data);
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // number of cards visible at once, responsive
  const [cardsPerView, setCardsPerView] = useState(3);

  const updateCardsPerView = () => {
    const w = window.innerWidth;
    if (w < 768) setCardsPerView(1);
    else if (w < 1024) setCardsPerView(2);
    else setCardsPerView(3);
  };

  useEffect(() => {
    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  const maxIndex = Math.max(0, events.length - cardsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      // stop at end rather than wrap
      return next > maxIndex ? maxIndex : next;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const next = prev - 1;
      return next < 0 ? 0 : next;
    });
  };

  // auto-scroll effect (needs nextSlide and cardsPerView in scope)
  useEffect(() => {
    if (events.length > cardsPerView && currentIndex < maxIndex) {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000); // Auto-slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [events.length, cardsPerView, currentIndex, maxIndex]);

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
    // show a more informative message in development
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No upcoming events at the moment. (fetched {events.length})
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Check console for fetched data and/or ensure the `is_active` flag on
              your events is true.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
<div className="text-center mb-6">
            <h2 className="text-3xl font-poppins font-bold text-foreground mb-2">
              Upcoming Events
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest Incamp events, workshops, and important dates.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Showing {currentIndex + 1}–{Math.min(currentIndex + cardsPerView, events.length)} of {events.length}
            </p>
          </div>

        {/* carousel viewport */}
        <div className="relative max-w-5xl mx-auto overflow-hidden">
          <div
            className="flex transition-transform duration-500"
            style={{ transform: `translateX(-${(currentIndex * 100) / cardsPerView}%)` }}
          >
            {events.map((evt) => (
              <Card
                key={evt.id}
                className="flex-shrink-0 m-2 shadow-lg"
                style={{ flex: `0 0 ${100 / cardsPerView}%` }}
              >
                <div className="relative">
                  <img
                    src={evt.image_url || "/og-image.png"}
                    alt={evt.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-1">{evt.title}</h3>
                  <p className="text-sm text-muted-foreground break-words">
                    {getPreviewDescription(evt.description)}
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(evt.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(evt.event_date)}</span>
                    </div>
                  </div>
                  <Button
                    variant="orange"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => openDetails(evt)}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* arrows */}
          {events.length > cardsPerView && (
            <>
              {currentIndex > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}

              {currentIndex < maxIndex && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={nextSlide}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Event details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {detailsEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {detailsEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <img
                  src={detailsEvent.image_url || "/og-image.png"}
                  alt={detailsEvent.title}
                  className="w-full h-60 object-cover rounded-lg"
                />
                <p className="text-muted-foreground">
                  {detailsEvent.description}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(detailsEvent.event_date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(detailsEvent.event_date)}
                  </div>
                  {detailsEvent.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {detailsEvent.location}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

