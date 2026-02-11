import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamRegistration {
  id: string;
  team_name: string;
  problem_id: string;
  member1_name: string;
  member1_roll: string;
  member2_name?: string;
  member2_roll?: string;
  member3_name?: string;
  member3_roll?: string;
  member4_name?: string;
  member4_roll?: string;
  year: string;
  department: string;
  phone: string;
  email: string;
  document_url?: string;
  created_at: string;
  problem_title?: string;
  theme?: string;
}

interface ProblemStatement {
  problem_statement_id: string;
  title: string;
}

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamRegistration | null;
  problems: ProblemStatement[];
  onSave: (data: Omit<TeamRegistration, "id" | "created_at" | "problem_title" | "theme">) => Promise<void>;
  loading: boolean;
}

export function TeamFormDialog({
  open,
  onOpenChange,
  team,
  problems,
  onSave,
  loading,
}: TeamFormDialogProps) {
  const [formData, setFormData] = useState({
    team_name: "",
    problem_id: "",
    member1_name: "",
    member1_roll: "",
    member2_name: "",
    member2_roll: "",
    member3_name: "",
    member3_roll: "",
    member4_name: "",
    member4_roll: "",
    year: "",
    department: "",
    phone: "",
    email: "",
    document_url: "",
  });

  useEffect(() => {
    if (team) {
      setFormData({
        team_name: team.team_name,
        problem_id: team.problem_id,
        member1_name: team.member1_name,
        member1_roll: team.member1_roll,
        member2_name: team.member2_name || "",
        member2_roll: team.member2_roll || "",
        member3_name: team.member3_name || "",
        member3_roll: team.member3_roll || "",
        member4_name: team.member4_name || "",
        member4_roll: team.member4_roll || "",
        year: team.year,
        department: team.department,
        phone: team.phone,
        email: team.email,
        document_url: team.document_url || "",
      });
    } else {
      setFormData({
        team_name: "",
        problem_id: "",
        member1_name: "",
        member1_roll: "",
        member2_name: "",
        member2_roll: "",
        member3_name: "",
        member3_roll: "",
        member4_name: "",
        member4_roll: "",
        year: "",
        department: "",
        phone: "",
        email: "",
        document_url: "",
      });
    }
  }, [team, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {team ? "Edit Team Registration" : "Add Team Registration"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="team_name">Team Name</Label>
              <Input
                id="team_name"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="problem_id">Problem Statement</Label>
              <Select
                value={formData.problem_id}
                onValueChange={(value) => setFormData({ ...formData, problem_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select problem" />
                </SelectTrigger>
                <SelectContent>
                  {problems.map((problem) => (
                    <SelectItem key={problem.problem_statement_id} value={problem.problem_statement_id}>
                      {problem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="member1_name">Member 1 Name</Label>
              <Input
                id="member1_name"
                value={formData.member1_name}
                onChange={(e) => setFormData({ ...formData, member1_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="member1_roll">Member 1 Roll</Label>
              <Input
                id="member1_roll"
                value={formData.member1_roll}
                onChange={(e) => setFormData({ ...formData, member1_roll: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="member2_name">Member 2 Name</Label>
              <Input
                id="member2_name"
                value={formData.member2_name}
                onChange={(e) => setFormData({ ...formData, member2_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="member2_roll">Member 2 Roll</Label>
              <Input
                id="member2_roll"
                value={formData.member2_roll}
                onChange={(e) => setFormData({ ...formData, member2_roll: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="member3_name">Member 3 Name</Label>
              <Input
                id="member3_name"
                value={formData.member3_name}
                onChange={(e) => setFormData({ ...formData, member3_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="member3_roll">Member 3 Roll</Label>
              <Input
                id="member3_roll"
                value={formData.member3_roll}
                onChange={(e) => setFormData({ ...formData, member3_roll: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="member4_name">Member 4 Name</Label>
              <Input
                id="member4_name"
                value={formData.member4_name}
                onChange={(e) => setFormData({ ...formData, member4_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="member4_roll">Member 4 Roll</Label>
              <Input
                id="member4_roll"
                value={formData.member4_roll}
                onChange={(e) => setFormData({ ...formData, member4_roll: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Select
                value={formData.year}
                onValueChange={(value) => setFormData({ ...formData, year: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
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
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Business Administration">Business Administration</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="document_url">Document URL</Label>
            <Input
              id="document_url"
              value={formData.document_url}
              onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : team ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
