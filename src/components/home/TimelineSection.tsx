import { Check, Rocket, Users, Award, Target } from "lucide-react";

const phases = [
  {
    id: 0,
    name: "Phase 0",
    title: "Problem Discovery",
    description: "Identify and document real campus challenges through observation and research.",
    icon: Target,
  },
  {
    id: 1,
    name: "Phase 1",
    title: "Team Formation & Registration",
    description: "Form cross-functional teams and register with your chosen problem statement.",
    icon: Users,
  },
  {
    id: 2,
    name: "Phase 2",
    title: "Solution Ideation",
    description: "Brainstorm, validate, and refine your innovative solution approach.",
    icon: Rocket,
  },
  {
    id: 3,
    name: "Phase 3",
    title: "Prototype Development",
    description: "Build working prototypes and prepare comprehensive documentation.",
    icon: Check,
  },
  {
    id: 4,
    name: "Phase 4",
    title: "Final Pitch & Evaluation",
    description: "Present your solution to the jury and compete for recognition and prizes.",
    icon: Award,
  },
];

export function TimelineSection() {
  return (
    <section className="py-20 lg:py-28 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-secondary font-medium text-sm uppercase tracking-wider">
            Event Journey
          </span>
          <h2 className="mt-3 text-3xl lg:text-4xl font-poppins font-bold text-foreground">
            Your Path to Innovation
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 lg:left-1/2 top-0 bottom-0 w-0.5 bg-border lg:-translate-x-1/2" />

            {/* Phase Cards */}
            {phases.map((phase, index) => {
              const Icon = phase.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div
                  key={phase.id}
                  className={`relative flex items-center gap-6 mb-8 lg:mb-12 ${
                    isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Icon */}
                  <div className="absolute left-6 lg:left-1/2 lg:-translate-x-1/2 w-12 h-12 rounded-full bg-primary flex items-center justify-center z-10">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>

                  {/* Card */}
                  <div
                    className={`ml-20 lg:ml-0 lg:w-[calc(50%-3rem)] ${
                      isEven ? "lg:mr-auto lg:pr-8" : "lg:ml-auto lg:pl-8"
                    }`}
                  >
                    <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow">
                      <span className="text-secondary font-medium text-sm">
                        {phase.name}
                      </span>
                      <h3 className="mt-1 font-poppins font-semibold text-xl text-foreground">
                        {phase.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground text-sm">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
