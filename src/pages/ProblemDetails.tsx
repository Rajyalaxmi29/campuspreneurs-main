import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Tag, Layers } from "lucide-react";

interface ProblemStatement {
  id: string;
  problem_statement_id: string;
  title: string;
  description: string;
  category: string;
  theme: string;
  created_at: string;
}

export default function ProblemDetails() {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<ProblemStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProblem = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      // Fetch by public-facing problem_statement_id first (e.g. "25001")
      const byCode = await supabase
        .from("problem_statements")
        .select("*")
        .eq("problem_statement_id", id)
        .maybeSingle();

      if (cancelled) return;

      if (byCode.error) {
        setError("Failed to load problem statement.");
        setLoading(false);
        return;
      }

      if (byCode.data) {
        setProblem(byCode.data);
        setLoading(false);
        return;
      }

      // Only attempt UUID lookup when the route param is a valid UUID.
      // This avoids PostgREST errors like: invalid input syntax for type uuid: "25001"
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id
        );

      if (isUuid) {
        const byUuid = await supabase
          .from("problem_statements")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (cancelled) return;

        if (byUuid.error) {
          setError("Failed to load problem statement.");
        } else if (!byUuid.data) {
          setError("Problem statement not found.");
        } else {
          setProblem(byUuid.data);
        }

        setLoading(false);
        return;
      }

      setError("Problem statement not found.");
      setLoading(false);
    };

    fetchProblem();

    return () => {
      cancelled = true;
    };
  }, [id]);

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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground">Loading problem statement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !problem) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-poppins font-semibold text-foreground mb-2">
              {error || "Problem Not Found"}
            </h2>
            <p className="text-muted-foreground mb-6">
              The problem statement you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild variant="orange">
              <Link to="/problems">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Problems
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-primary py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <Button
            asChild
            variant="ghost"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4"
          >
            <Link to="/problems">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Problem Statements
            </Link>
          </Button>
          <h1 className="text-2xl lg:text-3xl font-poppins font-bold text-primary-foreground">
            Problem Statement Details
          </h1>
        </div>
      </section>

      {/* SIH-Style Details Table */}
      <section className="py-8 lg:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
            {/* Table Layout */}
            <div className="divide-y divide-border">
              {/* Problem Statement ID */}
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-64 bg-muted/50 px-6 py-4 font-medium text-foreground">
                  Problem Statement ID
                </div>
                <div className="flex-1 px-6 py-4 text-foreground font-poppins font-semibold text-lg">
                  {problem.problem_statement_id}
                </div>
              </div>

              {/* Problem Statement Title */}
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-64 bg-muted/50 px-6 py-4 font-medium text-foreground">
                  Problem Statement Title
                </div>
                <div className="flex-1 px-6 py-4 text-foreground">
                  {problem.title}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-64 bg-muted/50 px-6 py-4 font-medium text-foreground">
                  Description
                </div>
                <div className="flex-1 px-6 py-4">
                  <div className="text-muted-foreground max-h-64 overflow-y-auto pr-4 whitespace-pre-wrap">
                    {problem.description}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-64 bg-muted/50 px-6 py-4 font-medium text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Category
                </div>
                <div className="flex-1 px-6 py-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                    {problem.category}
                  </span>
                </div>
              </div>

              {/* Theme */}
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-64 bg-muted/50 px-6 py-4 font-medium text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Theme
                </div>
                <div className="flex-1 px-6 py-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getThemeColor(problem.theme)}`}>
                    {problem.theme}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/problems">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse More Problems
              </Link>
            </Button>
            <Button asChild variant="orange" size="lg">
              <Link to="/registration">
                Register Your Team
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
