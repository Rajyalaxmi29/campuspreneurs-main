import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  section_key: string;
}

interface ResourceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
  onSuccess: () => void;
}

export function ResourceUploadDialog({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: ResourceUploadDialogProps) {
  const [title, setTitle] = useState(resource?.title || "");
  const [description, setDescription] = useState(resource?.description || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;

    setUploading(true);

    try {
      let fileUrl = resource.file_url;
      let fileType = resource.file_type;

      // Upload new file if selected
      if (file) {
        // Sanitize filename for storage key (remove/replace invalid characters)
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageKey = `${resource.section_key}_${Date.now()}_${sanitizedFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("resources")
          .upload(storageKey, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("resources")
          .getPublicUrl(storageKey);

        fileUrl = urlData.publicUrl;
        fileType = file.name; // Store original filename in database
      }

      // Update resource record
      const { error: updateError } = await supabase
        .from("resources")
        .update({
          title,
          description,
          file_url: fileUrl,
          file_type: fileType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resource.id);

      if (updateError) throw updateError;

      toast.success("Resource updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating resource:", error);
      toast.error(error.message || "Failed to update resource");
    } finally {
      setUploading(false);
    }
  };

  // Reset form when dialog opens with new resource
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && resource) {
      setTitle(resource.title);
      setDescription(resource.description || "");
      setFile(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>File</Label>
            <div className="mt-2">
              {resource?.file_url && !file && (
                <p className="text-sm text-muted-foreground mb-2">
                  Current: {resource.file_type} file
                </p>
              )}
              {file && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded">
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.pptx,.ppt,.doc,.docx,.xls,.xlsx"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {file ? "Change File" : "Upload New File"}
              </Button>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
