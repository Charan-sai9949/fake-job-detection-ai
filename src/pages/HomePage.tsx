import { Link } from "react-router-dom";
import { Shield, ArrowRight, AlertTriangle, CheckCircle, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.png";

const stats = [
  { value: "2.8M+", label: "Fake Jobs Annually" },
  { value: "73%", label: "Students Targeted" },
  { value: "94%", label: "AI Accuracy" },
  { value: "50K+", label: "Scans Done" },
];

const features = [
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: "Red Flag Detection",
    desc: "AI identifies suspicious patterns: fake domains, unrealistic salaries, payment requests.",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: "Company Verification",
    desc: "Cross-references company registration databases and domain authenticity in real time.",
    color: "text-success",
    bg: "bg-success/10 border-success/20",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Risk Score",
    desc: "Get a 0–100% risk score in seconds with a detailed breakdown of all detected threats.",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Community Reports",
    desc: "Built on crowd-sourced scam reports and constantly updated blacklists.",
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              AI-Powered Job Offer Verification
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Verify Job & Internship{" "}
              <span className="text-primary text-glow">Offers</span>{" "}
              Before You Apply
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Thousands of students fall victim to fake job offers every year. Our AI analyzes job descriptions, 
              company details, and email domains to protect you from scams instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/check">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 gap-2 text-base font-semibold">
                  Check Offer Now <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="px-8 text-base border-border hover:bg-secondary">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-border glow-accent animate-float">
            <img src={heroBanner} alt="AI Security Shield" className="w-full h-64 object-cover object-center" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Students Trust <span className="text-primary">AIGuard</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our multi-layer AI detection system analyzes every aspect of a job offer to keep you safe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className={`glass rounded-xl p-6 border ${f.bg} hover:scale-105 transition-transform`}>
                <div className={`mb-4 ${f.color}`}>{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="glass rounded-2xl p-8 md:p-12 text-center border border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
            <div className="relative z-10">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse-glow" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Don't Be the Next Victim</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Paste your job description or upload a PDF — get your safety report in under 10 seconds.
              </p>
              <Link to="/check">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-10 gap-2 font-semibold">
                  Start Free Check <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
