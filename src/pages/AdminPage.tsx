import { useState } from "react";
import { Shield, Plus, Trash2, Search, AlertTriangle, Globe, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const initialBlacklist = [
  { id: 1, domain: "quickjobs247.tk", reason: "Free domain used for mass phishing", reports: 143 },
  { id: 2, domain: "hirefast.ml", reason: "Advance fee scam confirmed", reports: 89 },
  { id: 3, domain: "remotework.ga", reason: "No company registration found", reports: 212 },
  { id: 4, domain: "internships4u.cf", reason: "Collects personal data without legitimate use", reports: 57 },
];

const reportedScams = [
  { id: 1, company: "Global Interns Ltd", email: "hr@globalinterns.tk", risk: 89, date: "2024-03-15", flags: 4 },
  { id: 2, company: "Work From Home Co.", email: "jobs@wfhco.ml", risk: 95, date: "2024-03-14", flags: 6 },
  { id: 3, company: "FastHire", email: "careers@fasthire.ga", risk: 78, date: "2024-03-13", flags: 3 },
  { id: 4, company: "Unknown", email: "jobs@gmail.com", risk: 67, date: "2024-03-12", flags: 2 },
];

export default function AdminPage() {
  const [blacklist, setBlacklist] = useState(initialBlacklist);
  const [newDomain, setNewDomain] = useState("");
  const [newReason, setNewReason] = useState("");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const addDomain = () => {
    if (!newDomain.trim()) return;
    setBlacklist((prev) => [...prev, { id: Date.now(), domain: newDomain, reason: newReason || "Manual entry", reports: 1 }]);
    setNewDomain("");
    setNewReason("");
    toast({ title: "Domain blacklisted", description: `${newDomain} added to blacklist.` });
  };

  const removeDomain = (id: number) => {
    setBlacklist((prev) => prev.filter((d) => d.id !== id));
    toast({ title: "Domain removed", description: "Domain removed from blacklist." });
  };

  const filtered = blacklist.filter(
    (d) => d.domain.toLowerCase().includes(search.toLowerCase()) || d.reason.toLowerCase().includes(search.toLowerCase())
  );

  const totalScans = 50243;
  const blockedToday = 127;
  const avgRisk = 72;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage blacklists and view reported scams</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Scans", value: totalScans.toLocaleString(), icon: <BarChart3 className="w-4 h-4" />, color: "text-primary" },
            { label: "Blocked Today", value: blockedToday, icon: <Shield className="w-4 h-4" />, color: "text-destructive" },
            { label: "Avg Risk Score", value: `${avgRisk}%`, icon: <AlertTriangle className="w-4 h-4" />, color: "text-warning" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 border border-border text-center">
              <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Add to Blacklist */}
        <div className="glass rounded-xl p-6 border border-border mb-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" /> Add Domain to Blacklist
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g. scamdomain.tk"
              className="bg-secondary/50 border-border focus:border-primary"
            />
            <Input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Reason (optional)"
              className="bg-secondary/50 border-border focus:border-primary"
            />
          </div>
          <Button onClick={addDomain} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" /> Blacklist Domain
          </Button>
        </div>

        {/* Blacklist Table */}
        <div className="glass rounded-xl p-6 border border-border mb-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Blacklisted Domains ({filtered.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search domains..."
                className="pl-9 bg-secondary/50 border-border w-56 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-destructive">{item.domain}</div>
                  <div className="text-xs text-muted-foreground truncate">{item.reason}</div>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className="text-xs text-muted-foreground hidden sm:block">{item.reports} reports</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeDomain(item.id)}
                    className="w-8 h-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reported Scams */}
        <div className="glass rounded-xl p-6 border border-border">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-warning" /> Recently Reported Scams
          </h2>
          <div className="space-y-2">
            {reportedScams.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.company}</div>
                  <div className="text-xs text-muted-foreground font-mono">{item.email}</div>
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className={`text-sm font-bold ${item.risk >= 65 ? "text-destructive" : "text-warning"}`}>{item.risk}%</div>
                    <div className="text-xs text-muted-foreground">{item.flags} flags</div>
                  </div>
                  <span className="text-xs text-muted-foreground hidden md:block">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
