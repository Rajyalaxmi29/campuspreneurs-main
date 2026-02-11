import React, { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProblemFormDialog } from "@/components/admin/ProblemFormDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Edit, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";

interface ProblemRow {
  id: string;
  problem_statement_id: string;
  title: string;
  description: string;
  category?: string;
  department?: string;
  theme?: string;
  status?: string;
}

const ENGINEERING_DEPTS = [
  "CSE",
  "AIML",
  "DS",
  "CS",
  "ECE",
  "EEE",
  "ME",
  "CE",
  "IT",
];

export default function DeptAdmin() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<ProblemRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { isAdmin } = useAdmin();

  const fetchDepartments = async () => {
    setLoading(true);
    const [{ data: fromProblems }, { data: fromRegs }] = await Promise.all([
      supabase.from("problem_statements").select("department"),
      supabase.from("team_registrations").select("department"),
    ]);

    const setDeps = new Set<string>();
    (fromProblems || []).forEach((r: any) => { if (r.department) setDeps.add(r.department); });
    (fromRegs || []).forEach((r: any) => { if (r.department) setDeps.add(r.department); });

    // Ensure engineering departments appear (even if absent in DB)
    ENGINEERING_DEPTS.forEach((d) => setDeps.add(d));

    setDepartments(Array.from(setDeps).sort());
    setLoading(false);
  };

  const fetchProblemsForDept = async (dept: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("problem_statements")
      .select("*")
      .eq("department", dept)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load problems");
      setProblems([]);
    } else {
      setProblems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDepartments(); }, []);

  useEffect(() => {
    if (selectedDept) fetchProblemsForDept(selectedDept);
  }, [selectedDept]);

  const openEdit = (p: ProblemRow) => { setSelectedProblem(p); setFormOpen(true); };

  const handleSave = async (data: Omit<ProblemRow, "id" | "created_at">) => {
    try {
      if (selectedProblem) {
        const { error } = await supabase.from("problem_statements").update(data).eq("id", selectedProblem.id);
        if (error) throw error;
        toast.success("Updated");
      }
      setFormOpen(false);
      setSelectedProblem(null);
      if (selectedDept) fetchProblemsForDept(selectedDept);
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("problem_statements").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Marked ${status}`);
      if (selectedDept) fetchProblemsForDept(selectedDept);
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Department Submissions</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {departments.map((d) => (
            <button key={d} onClick={() => setSelectedDept(d)} className={`p-4 rounded border ${selectedDept===d?"border-secondary":"border-border"}`}>
              {d}
            </button>
          ))}
        </div>

        {!selectedDept ? (
          <p>Select a department to view submissions.</p>
        ) : (
          <div className="space-y-4">
            {loading && <p>Loading...</p>}
            {!loading && problems.length === 0 && <p>No submissions for {selectedDept}.</p>}
            {problems.map((p) => (
              <div key={p.id} className="bg-card p-4 rounded border border-border flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{p.problem_statement_id}</div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isAdmin && (
                    <>
                      <Button variant="outline" size="icon" onClick={() => openEdit(p)} title="Edit"><Edit className="w-4 h-4"/></Button>
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => handleStatus(p.id, 'accepted')}><Check className="w-4 h-4 mr-2"/>Accept</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleStatus(p.id, 'rejected')}><X className="w-4 h-4 mr-2"/>Reject</Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <ProblemFormDialog open={formOpen} onOpenChange={setFormOpen} problem={selectedProblem} onSave={handleSave} loading={loading} />
        <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => {}} title="Delete" description="" />
      </div>
    </Layout>
  );
}
