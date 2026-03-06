import React, { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  const [selectedTheme, setSelectedTheme] = useState<string>("All");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const { isAdmin } = useAdmin();

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ProblemRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProblem, setDetailsProblem] = useState<ProblemRow | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [rejectingProblem, setRejectingProblem] = useState<ProblemRow | null>(null);

  const fetch = async () => {
    setLoading(true);
    const [{ data: problemsData, error: problemsError }, { data: regsData }] = await Promise.all([
      supabase.from("problem_statements").select("*").eq("status", "pending_review").order("created_at", { ascending: false }),
      supabase.from("team_registrations").select("department"),
    ]);

    if (problemsError) {
      toast.error("Failed to load problem statements");
      setLoading(false);
      return;
    }

    const deptSet = new Set<string>();
    (problemsData || []).forEach((p: any) => {
      if (p.department) deptSet.add((p.department || "").toString().trim());
    });
    (regsData || []).forEach((r: any) => {
      if (r.department) deptSet.add((r.department || "").toString().trim());
    });

    const deps = Array.from(deptSet).sort();
    setDepartments(deps);

    const map: Record<string, Record<string, Record<string, ProblemRow[]>>> = {};
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

    const nextPrimaryThemeForDept: Record<string, string> = {};
    deps.forEach((d) => {
      const counts = deptThemeCounts[d] || {};
      if ((counts["Academic"] || 0) > 0) {
        nextPrimaryThemeForDept[d] = "Academic";
        return;
      }

      const themeEntries = Object.entries(counts);
      if (themeEntries.length === 0) {
        nextPrimaryThemeForDept[d] = "Other";
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

      nextPrimaryThemeForDept[d] = bestTheme;
    });

    setPrimaryThemeForDept(nextPrimaryThemeForDept);
    setGrouped(map);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const openEdit = (p: ProblemRow) => {
    setSelected(p);
    setFormOpen(true);
  };

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
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  const openRejectDialog = (p: ProblemRow) => {
    setRejectingProblem(p);
    setRemarkText("");
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingProblem) return;
    if (!remarkText.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error("User not authenticated");
      const userId = userData.user.id;

      const { error: remarkError } = await (supabase as any)
        .from("problem_statement_remarks")
        .upsert(
          {
            problem_statement_id: rejectingProblem.id,
            remark: remarkText,
            author_id: userId,
          },
          { onConflict: "problem_statement_id" }
        );

      if (remarkError) throw remarkError;

      const { error: statusError } = await supabase
        .from("problem_statements")
        .update({ status: "revision_needed", approved_at: null })
        .eq("id", rejectingProblem.id);

      if (statusError) throw statusError;

      toast.success("Problem rejected with remark");
      setRejectOpen(false);
      setRejectingProblem(null);
      fetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject problem");
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      const updateData: { status: string; approved_at?: string | null } = { status };
      if (status === "approved") {
        updateData.approved_at = new Date().toISOString();
      } else if (status === "revision_needed") {
        updateData.approved_at = null;
      }

      const { error } = await supabase.from("problem_statements").update(updateData).eq("id", id);
      if (error) throw error;
      toast.success("Status updated");
      fetch();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
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
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  return (
    <Layout>
      <section className="bg-primary py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-5xl font-poppins font-bold text-primary-foreground">Departments</h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Explore departments and their challenges. Browse through different themes and categories to find problems
            that align with your interests.
          </p>
          <div className="mt-6 flex justify-center gap-8 text-primary-foreground">
            <div className="text-center">
              <span className="text-3xl font-bold">{departments.length}</span>
              <p className="text-sm">Total Departments</p>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold">{Object.keys(grouped || {}).length}</span>
              <p className="text-sm">Themes</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-4">
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Themes</option>
              {Object.keys(grouped || {})
                .sort()
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : Object.keys(grouped || {}).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No problem statements to verify</p>
        ) : (
          <div className="space-y-6">
            {(() => {
              const allThemeKeys = Object.keys(grouped || {});
              const themeKeys: string[] = [];
              if (allThemeKeys.includes("Academic")) themeKeys.push("Academic");
              allThemeKeys
                .filter((t) => t !== "Academic")
                .sort()
                .forEach((t) => themeKeys.push(t));

              return themeKeys.map((theme) => {
                if (selectedTheme !== "All" && theme !== selectedTheme) return null;

                const deptsMap = grouped[theme] || {};
                const deptSetForTheme = new Set<string>();

                Object.keys(deptsMap).forEach((d) => {
                  if (!primaryThemeForDept[d] || primaryThemeForDept[d] === theme) deptSetForTheme.add(d);
                });

                departments.forEach((d) => {
                  if (primaryThemeForDept[d] === theme) deptSetForTheme.add(d);
                });

                let deptKeys = Array.from(deptSetForTheme).sort();
                if (selectedDept !== "All") {
                  deptKeys = deptKeys.filter((dept) => dept === selectedDept);
                }

                if (deptKeys.length === 0 || deptKeys.every((dept) => !deptsMap[dept])) return null;

                return (
                  <section key={theme} className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">{theme}</h2>
                      <span className="text-sm text-muted-foreground">
                        {Object.values(deptsMap || {}).reduce(
                          (s: number, dm: any) =>
                            s + Object.values(dm).reduce((t: number, arr: any) => t + (arr?.length || 0), 0),
                          0
                        )}{" "}
                        problems
                      </span>
                    </div>

                    <div className="space-y-4">
                      {deptKeys.map((dept) => {
                        if (!deptsMap?.[dept]) return null;

                        return (
                          <div key={dept} className="bg-card rounded border border-border p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{dept}</h3>
                            </div>
                            <div className="grid gap-3">
                              {Object.keys(deptsMap?.[dept] || {}).map((cat) => (
                                <div key={cat} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">{cat}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {(deptsMap?.[dept]?.[cat] || []).length} problems
                                    </div>
                                  </div>

                                  {(deptsMap?.[dept]?.[cat] || []).map((p: ProblemRow) => (
                                    <div
                                      key={p.id}
                                      className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
                                    >
                                      <div>
                                        <div className="text-sm text-muted-foreground">{p.problem_statement_id}</div>
                                        <h4 className="font-semibold">{p.title}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                                      </div>

                                      <div className="flex flex-col items-end gap-2">
                                        {isAdmin && (
                                          <>
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => openEdit(p)}
                                                title="Edit"
                                              >
                                                <Edit className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                  setSelected(p);
                                                  setDeleteOpen(true);
                                                }}
                                                title="Delete"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleStatus(p.id, "approved")}
                                              >
                                                <Check className="w-4 h-4 mr-1" />
                                                Accept
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => openRejectDialog(p)}
                                              >
                                                <X className="w-4 h-4 mr-1" />
                                                Reject
                                              </Button>
                                            </div>
                                          </>
                                        )}

                                        <Button size="sm" variant="orange" onClick={() => openModal(p)}>
                                          View Details
                                          <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              });
            })()}
          </div>
        )}

        {rejectOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6 w-[400px] space-y-4 shadow-lg">
              <h2 className="text-lg font-semibold">Reject with Remark</h2>
              <textarea
                className="w-full border border-border rounded-md p-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                rows={4}
                placeholder="Enter remark..."
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  Submit
                </Button>
              </div>
            </div>
          </div>
        )}

        <ProblemFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          problem={selected as any}
          onSave={handleSave as any}
          loading={loading}
        />
        <DeleteConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={confirmDelete}
          title="Delete Problem"
          description={`Delete "${selected?.title}"?`}
        />

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {detailsProblem && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Problem Statement Details</DialogTitle>
                </DialogHeader>

                <div className="mt-6 border border-border rounded-xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b">
                        <td className="w-1/3 bg-muted px-4 py-3 font-medium">Problem Statement ID</td>
                        <td className="px-4 py-3 font-semibold">{detailsProblem.problem_statement_id}</td>
                      </tr>

                      <tr className="border-b">
                        <td className="bg-muted px-4 py-3 font-medium">Problem Statement Title</td>
                        <td className="px-4 py-3">{detailsProblem.title}</td>
                      </tr>

                      <tr className="border-b align-top">
                        <td className="bg-muted px-4 py-3 font-medium">Description</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-pre-line">
                          {detailsProblem.description}
                        </td>
                      </tr>

                      {detailsProblem.detailed_description && (
                        <tr className="border-b align-top">
                          <td className="bg-muted px-4 py-3 font-medium">Detailed Description</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-pre-line">
                            {detailsProblem.detailed_description}
                          </td>
                        </tr>
                      )}

                      <tr className="border-b">
                        <td className="bg-muted px-4 py-3 font-medium">Category</td>
                        <td className="px-4 py-3">{detailsProblem.category}</td>
                      </tr>

                      <tr className="border-b">
                        <td className="bg-muted px-4 py-3 font-medium">Theme</td>
                        <td className="px-4 py-3">{detailsProblem.theme}</td>
                      </tr>

                      <tr className="border-b">
                        <td className="bg-muted px-4 py-3 font-medium">Department</td>
                        <td className="px-4 py-3">{detailsProblem.department || "Not specified"}</td>
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
