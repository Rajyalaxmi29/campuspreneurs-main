import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Shield, TrendingUp, Edit, Trash2, Eye, Download, Calendar } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { TeamFormDialog } from "@/components/admin/TeamFormDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

interface Stats {
  totalProblems: number;
  totalUsers: number;
  adminCount: number;
  studentCount: number;
}

interface ProblemStats {
  id: string;
  title: string;
  count: number;
}

interface ThemeStats {
  theme: string;
  count: number;
}

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
  document_filename?: string;
  created_at: string;
  problem_title?: string;
  theme?: string;
}

interface ProblemStatement {
  problem_statement_id: string;
  title: string;
  theme: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProblems: 0,
    totalUsers: 0,
    adminCount: 0,
    studentCount: 0,
  });
  const [problemStats, setProblemStats] = useState<ProblemStats[]>([]);
  const [themeStats, setThemeStats] = useState<ThemeStats[]>([]);
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemFilter, setProblemFilter] = useState<string>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [problemStatsFilter, setProblemStatsFilter] = useState<string>("all");
  const [teamFormDialogOpen, setTeamFormDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamRegistration | null>(null);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [deleteAllConfirmDialogOpen, setDeleteAllConfirmDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamRegistration | null>(null);
  const [problems, setProblems] = useState<ProblemStatement[]>([]);

  // Helper function to recalculate statistics
  const recalculateStats = (teams: TeamRegistration[]) => {
    // Recalculate problem stats
    const problemCountMap = teams.reduce((acc, reg) => {
      acc[reg.problem_id] = (acc[reg.problem_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const problemStatsData = problems.map(p => ({
      id: p.problem_statement_id,
      title: p.title,
      count: problemCountMap[p.problem_statement_id] || 0
    }));

    // Recalculate theme stats
    const themeCountMap = problems.reduce((acc, p) => {
      const count = problemCountMap[p.problem_statement_id] || 0;
      acc[p.theme] = (acc[p.theme] || 0) + count;
      return acc;
    }, {} as Record<string, number>);

    const themeStatsData = Object.entries(themeCountMap).map(([theme, count]) => ({
      theme,
      count
    }));

    setProblemStats(problemStatsData);
    setThemeStats(themeStatsData);
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      // Fetch problems data (same logic as Problems page)
      const { data: problems, error: problemsError } = await supabase
        .from("problem_statements")
        .select("*")
        .order("problem_statement_id", { ascending: true });

      console.log("AdminDashboard - Fetched problems:", problems);
      console.log("AdminDashboard - Fetch error:", problemsError);

      // Fetch user counts by role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const adminCount = roles?.filter((r) => r.role === "admin").length || 0;
      const studentCount = roles?.filter((r) => r.role === "student").length || 0;

      // Check current user role
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserRole = roles?.find(r => r.user_id === user?.id)?.role;
      console.log("Current user role:", currentUserRole);

      // Fetch team registrations per problem
      const { data: registrations, error: regError } = await (supabase as any)
        .from("team_registrations")
        .select("problem_id");

      if (regError) {
        console.error("Error fetching registrations:", regError);
      } else {
        console.log("Registrations fetched:", registrations);
      }

      const problemCountMap = (registrations as { problem_id: string }[] | null)?.reduce((acc, reg) => {
        acc[reg.problem_id] = (acc[reg.problem_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const problemStatsData = problems?.map(p => ({
        id: p.problem_statement_id,
        title: p.title,
        count: problemCountMap[p.problem_statement_id] || 0
      })) || [];

      // Calculate theme stats
      const themeCountMap = problems?.reduce((acc, p) => {
        const count = problemCountMap[p.problem_statement_id] || 0;
        acc[p.theme] = (acc[p.theme] || 0) + count;
        return acc;
      }, {} as Record<string, number>) || {};

      const themeStatsData = Object.entries(themeCountMap).map(([theme, count]) => ({
        theme,
        count
      }));

      console.log("Theme Stats Data:", themeStatsData);

      // Fetch all team registrations with problem details
      const { data: teamRegs, error: teamError } = await (supabase as any)
        .from("team_registrations")
        .select("*");

      if (teamError) {
        console.error("Error fetching team registrations:", teamError);
      } else {
        console.log("Team registrations fetched:", teamRegs);
        // Add problem titles and theme info to team registrations
        const teamRegsWithTitles = teamRegs?.map((reg: any) => {
          const problem = problems?.find(p => p.problem_statement_id === reg.problem_id);
          return {
            ...reg,
            problem_title: problem?.title || "Unknown Problem",
            theme: problem?.theme || "Unknown Theme"
          };
        }) || [];
        setTeamRegistrations(teamRegsWithTitles);
      }

      setStats({
        totalProblems: problems?.length || 0,
        totalUsers: (roles?.length || 0),
        adminCount,
        studentCount,
      });

      setProblemStats(problemStatsData);
      setThemeStats(themeStatsData);

      setLoading(false);
    };

    fetchStats();
  }, []);

  // Filter and sort teams
  useEffect(() => {
    let filtered = [...teamRegistrations];

    // Apply problem filter
    if (problemFilter !== "all") {
      filtered = filtered.filter(team => team.problem_id === problemFilter);
    }

    // Apply theme filter
    if (themeFilter !== "all") {
      filtered = filtered.filter(team => team.theme === themeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof TeamRegistration];
      let bValue: any = b[sortField as keyof TeamRegistration];

      if (sortField === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTeams(filtered);
  }, [teamRegistrations, problemFilter, themeFilter, sortField, sortDirection]);

  // Set problems state
  useEffect(() => {
    const fetchProblems = async () => {
      const { data: problemsData, error } = await supabase
        .from("problem_statements")
        .select("problem_statement_id, title, theme")
        .order("problem_statement_id", { ascending: true });

      if (!error && problemsData) {
        setProblems(problemsData);
      }
    };

    fetchProblems();
  }, []);

  const handleEditTeam = (team: TeamRegistration) => {
    setSelectedTeam(team);
    setTeamFormDialogOpen(true);
  };

  const handleDeleteTeam = (team: TeamRegistration) => {
    setTeamToDelete(team);
    setDeleteConfirmDialogOpen(true);
  };

  const handleDeleteAllTeams = () => {
    setDeleteAllConfirmDialogOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      console.log("Deleting team:", teamToDelete.team_name);
      console.log("Document URL to delete:", teamToDelete.document_url);

      // Delete associated document from storage if it exists
      if (teamToDelete.document_url) {
        try {
          const { error: storageError } = await supabase.storage
            .from("team-documents")
            .remove([teamToDelete.document_url]);

          if (storageError) {
            console.error("Error deleting document from storage:", storageError);
            // Continue with team deletion even if document deletion fails
          }
        } catch (error) {
          console.error("Error deleting document:", error);
          // Continue with team deletion even if document deletion fails
        }
      }

      console.log("Deleting team record from database...");
      const { error } = await (supabase as any).from("team_registrations").delete().eq("id", teamToDelete.id);

      if (error) {
        console.error("Error deleting team from database:", error);
        throw error;
      }

      console.log("Team deleted successfully");
      const updatedTeams = teamRegistrations.filter(team => team.id !== teamToDelete.id);
      setTeamRegistrations(updatedTeams);
      recalculateStats(updatedTeams);
      setDeleteConfirmDialogOpen(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const confirmDeleteAllTeams = async () => {
    try {
      // First, fetch all teams to get their document URLs
      const { data: allTeams, error: fetchError } = await (supabase as any)
        .from("team_registrations")
        .select("document_url");

      if (fetchError) {
        console.error("Error fetching teams for deletion:", fetchError);
        throw fetchError;
      }

      // Delete associated documents from storage
      if (allTeams && allTeams.length > 0) {
        const documentUrls = allTeams
          .filter((team: any) => team.document_url)
          .map((team: any) => team.document_url);

        if (documentUrls.length > 0) {
          try {
            const { error: storageError } = await supabase.storage
              .from("team-documents")
              .remove(documentUrls);

            if (storageError) {
              console.error("Error deleting documents from storage:", storageError);
              // Continue with team deletion even if document deletion fails
            }
          } catch (error) {
            console.error("Error deleting documents:", error);
            // Continue with team deletion even if document deletion fails
          }
        }
      }

      // Delete all team records from database
      const { error } = await (supabase as any).from("team_registrations").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      setTeamRegistrations([]);
      recalculateStats([]);
      setDeleteAllConfirmDialogOpen(false);
    } catch (error) {
      console.error("Error deleting all teams:", error);
    }
  };

  const handleSaveTeam = async (data: Omit<TeamRegistration, "id" | "created_at" | "problem_title" | "theme">) => {
    try {
      if (selectedTeam) {
        // Update existing team
        const { error } = await (supabase as any)
          .from("team_registrations")
          .update(data)
          .eq("id", selectedTeam.id);

        if (error) throw error;

        // Update local state
        const updatedTeams = teamRegistrations.map(team =>
          team.id === selectedTeam.id
            ? {
                ...team,
                ...data,
                problem_title: problems.find(p => p.problem_statement_id === data.problem_id)?.title || "Unknown Problem",
                theme: problems.find(p => p.problem_statement_id === data.problem_id)?.theme || "Unknown Theme"
              }
            : team
        );
        setTeamRegistrations(updatedTeams);
        recalculateStats(updatedTeams);
      }

      setTeamFormDialogOpen(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error("Error saving team:", error);
    }
  };

  const handleViewPPT = async (team: TeamRegistration) => {
    if (!team.document_url) return;

    try {
      const { data } = supabase.storage
        .from("team-documents")
        .getPublicUrl(team.document_url);

      if (data?.publicUrl) {
        // Use Office Online viewer for PPT files
        const encodedUrl = encodeURIComponent(data.publicUrl);
        const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}&wdOrigin=BROWSELINK`;
        window.open(viewerUrl, '_blank');
      }
    } catch (error) {
      console.error("Error viewing PPT:", error);
    }
  };

  const handleDownloadPPT = async (team: TeamRegistration) => {
    if (!team.document_url) return;

    try {
      // Use Supabase download method for proper file download
      const { data, error } = await supabase.storage
        .from("team-documents")
        .download(team.document_url);

      if (error) throw error;

      if (data) {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = team.document_filename || 'presentation.ppt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the object URL
        URL.revokeObjectURL(link.href);
      }
    } catch (error) {
      console.error("Error downloading PPT:", error);
    }
  };

  const statCards = [
    {
      title: "Total Problem Statements",
      value: stats.totalProblems,
      icon: FileText,
      color: "bg-primary",
    },
    {
      title: "Total Registered Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-secondary",
    },
    {
      title: "Admin Users",
      value: stats.adminCount,
      icon: Shield,
      color: "bg-accent",
    },
    {
      title: "Student Users",
      value: stats.studentCount,
      icon: TrendingUp,
      color: "bg-muted",
    },
  ];

  return (
    <Layout>
      {/* Header */}
      <section className="bg-primary py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-5xl font-poppins font-bold text-primary-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Overview of Campuspreneurs statistics and management tools.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.title}
                      className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all"
                    >
                      <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">{stat.title}</p>
                      <p className="text-3xl font-poppins font-bold text-foreground mt-1">
                        {stat.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Registration Statistics */}
              <Accordion type="multiple" className="w-full space-y-4">
                <AccordionItem value="problems" className="bg-card rounded-xl shadow-card">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <h2 className="text-xl font-poppins font-semibold text-foreground text-left">
                      Team Registrations by Problem Statement
                    </h2>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    {problemStats.length > 0 ? (
                      <>
                        {/* Filter Control */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Filter by Problem Statement
                          </label>
                          <select
                            value={problemStatsFilter}
                            onChange={(e) => setProblemStatsFilter(e.target.value)}
                            className="w-full max-w-xs px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="all">All Problems</option>
                            {problemStats.map((problem) => (
                              <option key={problem.id} value={problem.id}>
                                {problem.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 px-4 font-medium text-foreground">Problem Title</th>
                                <th className="text-right py-2 px-4 font-medium text-foreground">Registered Teams</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(problemStatsFilter === "all" ? problemStats : problemStats.filter(problem => problem.id === problemStatsFilter)).map((problem) => (
                                <tr key={problem.id} className="border-b border-border/50">
                                  <td className="py-3 px-4 text-foreground">{problem.title}</td>
                                  <td className="py-3 px-4 text-right font-semibold text-primary">{problem.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No registrations yet.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="themes" className="bg-card rounded-xl shadow-card">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <h2 className="text-xl font-poppins font-semibold text-foreground text-left">
                      Team Registrations by Theme
                    </h2>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    {themeStats.length > 0 ? (
                      <>
                        {/* Pie Chart */}
                        <div className="mb-8">
                          <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={themeStats.map((theme, index) => ({
                                    name: theme.theme.charAt(0).toUpperCase() + theme.theme.slice(1),
                                    value: Math.max(theme.count, 0.1), // Ensure minimum value to prevent 0% slices
                                    actualCount: theme.count,
                                    fill: `hsl(${index * 137.5 % 360}, 70%, 50%)`
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, actualCount }) => {
                                    const totalRegistrations = themeStats.reduce((sum, t) => sum + t.count, 0);
                                    const percentage = totalRegistrations === 0 ? 0 : ((actualCount / totalRegistrations) * 100).toFixed(0);
                                    return `${name} ${percentage}%`;
                                  }}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {themeStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${index * 137.5 % 360}, 70%, 50%)`} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value, name, props) => [
                                    `${props.payload.actualCount} teams`,
                                    name
                                  ]}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Theme Stats Grid */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {themeStats.map((theme) => (
                            <div key={theme.theme} className="bg-muted/50 rounded-lg p-4">
                              <h3 className="font-medium text-foreground capitalize">{theme.theme}</h3>
                              <p className="text-2xl font-bold text-primary mt-1">{theme.count}</p>
                              <p className="text-sm text-muted-foreground">teams registered</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No registrations yet.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="all-teams" className="bg-card rounded-xl shadow-card">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <h2 className="text-xl font-poppins font-semibold text-foreground text-left">
                      All Registered Teams
                    </h2>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    {teamRegistrations.length > 0 ? (
                      <>
                        {/* Filter and Sort Controls */}
                        <div className="mb-6 space-y-4">
                          <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Filter by Problem Statement
                              </label>
                              <select
                                value={problemFilter}
                                onChange={(e) => setProblemFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="all">All Problems</option>
                                {problemStats.map((problem) => (
                                  <option key={problem.id} value={problem.id}>
                                    {problem.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Filter by Theme
                              </label>
                              <select
                                value={themeFilter}
                                onChange={(e) => setThemeFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="all">All Themes</option>
                                {[...new Set(themeStats.map(t => t.theme))].map((theme) => (
                                  <option key={theme} value={theme}>
                                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Sort by
                              </label>
                              <select
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="created_at">Registration Date</option>
                                <option value="team_name">Team Name</option>
                                <option value="year">Year</option>
                                <option value="department">Department</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                                className="px-4 py-2 border border-border rounded-md bg-background text-foreground hover:bg-accent transition-colors"
                              >
                                {sortDirection === "asc" ? "↑ Ascending" : "↓ Descending"}
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Showing {filteredTeams.length} of {teamRegistrations.length} teams
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-4 font-medium text-foreground">Team Name</th>
                              <th className="text-left py-2 px-4 font-medium text-foreground">Problem</th>
                              <th className="text-left py-2 px-4 font-medium text-foreground">Members</th>
                              <th className="text-left py-2 px-4 font-medium text-foreground">Year</th>
                              <th className="text-left py-2 px-4 font-medium text-foreground">Department</th>
                              <th className="text-left py-2 px-4 font-medium text-foreground">Contact</th>
                              <th className="text-left py-2 px-4 font-medium text-foreground">Registered</th>
                              <th className="text-left py-2 px-4 font-medium text-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTeams.map((team) => (
                              <tr key={team.id} className="border-b border-border/50">
                                <td className="py-3 px-4 text-foreground font-medium">{team.team_name}</td>
                                <td className="py-3 px-4 text-foreground">{team.problem_title}</td>
                                <td className="py-3 px-4 text-foreground">
                                  <div className="text-sm">
                                    <div>{team.member1_name} ({team.member1_roll})</div>
                                    {team.member2_name && <div>{team.member2_name} ({team.member2_roll})</div>}
                                    {team.member3_name && <div>{team.member3_name} ({team.member3_roll})</div>}
                                    {team.member4_name && <div>{team.member4_name} ({team.member4_roll})</div>}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-foreground">{team.year}</td>
                                <td className="py-3 px-4 text-foreground">{team.department}</td>
                                <td className="py-3 px-4 text-foreground">
                                  <div className="text-sm">
                                    <div>{team.email}</div>
                                    <div>{team.phone}</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-foreground text-sm">
                                  {new Date(team.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex gap-2">
                                    {team.document_url && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleViewPPT(team)}
                                          className="h-8 w-8 p-0"
                                          title="View PPT"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDownloadPPT(team)}
                                          className="h-8 w-8 p-0"
                                          title="Download PPT"
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditTeam(team)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteTeam(team)}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No team registrations yet.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Quick Actions */}
              <div className="bg-card rounded-xl p-6 shadow-card mt-8">
                <h2 className="text-xl font-poppins font-semibold text-foreground mb-4">
                  Quick Actions
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link
                    to="/problems"
                    className="p-4 rounded-lg border border-border hover:border-secondary hover:bg-accent/50 transition-all"
                  >
                    <FileText className="w-6 h-6 text-secondary mb-2" />
                    <h3 className="font-semibold text-foreground">Manage Problems</h3>
                    <p className="text-sm text-muted-foreground">Add, edit or delete problem statements</p>
                  </Link>
                  <Link
                    to="/events"
                    className="p-4 rounded-lg border border-border hover:border-secondary hover:bg-accent/50 transition-all"
                  >
                    <Calendar className="w-6 h-6 text-secondary mb-2" />
                    <h3 className="font-semibold text-foreground">Manage Events</h3>
                    <p className="text-sm text-muted-foreground">Add, edit or delete events</p>
                  </Link>
                  <Link
                    to="/resources"
                    className="p-4 rounded-lg border border-border hover:border-secondary hover:bg-accent/50 transition-all"
                  >
                    <FileText className="w-6 h-6 text-secondary mb-2" />
                    <h3 className="font-semibold text-foreground">Manage Resources</h3>
                    <p className="text-sm text-muted-foreground">Upload and update documents</p>
                  </Link>
                  <Button
                    onClick={handleDeleteAllTeams}
                    variant="destructive"
                    className="p-4 h-auto flex flex-col items-start"
                  >
                    <Trash2 className="w-6 h-6 mb-2" />
                    <h3 className="font-semibold">Delete All Teams</h3>
                    <p className="text-sm text-left">Remove all team registrations</p>
                  </Button>
                </div>
              </div>

              {/* Dialogs */}
              <TeamFormDialog
                open={teamFormDialogOpen}
                onOpenChange={setTeamFormDialogOpen}
                team={selectedTeam}
                problems={problems}
                onSave={handleSaveTeam}
                loading={loading}
              />

              <DeleteConfirmDialog
                open={deleteConfirmDialogOpen}
                onOpenChange={setDeleteConfirmDialogOpen}
                onConfirm={confirmDeleteTeam}
                title="Delete Team"
                description={`Are you sure you want to delete the team "${teamToDelete?.team_name}"? This action cannot be undone.`}
              />

              <DeleteConfirmDialog
                open={deleteAllConfirmDialogOpen}
                onOpenChange={setDeleteAllConfirmDialogOpen}
                onConfirm={confirmDeleteAllTeams}
                title="Delete All Teams"
                description="Are you sure you want to delete all team registrations? This action cannot be undone."
              />
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
