import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string;
  event_type: string | null;
  mode: string | null;
  organizer_name: string | null;
  image_url?: string | null;
}

interface EventCardProps {
  event: Event;
  onViewDetails: (event: Event) => void;
}

export function EventCard({ event, onViewDetails }: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full min-w-[280px]">
      {/* Image */}
      <div className="relative overflow-hidden bg-muted h-40">
        <img
          src={event.image_url || "/og-image.png"}
          alt={event.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {event.event_type && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
            {event.event_type}
          </Badge>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-base line-clamp-2 mb-3 text-foreground">
          {event.title}
        </h3>

        <div className="space-y-2 text-sm text-muted-foreground flex-1">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {formatDate(event.event_date)}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{formatTime(event.event_date)}</span>
          </div>

          {/* Mode/Location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {event.mode || event.location}
            </span>
          </div>

          {/* Organizer */}
          {event.organizer_name && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{event.organizer_name}</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => onViewDetails(event)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
