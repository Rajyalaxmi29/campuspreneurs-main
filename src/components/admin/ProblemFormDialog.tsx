import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Department {
  id: string;
  name: string;
}


interface ProblemStatement {
  id: string;
  problem_statement_id: string;
  title: string;
  description: string;
  detailed_description: string;
  category: string;
  theme: string;
}

interface ProblemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problem: ProblemStatement | null;
  onSave: (data: Omit<ProblemStatement, "id" | "created_at">) => Promise<void>;
  loading: boolean;
}

export function ProblemFormDialog({
  open,
  onOpenChange,
  problem,
  onSave,
  loading,
}: ProblemFormDialogProps) {
  const [formData, setFormData] = useState({
    problem_statement_id: "",
    title: "",
    description: "",
    detailed_description: "",
    category: "",
    theme: "",
    department: "",
  });
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from("departments").select("id, name");
      if (error) {
        console.error("Error fetching departments:", error);
      } else {
        setDepartments(data);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    if (problem) {
      setFormData({
        problem_statement_id: problem.problem_statement_id,
        title: problem.title,
        description: problem.description,
        detailed_description: problem.detailed_description || "",
        category: problem.category,
        theme: problem.theme,
        department: problem.department || "",
      });
    } else {
      setFormData({
        problem_statement_id: "",
        title: "",
        description: "",
        detailed_description: "",
        category: "",
        theme: "",
        department: "",
      });
    }
  }, [problem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If creating a new problem (not editing), ensure there's at least
    // one event accepting problem statements (deadline in future).
    if (!problem) {
      try {
        const now = new Date().toISOString();
        const { data: events, error } = await supabase
          .from("events")
          .select("id")
          .gt("problem_statement_deadline", now)
          .limit(1);

        if (error) {
          console.error("Error checking event deadlines:", error);
          toast.error("Unable to verify problem statement deadline. Try again later.");
          return;
        }

        if (!events || events.length === 0) {
          toast.error("Problem statements are closed — no active deadline available.");
          return;
        }
      } catch (err) {
        console.error("Unexpected error checking deadlines:", err);
        toast.error("Unable to verify problem statement deadline. Try again later.");
        return;
      }
    }

    await onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {problem ? "Edit Problem Statement" : "Add Problem Statement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="problem_statement_id">Problem ID</Label>
            <Input
              id="problem_statement_id"
              value={formData.problem_statement_id}
              onChange={(e) => setFormData({ ...formData, problem_statement_id: e.target.value })}
              placeholder="e.g., 25001"
              required
            />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Problem statement title"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the problem..."
              rows={4}
              required
            />
          </div>
          <div>
            <Label htmlFor="detailed_description">Detailed Description</Label>
            <Textarea
              id="detailed_description"
              value={formData.detailed_description}
              onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
              placeholder="Additional detailed description..."
              rows={6}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Hardware/Software">Hardware/Software</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) => setFormData({ ...formData, theme: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Non-Academic">Non-Academic</SelectItem>
                <SelectItem value="Community Innovation">Community Innovation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : problem ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}