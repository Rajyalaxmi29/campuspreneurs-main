import React, { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Edit, Check, X, ArrowRight, Trash2 } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { ProblemFormDialog } from "@/components/admin/ProblemFormDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ProblemRow {
  id: string;
  problem_statement_id: string;
  title: string;
  description: string;
  detailed_description?: string;
  category?: string;
  department?: string;
  theme?: string;
  status?: string;
  created_at?: string;
  approved_at?: string;
}

export default function DepartmentsPage() {
  const [grouped, setGrouped] = useState<Record<string, Record<string, Record<string, ProblemRow[]>>>>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [primaryThemeForDept, setPrimaryThemeForDept] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdmin();

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ProblemRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProblem, setDetailsProblem] = useState<ProblemRow | null>(null);

  const fetch = async () => {
    setLoading(true);
    const [{ data: problemsData, error: problemsError }, { data: regsData, error: regsError }] = await Promise.all([
      supabase.from("problem_statements").select("*").eq("status", "pending_review").order("created_at", { ascending: false }),
      supabase.from("team_registrations").select("department"),
    ]);

    if (problemsError) {
      toast.error("Failed to load problem statements");
      setLoading(false);
      return;
    }

    const deptSet = new Set<string>();
    (problemsData || []).forEach((p: any) => { if (p.department) deptSet.add((p.department || '').toString().trim()); });
    (regsData || []).forEach((r: any) => { if (r.department) deptSet.add((r.department || '').toString().trim()); });
    const deps = Array.from(deptSet).sort();
    setDepartments(deps);

    const map: any = {};
    // Build map[theme][dept][category] and a dept->theme counts map
    const deptThemeCounts: Record<string, Record<string, number>> = {};
    (problemsData || []).forEach((p: any) => {
      const theme = (p.theme || "Other").toString();
      const dept = (p.department || "Uncategorized").toString();
      const cat = (p.category || "Uncategorized").toString();
      map[theme] = map[theme] || {};
      map[theme][dept] = map[theme][dept] || {};
      map[theme][dept][cat] = map[theme][dept][cat] || [];
      map[theme][dept][cat].push(p);

      deptThemeCounts[dept] = deptThemeCounts[dept] || {};
      deptThemeCounts[dept][theme] = (deptThemeCounts[dept][theme] || 0) + 1;
    });

    // Decide a primary theme for each department based on actual DB counts
    const primaryThemeForDept: Record<string, string> = {};
    deps.forEach((d) => {
      const counts = deptThemeCounts[d] || {};
      // If this department has any problems under "Academic", prefer that
      if ((counts["Academic"] || 0) > 0) {
        primaryThemeForDept[d] = "Academic";
        return;
      }
      // Otherwise pick the theme with the most problems for this dept
      const themeEntries = Object.entries(counts);
      if (themeEntries.length === 0) {
        primaryThemeForDept[d] = "Other";
        return;
      }
      let bestTheme = themeEntries[0][0];
      let bestCount = themeEntries[0][1] as number;
      themeEntries.forEach(([t, c]) => {
        if ((c as number) > bestCount) {
          bestCount = c as number;
          bestTheme = t;
        }
      });
      primaryThemeForDept[d] = bestTheme;
    });
    setPrimaryThemeForDept(primaryThemeForDept);

    setGrouped(map);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openEdit = (p: ProblemRow) => { setSelected(p); setFormOpen(true); };

  const handleSave = async (data: Omit<ProblemRow, "id" | "created_at">) => {
    try {
      if (selected) {
        const { error } = await supabase.from("problem_statements").update(data).eq("id", selected.id);
        if (error) throw error;
        toast.success("Problem updated");
      }
      setFormOpen(false);
      setSelected(null);
      fetch();
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      const updateData: { status: string; approved_at?: string | null } = { status };
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'revision_needed') {
        updateData.approved_at = null;
      }
      const { error } = await supabase.from("problem_statements").update(updateData).eq("id", id);
      if (error) throw error;
      toast.success("Status updated");
      fetch();
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  const openModal = (problem: ProblemRow) => {
    setDetailsProblem(problem);
    setDetailsOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      const { error } = await supabase.from("problem_statements").delete().eq("id", selected.id);
      if (error) throw error;
      toast.success("Deleted");
      setDeleteOpen(false);
      setSelected(null);
      fetch();
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Departments</h1>
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="space-y-6">
            {(() => {
              const allThemeKeys = Object.keys(grouped || {});
              // Order themes: Academic first if present, then alphabetically
              const themeKeys = [] as string[];
              if (allThemeKeys.includes("Academic")) themeKeys.push("Academic");
              allThemeKeys.filter(t => t !== "Academic").sort().forEach(t => themeKeys.push(t));

              return themeKeys.map((theme) => {
                const deptsMap = grouped[theme] || {};
                // Build department set for this theme based on primary mapping and actual data
                const deptSetForTheme = new Set<string>();
                // include departments that belong to this theme in grouped data only if their primary theme matches
                Object.keys(deptsMap).forEach((d) => {
                  if (!primaryThemeForDept[d] || primaryThemeForDept[d] === theme) deptSetForTheme.add(d);
                });
                // include departments discovered from registrations/problems if their primary theme matches
                departments.forEach((d) => {
                  if (primaryThemeForDept[d] === theme) deptSetForTheme.add(d);
                });
                const deptKeys = Array.from(deptSetForTheme).sort();
                return (
                  <section key={theme} className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">{theme}</h2>
                      <span className="text-sm text-muted-foreground">{Object.values(deptsMap || {}).reduce((s: number, dm: any) => s + Object.values(dm).reduce((t: number, arr: any) => t + (arr?.length||0), 0), 0)} problems</span>
                    </div>

                    <div className="space-y-4">
                      {deptKeys.map((dept) => (
                        <div key={dept} className="bg-card rounded border border-border p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{dept}</h3>
                          </div>
                          <div className="grid gap-3">
                            {Object.keys(deptsMap?.[dept] || {}).map((cat) => (
                              <div key={cat} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">{cat}</div>
                                  <div className="text-sm text-muted-foreground">{(deptsMap?.[dept]?.[cat] || []).length} problems</div>
                                </div>
                                {(deptsMap?.[dept]?.[cat] || []).map((p: ProblemRow) => (
                                  <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                                    <div>
                                      <div className="text-sm text-muted-foreground">{p.problem_statement_id}</div>
                                      <h4 className="font-semibold">{p.title}</h4>
                                      <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      {isAdmin && (
                                        <>
                                          <div className="flex gap-2">
                                            <Button variant="outline" size="icon" onClick={() => openEdit(p)} title="Edit"><Edit className="w-4 h-4"/></Button>
                                            <Button variant="outline" size="icon" onClick={() => { setSelected(p); setDeleteOpen(true); }} title="Delete"><Trash2 className="w-4 h-4"/></Button>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button size="sm" variant="success" onClick={() => handleStatus(p.id, 'approved')}><Check className="w-4 h-4 mr-1"/>Accept</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleStatus(p.id, 'revision_needed')}><X className="w-4 h-4 mr-1"/>Reject</Button>
                                          </div>
                                        </>
                                      )}
                                      <Button size="sm" variant="orange" onClick={() => openModal(p)}>
                                        View Details<ArrowRight className="w-4 h-4 ml-1"/>
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              });
            })()}
          </div>
        )}

        <ProblemFormDialog open={formOpen} onOpenChange={setFormOpen} problem={selected} onSave={handleSave} loading={loading} />
        <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={confirmDelete} title="Delete Problem" description={`Delete "${selected?.title}"?`} />
        
        {/* Problem Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {detailsProblem && (
              <>
                {/* Header */}
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    Problem Statement Details
                  </DialogTitle>
                </DialogHeader>

                {/* Table */}
                <div className="mt-6 border border-border rounded-xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <tbody>
                      {/* ID */}
                      <tr className="border-b">
                        <td className="w-1/3 bg-muted px-4 py-3 font-medium">
                          Problem Statement ID
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {detailsProblem.problem_statement_id}
                        </td>
                      </tr>

                      {/* Title */}
                      <tr className="border-b">
                        <td className="bg-muted px-4 py-3 font-medium">
                          Problem Statement Title
                        </td>
                        <td className="px-4 py-3">
                          {detailsProblem.title}
                        </td>
                      </tr>

                      {/* Description */}
                      <tr className="border-b align-top">
                        <td className="bg-muted px-4 py-3 font-medium">
                          Description
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-pre-line">
                          {detailsProblem.description}
                        </td>
                      </tr>

                      {/* Detailed Description */}
                      {detailsProblem.detailed_description && (
                        <tr className="border-b align-top">
                          <td className="bg-muted px-4 py-3 font-medium">
                            Detailed Description
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-pre-line">
                            {detailsProblem.detailed_description}
                          </td>
                        </tr>
                      )}

                      {/* Category */}
                      <tr className="border-b">
                        <td className="bg-muted px-4 py-3 font-medium">
                          Category
                        </td>
                        <td className="px-4 py-3">
                          {detailsProblem.category}
                        </td>
                      </tr>

                      {/* Theme */}
                      <tr className="border-b">
                        <td className="bg-muted px-4 py-3 font-medium">
                          Theme
                        </td>
                        <td className="px-4 py-3">
                          {detailsProblem.theme}
                        </td>
                      </tr>

                      {/* Department */}
                      <tr className="border-b">
                        <td className="bg-muted px-4 py-3 font-medium">
                          Department
                        </td>
                        <td className="px-4 py-3">
                          {detailsProblem.department || "Not specified"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}