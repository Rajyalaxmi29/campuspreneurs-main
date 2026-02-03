import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, ArrowRight, GraduationCap, Users, Lightbulb, AlertCircle, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { ProblemFormDialog } from "@/components/admin/ProblemFormDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const themes = [
  {
    id: "academic",
    name: "Academic",
    icon: GraduationCap,
    description: "Problems related to teaching, learning, examinations, and academic infrastructure.",
    color: "bg-primary",
  },
  {
    id: "non-academic",
    name: "Non-Academic",
    icon: Users,
    description: "Problems related to campus operations, administration, and student services.",
    color: "bg-secondary",
  },
  {
    id: "community",
    name: "Community Innovation",
    icon: Lightbulb,
    description: "Problems addressing societal challenges and community development.",
    color: "bg-accent",
  },
];

interface ProblemStatement {
  id: string;
  problem_statement_id: string;
  title: string;
  description: string;
  detailed_description: string;
  category: string;
  theme: string;
  department: string;
  created_at: string;
}

export default function Problems() {
  const [activeTheme, setActiveTheme] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAdmin();

  // Admin state
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<ProblemStatement | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProblem, setDetailsProblem] = useState<ProblemStatement | null>(null);

  const fetchProblems = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("problem_statements")
      .select("*")
      .order("problem_statement_id", { ascending: true });

    console.log("Fetched data:", data);
    console.log("Fetch error:", fetchError);

    if (fetchError) {
      console.error("Error fetching problems:", fetchError);
      setError("Failed to load problem statements. Please try again later.");
    } else {
      setProblems(data || []);
      console.log("Set problems to:", data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleSave = async (data: Omit<ProblemStatement, "id" | "created_at">) => {
    setSaving(true);
    try {
      if (selectedProblem) {
        // Update existing
        const { error } = await supabase
          .from("problem_statements")
          .update(data)
          .eq("id", selectedProblem.id);
        if (error) throw error;
        toast.success("Problem statement updated");
      } else {
        // Create new
        const { error } = await supabase
          .from("problem_statements")
          .insert([data]);
        if (error) throw error;
        toast.success("Problem statement created");
      }
      setFormOpen(false);
      setSelectedProblem(null);
      fetchProblems();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProblem) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("problem_statements")
        .delete()
        .eq("id", selectedProblem.id);
      if (error) throw error;
      toast.success("Problem statement deleted");
      setDeleteOpen(false);
      setSelectedProblem(null);
      fetchProblems();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (problem: ProblemStatement) => {
    setSelectedProblem(problem);
    setFormOpen(true);
  };

  const openDeleteDialog = (problem: ProblemStatement) => {
    setSelectedProblem(problem);
    setDeleteOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedProblem(null);
    setFormOpen(true);
  };

  const openModal = (problem: ProblemStatement) => {
    setDetailsProblem(problem);
    setDetailsOpen(true);
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesTheme = activeTheme === "All" || problem.theme === activeTheme;
    const matchesSearch =
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.problem_statement_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTheme && matchesSearch;
  });

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case "Academic":
        return "bg-primary text-primary-foreground";
      case "Non-Academic":
        return "bg-secondary text-secondary-foreground";
      case "Community Innovation":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const problemCounts = {
    All: problems.length,
    Academic: problems.filter((p) => p.theme === "Academic").length,
    "Non-Academic": problems.filter((p) => p.theme === "Non-Academic").length,
    "Community Innovation": problems.filter((p) => p.theme === "Community Innovation").length,
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-primary py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-5xl font-poppins font-bold text-primary-foreground">
            Problem Statements
          </h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Explore real-world challenges across three distinct themes. Choose a problem that resonates with you and build innovative solutions.
          </p>
          <div className="mt-6 flex justify-center gap-8 text-primary-foreground">
            <div className="text-center">
              <span className="text-3xl font-bold">{problems.length}</span>
              <p className="text-sm">Total Problems</p>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold">3</span>
              <p className="text-sm">Themes</p>
            </div>
          </div>
          {isAdmin && (
            <Button
              onClick={openCreateDialog}
              className="mt-6"
              variant="heroOutline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Problem Statement
            </Button>
          )}
        </div>
      </section>

      {/* Theme Cards */}
      <section className="py-12 bg-highlight">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-poppins font-semibold text-foreground text-center mb-8">
            Select a Theme
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const isActive = activeTheme === theme.name;
              return (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(isActive ? "All" : theme.name)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? "border-secondary bg-secondary/5 shadow-lg"
                      : "border-border bg-card hover:border-secondary/50 hover:shadow-md"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg ${theme.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg text-foreground mb-2">
                    {theme.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {theme.description}
                  </p>
                  <span className="text-secondary font-medium text-sm">
                    {problemCounts[theme.name as keyof typeof problemCounts]} Problems
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="py-6 bg-background border-b border-border sticky top-16 lg:top-20 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Theme Pills */}
            <div className="flex flex-wrap gap-2">
              {["All", "Academic", "Non-Academic", "Community Innovation"].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setActiveTheme(theme)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTheme === theme
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {theme} ({problemCounts[theme as keyof typeof problemCounts]})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by ID, title, category, department, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Cards */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-4">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Search className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground">Loading problem statements...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Problems List */}
          {!loading && !error && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredProblems.length}</span> problem statements
                </p>
              </div>

              <div className="space-y-4">
                {filteredProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="bg-card rounded-xl border border-border hover:border-secondary/50 hover:shadow-card transition-all overflow-hidden"
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Problem ID Section */}
                      <div className={`lg:w-32 p-4 lg:p-6 flex lg:flex-col items-center lg:items-start justify-center ${getThemeColor(problem.theme)}`}>
                        <span className="text-2xl lg:text-3xl font-bold font-poppins">{problem.problem_statement_id}</span>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 p-4 lg:p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getThemeColor(problem.theme)}`}>
                            {problem.theme}
                          </span>
                          <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                            {problem.category}
                          </span>
                          <span className="bg-accent px-3 py-1 rounded-full text-xs font-medium text-accent-foreground">
                            {problem.department || "Not specified"}
                          </span>
                        </div>

                        <h3 className="font-poppins font-semibold text-lg text-foreground mb-2">
                          {problem.title}
                        </h3>

                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {problem.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="lg:w-auto p-4 lg:p-6 flex items-center justify-center gap-2 border-t lg:border-t-0 lg:border-l border-border bg-highlight/50">
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(problem)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openDeleteDialog(problem)}
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="orange"
                          onClick={() => openModal(problem)}
                        >
                          View Details
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProblems.length === 0 && problems.length > 0 && (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No problem statements found matching your criteria.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setActiveTheme("All");
                      setSearchQuery("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {problems.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">No Problem Statements Yet</p>
                  <p className="text-muted-foreground">Problem statements will appear here once they are added to the database.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!isAdmin && (
        <section className="py-12 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-poppins font-bold text-primary-foreground mb-4">
              Ready to Solve a Problem?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              Register your team and start working on your innovative solution today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="heroOutline" size="lg">
                <Link to="/resources">Download Resources</Link>
              </Button>
              <Button asChild variant="orange" size="lg">
                <Link to="/registration">Register Now</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Admin Dialogs */}
      <ProblemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        problem={selectedProblem}
        onSave={handleSave}
        loading={saving}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Problem Statement"
        description={`Are you sure you want to delete "${selectedProblem?.title}"? This action cannot be undone.`}
        loading={saving}
      />

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
                        {detailsProblem.detailed_description || detailsProblem.description}
                      </td>
                    </tr>

                    {/* Category */}
                    <tr className="border-b">
                      <td className="bg-muted px-4 py-3 font-medium">
                        Category
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground">
                          {detailsProblem.category}
                        </span>
                      </td>
                    </tr>

                    {/* Theme */}
                    <tr className="border-b">
                      <td className="bg-muted px-4 py-3 font-medium">
                        Theme
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground">
                          {detailsProblem.theme}
                        </span>
                      </td>
                    </tr>

                    {/* Department */}
                    <tr>
                      <td className="bg-muted px-4 py-3 font-medium">
                        Department
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm bg-accent text-accent-foreground">
                          {detailsProblem.department || "Not specified"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
