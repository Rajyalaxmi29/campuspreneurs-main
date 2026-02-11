import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
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

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onSave: (data: Omit<Event, "id" | "created_at" | "updated_at">) => Promise<void>;
  loading: boolean;
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  onSave,
  loading,
}: EventFormDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    event_type: "",
    mode: "",
    is_active: true,
    image_url: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [minDate, setMinDate] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Convert to local timezone and format as YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    const now = new Date();
    let minDateValue = "";

    if (event) {
      // For editing existing events
      const eventDate = new Date(event.event_date);
      if (eventDate < now) {
        // If event is in the past, prevent making it earlier
        minDateValue = formatDateForInput(event.event_date);
      } else {
        // If event is in the future, prevent making it past
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        minDateValue = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setFormData({
        title: event.title,
        description: event.description,
        event_date: formatDateForInput(event.event_date),
        location: event.location,
        event_type: event.event_type,
        mode: event.mode,
        is_active: event.is_active,
        image_url: event.image_url || "",
      });
    } else {
      // For adding new events, set min date to now
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      minDateValue = `${year}-${month}-${day}T${hours}:${minutes}`;

      setFormData({
        title: "",
        description: "",
        event_date: "",
        location: "",
        event_type: "",
        mode: "",
        is_active: true,
        image_url: "",
      });
    }

    setMinDate(minDateValue);
    setImageFile(null);
  }, [event, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate event date
    if (formData.event_date < minDate) {
      toast.error("Event date and time cannot be in the past. Please select a future date and time.");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `event_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("event_images")
          .upload(fileName, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("event_images")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      await onSave({ ...formData, image_url: imageUrl });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Edit Event" : "Add Event"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the event..."
              rows={4}
              required
            />
          </div>
          <div>
            <Label htmlFor="event_date">Event Date & Time</Label>
            <Input
              id="event_date"
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              min={minDate}
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Event location"
              required
            />
          </div>
          <div>
            <Label htmlFor="event_type">Event Type</Label>
            <Input
              id="event_type"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              placeholder="e.g., Workshop, Seminar, Competition"
              required
            />
          </div>
          <div>
            <Label htmlFor="mode">Mode</Label>
            <Select
              value={formData.mode}
              onValueChange={(value) => setFormData({ ...formData, mode: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="image">Event Image</Label>
            <div className="space-y-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose Image
                </Button>
                {imageFile && (
                  <span className="text-sm text-muted-foreground">
                    {imageFile.name}
                  </span>
                )}
              </div>
              {formData.image_url && (
                <div className="relative inline-block">
                  <img
                    src={formData.image_url}
                    alt="Event preview"
                    className="w-32 h-20 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
            />
            <Label htmlFor="is_active">Active Event</Label>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {uploading ? "Uploading..." : loading ? "Saving..." : event ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
