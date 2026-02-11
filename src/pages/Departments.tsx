import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import {
  // keep Accordion imports removed — using card layout
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Edit, Check, X, ArrowRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { ProblemFormDialog } from "@/components/admin/ProblemFormDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { toast } from "sonner";

interface ProblemStatementRow {
  id: string;
  problem_statement_id: string;
  title: string;
  description: string;
  category?: string;
  department?: string;
  theme?: string;
  status?: string;
}

export default function DepartmentsPage() {
  const [problems, setProblems] = useState<ProblemStatementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState<Record<string, Record<string, Record<string, ProblemStatementRow[]>>>>({});
  const [departmentsListState, setDepartmentsListState] = useState<string[]>([]);

  const { isAdmin } = useAdmin();

  // Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ProblemStatementRow | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchProblems = async () => {
    setLoading(true);
    const [{ data: problemsData, error: problemsError }, { data: regsData, error: regsError }] = await Promise.all([
      supabase.from("problem_statements").select("*").order("problem_statement_id", { ascending: true }),
      supabase.from("team_registrations").select("department"),
    ]);

    if (problemsError) {
      console.error("Error fetching problems:", problemsError);
      toast.error("Failed to load problem statements");
      setProblems([]);
    } else {
      setProblems(problemsData || []);
    }

    // Build list of departments from problems and registrations
    // Only use the explicit `department` field — do not fall back to `category`.
    // This ensures departments like "EEE" are listed as departments and not mixed with categories.
    const deptSet = new Set<string>();
    (problemsData || []).forEach((p: any) => {
      if (p.department) deptSet.add(p.department);
    });
    (regsData || []).forEach((r: any) => {
      if (r.department) deptSet.add(r.department);
    });

    const departmentsList = Array.from(deptSet).sort();
    setDepartmentsListState(departmentsList);

    // group problems by theme -> department -> category
    const groupedMap = (problemsData || []).reduce((acc: any, p: any) => {
      const theme = p.theme || "Other";
      const dept = p.department || "Uncategorized";
      const category = p.category || "Uncategorized";
      if (!acc[theme]) acc[theme] = {};
      if (!acc[theme][dept]) acc[theme][dept] = {};
      if (!acc[theme][dept][category]) acc[theme][dept][category] = [];
      acc[theme][dept][category].push(p);
      return acc;
    }, {} as Record<string, Record<string, Record<string, ProblemStatementRow[]>>>);

    // Ensure every theme has entries for all known departments (so departments appear under each theme even if zero problems)
    const themes = Object.keys(groupedMap);
    if (themes.length === 0) {
      // ensure at least one theme exists if problems exist
      if ((problemsData || []).length > 0) groupedMap["Other"] = groupedMap["Other"] || {};
    }

    themes.forEach((theme) => {
      departmentsList.forEach((d) => {
        if (!groupedMap[theme][d]) groupedMap[theme][d] = {};
      });
    });

    // Debug: log distinct departments, themes and counts to the browser console
    try {
      const themeKeys = Object.keys(groupedMap);
      const counts: Record<string, Record<string, number>> = {};
      themeKeys.forEach((t) => {
        counts[t] = {};
        Object.entries(groupedMap[t] || {}).forEach(([d, cats]: any) => {
          counts[t][d] = Object.values(cats).reduce((s: number, arr: any) => s + (arr?.length || 0), 0);
        });
      });
      // eslint-disable-next-line no-console
      console.log("Departments (distinct):", departmentsList);
      // eslint-disable-next-line no-console
      console.log("Themes (distinct):", themeKeys);
      // eslint-disable-next-line no-console
      console.log("Problem counts by theme→department:", counts);
    } catch (e) {
      // ignore logging errors
    }

    setGrouped(groupedMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const openEdit = (p: ProblemStatementRow) => {
    setSelected(p);
    setFormOpen(true);
  };

  const handleSave = async (data: Omit<ProblemStatementRow, "id" | "created_at">) => {
    try {
      if (selected) {
        const { error } = await supabase
          .from("problem_statements")
          .update(data)
          .eq("id", selected.id as string);
        if (error) throw error;
        toast.success("Problem updated");
      } else {
        const { error } = await supabase.from("problem_statements").insert([data]);
        if (error) throw error;
        toast.success("Problem created");
      }
      setFormOpen(false);
      setSelected(null);
      fetchProblems();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      const { error } = await supabase
        .from("problem_statements")
        .delete()
        .eq("id", selected.id);
      if (error) throw error;
      toast.success("Problem deleted");
      setDeleteOpen(false);
      setSelected(null);
      fetchProblems();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("problem_statements")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Status updated to ${status}`);
      fetchProblems();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold">Departments</h1>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-8">
            {(() => {
              const themesOrder = ["Academic", "Non-Academic", "Community Innovation"];
              const themeKeys = Array.from(new Set([...themesOrder, ...Object.keys(grouped || {})]));
              return themeKeys.map((theme) => {
                const deptsMap = grouped[theme] || {};
                // total problems in theme
                const totalTheme = Object.values(deptsMap || {}).reduce((s, deptObj: any) => {
                  return s + Object.values(deptObj).reduce((t, arr: any) => t + (arr?.length || 0), 0);
                }, 0);

                // department keys: include known departments from registrations plus those present under this theme
                const deptKeys = Array.from(new Set([...(departmentsListState || []), ...Object.keys(deptsMap || {})]));

                return (
                  <section key={theme} className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">{theme}</h2>
                      <span className="text-sm text-muted-foreground">{totalTheme} problem{totalTheme !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="space-y-6">
                      {theme === "Academic" ? (
                        deptKeys.map((dept) => {
                          const categoriesMap = deptsMap?.[dept] || {};
                          // category ordering
                          const categoriesOrder = ["Software", "Hardware", "Hardware/Software", "Uncategorized"];
                          const catKeys = Array.from(new Set([...categoriesOrder, ...Object.keys(categoriesMap || {})]));

                          const deptTotal = Object.values(categoriesMap).reduce((c: any, arr: any) => c + (arr?.length || 0), 0);

                          return (
                            <div key={dept} className="bg-card rounded-xl border border-border p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold">{dept} <span className="text-sm text-muted-foreground">({deptTotal})</span></h3>
                              </div>

                              <div className="grid gap-4">
                                {catKeys.map((cat) => {
                                  const list = categoriesMap?.[cat] || [];
                                  if (!list.length) return (
                                    <div key={cat} className="bg-muted/50 rounded-lg p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">{cat}</div>
                                        <div className="text-sm text-muted-foreground">0 problems</div>
                                      </div>
                                    </div>
                                  );

                                  return (
                                    <div key={cat} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">{cat}</div>
                                        <div className="text-sm text-muted-foreground">{list.length} problem{list.length !== 1 ? 's' : ''}</div>
                                      </div>
                                      <div className="grid gap-4">
                                        {list.map((problem) => (
                                          <div key={problem.id} className="bg-card rounded-xl border border-border hover:border-secondary/50 hover:shadow-card transition-all overflow-hidden">
                                            <div className="flex flex-col lg:flex-row">
                                              <div className={`lg:w-32 p-4 lg:p-6 flex lg:flex-col items-center lg:items-start justify-center bg-muted`}>
                                                <span className="text-2xl lg:text-3xl font-bold font-poppins">{problem.problem_statement_id}</span>
                                              </div>

                                              <div className="flex-1 p-4 lg:p-6">
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                  <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">{problem.theme || 'General'}</span>
                                                  <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">{problem.category || 'Uncategorized'}</span>
                                                  <span className="bg-accent px-3 py-1 rounded-full text-xs font-medium text-accent-foreground">{problem.department || 'Not specified'}</span>
                                                </div>

                                                <h4 className="font-poppins font-semibold text-lg text-foreground mb-2">{problem.title}</h4>
                                                <p className="text-muted-foreground text-sm line-clamp-2">{problem.description}</p>
                                              </div>

                                              <div className="lg:w-auto p-4 lg:p-6 flex items-center justify-center gap-2 border-t lg:border-t-0 lg:border-l border-border bg-highlight/50">
                                                {isAdmin && (
                                                  <>
                                                    <Button variant="outline" size="icon" onClick={() => openEdit(problem)} title="Edit">
                                                      <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => { setSelected(problem); setDeleteOpen(true); }} title="Delete" className="text-destructive hover:text-destructive">
                                                      <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="success" onClick={() => handleStatusChange(problem.id, 'accepted')}>
                                                      <Check className="w-4 h-4 mr-2" /> Accept
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(problem.id, 'rejected')}>
                                                      <X className="w-4 h-4 mr-2" /> Reject
                                                    </Button>
                                                  </>
                                                )}
                                                <Button size="sm" variant="orange" asChild>
                                                  <Link to={`/problems/${problem.problem_statement_id}`}>
                                                    View Details
                                                    <ArrowRight className="w-4 h-4 ml-1" />
                                                  </Link>
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // For non-Academic themes, render categories directly (no department subdivision)
                        (() => {
                          const combinedCategories: Record<string, ProblemStatementRow[]> = {};
                          Object.values(deptsMap || {}).forEach((catMap: any) => {
                            Object.entries(catMap || {}).forEach(([cat, arr]: any) => {
                              combinedCategories[cat] = (combinedCategories[cat] || []).concat(arr || []);
                            });
                          });
                          const categoriesOrder = ["Software", "Hardware", "Hardware/Software", "Uncategorized"];
                          const catKeys = Array.from(new Set([...categoriesOrder, ...Object.keys(combinedCategories || {})]));

                          return (
                            <div>
                              {catKeys.map((cat) => {
                                const list = combinedCategories[cat] || [];
                                if (!list.length) return (
                                  <div key={cat} className="bg-muted/50 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm font-medium">{cat}</div>
                                      <div className="text-sm text-muted-foreground">0 problems</div>
                                    </div>
                                  </div>
                                );

                                return (
                                  <div key={cat} className="space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-sm font-medium">{cat}</div>
                                      <div className="text-sm text-muted-foreground">{list.length} problem{list.length !== 1 ? 's' : ''}</div>
                                    </div>
                                    <div className="grid gap-4">
                                      {list.map((problem) => (
                                        <div key={problem.id} className="bg-card rounded-xl border border-border hover:border-secondary/50 hover:shadow-card transition-all overflow-hidden">
                                          <div className="flex flex-col lg:flex-row">
                                            <div className={`lg:w-32 p-4 lg:p-6 flex lg:flex-col items-center lg:items-start justify-center bg-muted`}>
                                              <span className="text-2xl lg:text-3xl font-bold font-poppins">{problem.problem_statement_id}</span>
                                            </div>

                                            <div className="flex-1 p-4 lg:p-6">
                                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">{problem.theme || 'General'}</span>
                                                <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">{problem.category || 'Uncategorized'}</span>
                                                <span className="bg-accent px-3 py-1 rounded-full text-xs font-medium text-accent-foreground">{problem.department || 'Not specified'}</span>
                                              </div>

                                              <h4 className="font-poppins font-semibold text-lg text-foreground mb-2">{problem.title}</h4>
                                              <p className="text-muted-foreground text-sm line-clamp-2">{problem.description}</p>
                                            </div>

                                            <div className="lg:w-auto p-4 lg:p-6 flex items-center justify-center gap-2 border-t lg:border-t-0 lg:border-l border-border bg-highlight/50">
                                              {isAdmin && (
                                                <>
                                                  <Button variant="outline" size="icon" onClick={() => openEdit(problem)} title="Edit">
                                                    <Edit className="w-4 h-4" />
                                                  </Button>
                                                  <Button variant="outline" size="icon" onClick={() => { setSelected(problem); setDeleteOpen(true); }} title="Delete" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                  <Button size="sm" variant="success" onClick={() => handleStatusChange(problem.id, 'accepted')}>
                                                    <Check className="w-4 h-4 mr-2" /> Accept
                                                  </Button>
                                                  <Button size="sm" variant="destructive" onClick={() => handleStatusChange(problem.id, 'rejected')}>
                                                    <X className="w-4 h-4 mr-2" /> Reject
                                                  </Button>
                                                </>
                                              )}
                                              <Button size="sm" variant="orange" asChild>
                                                <Link to={`/problems/${problem.problem_statement_id}`}>
                                                  View Details
                                                  <ArrowRight className="w-4 h-4 ml-1" />
                                                </Link>
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </section>
                );
              });
            })()}
          </div>
        )}

        <ProblemFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          problem={selected}
          onSave={handleSave}
          loading={loading}
        />

        <DeleteConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={confirmDelete}
          title="Delete Problem"
          description={`Are you sure you want to delete the problem "${selected?.title}"? This action cannot be undone.`}
        />
      </div>
    </Layout>
  );
}
