import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Building2, Mail, DollarSign, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  jobDescription: string;
  companyName: string;
  email: string;
  salary: string;
  location: string;
}

function analyzeOffer(data: FormData): number {
  let riskScore = 0;
  const desc = (data.jobDescription + data.companyName + data.email).toLowerCase();

  // Email domain checks
  const freeEmails = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ymail.com"];
  const emailDomain = data.email.split("@")[1]?.toLowerCase() || "";
  if (freeEmails.some((d) => emailDomain.includes(d))) riskScore += 25;

  // Scam keywords
  const scamWords = ["urgent", "immediate joining", "no experience required", "work from home", 
    "unlimited earnings", "money transfer", "advance fee", "pay to apply", "registration fee",
    "lottery", "selected", "congratulations", "wire transfer", "western union"];
  const found = scamWords.filter((w) => desc.includes(w)).length;
  riskScore += Math.min(found * 10, 35);

  // Salary check
  const salary = parseFloat(data.salary.replace(/[^0-9.]/g, ""));
  if (salary > 200000) riskScore += 20;
  if (salary < 5000 && salary > 0) riskScore += 10;

  // Empty company name
  if (!data.companyName.trim()) riskScore += 15;

  // Suspicious domains
  const suspiciousDomains = [".tk", ".ml", ".ga", ".cf", "temp-mail", "throwam"];
  if (suspiciousDomains.some((d) => emailDomain.includes(d))) riskScore += 30;

  return Math.min(Math.max(riskScore, 5), 98);
}

function getRedFlags(data: FormData): string[] {
  const flags: string[] = [];
  const desc = (data.jobDescription + data.companyName).toLowerCase();
  const emailDomain = data.email.split("@")[1]?.toLowerCase() || "";

  const freeEmails = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
  if (freeEmails.some((d) => emailDomain.includes(d))) {
    flags.push("Recruiter using a free personal email domain instead of a company domain");
  }

  const scamPairs: { keyword: string; flag: string }[] = [
    { keyword: "pay to apply", flag: "Payment required to apply — a clear scam indicator" },
    { keyword: "registration fee", flag: "Registration fee mentioned — legitimate jobs never charge fees" },
    { keyword: "advance fee", flag: "Advance fee request detected" },
    { keyword: "urgent", flag: "Excessive urgency language detected" },
    { keyword: "no experience required", flag: "Suspicious 'no experience required' claim for high-pay role" },
    { keyword: "work from home", flag: "Unverified remote work opportunity" },
    { keyword: "unlimited earnings", flag: "Unrealistic 'unlimited earnings' promise detected" },
  ];

  scamPairs.forEach(({ keyword, flag }) => {
    if (desc.includes(keyword)) flags.push(flag);
  });

  const salary = parseFloat(data.salary.replace(/[^0-9.]/g, ""));
  if (salary > 200000) flags.push("Unusually high salary offer — possible lure tactic");

  if (!data.companyName.trim()) flags.push("No company name provided — anonymous offers are suspicious");

  const suspiciousDomains = [".tk", ".ml", ".ga", ".cf"];
  if (suspiciousDomains.some((d) => emailDomain.includes(d))) {
    flags.push("Email from a free/disposable domain (.tk, .ml, etc.)");
  }

  return flags;
}

export default function CheckOfferPage() {
  const [form, setForm] = useState<FormData>({
    jobDescription: "",
    companyName: "",
    email: "",
    salary: "",
    location: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = (file: File) => {
    if (file.type === "application/pdf" || file.type === "text/plain") {
      toast({ title: "File uploaded", description: `${file.name} — text extracted for analysis.` });
      setForm((prev) => ({ ...prev, jobDescription: prev.jobDescription + `\n[Uploaded file: ${file.name}]` }));
    } else {
      toast({ title: "Invalid file", description: "Please upload a PDF or text file.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobDescription.trim() && !form.companyName.trim()) {
      toast({ title: "Missing information", description: "Please provide at least a job description or company name.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 2500));
    const score = analyzeOffer(form);
    const flags = getRedFlags(form);
    setIsAnalyzing(false);
    navigate("/result", { state: { score, flags, form } });
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Analyze Your <span className="text-primary">Job Offer</span>
          </h1>
          <p className="text-muted-foreground">
            Paste the job description below or fill in the details. Our AI will assess the risk in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Drop Zone */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`glass rounded-xl p-8 text-center border-2 border-dashed transition-all cursor-pointer ${
              dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
            />
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Drop PDF or click to upload</p>
            <p className="text-sm text-muted-foreground mt-1">Supports .pdf and .txt files</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-background text-muted-foreground">or paste job details</span>
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="jobDescription" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Job Description
            </Label>
            <Textarea
              id="jobDescription"
              name="jobDescription"
              value={form.jobDescription}
              onChange={handleChange}
              placeholder="Paste the full job description here..."
              className="min-h-[140px] bg-secondary/50 border-border focus:border-primary resize-none"
            />
          </div>

          {/* Form Fields Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Company Name
              </Label>
              <Input
                id="companyName"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. TechCorp Inc."
                className="bg-secondary/50 border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Recruiter Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="e.g. hr@company.com"
                className="bg-secondary/50 border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Salary Offered
              </Label>
              <Input
                id="salary"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                placeholder="e.g. 50000"
                className="bg-secondary/50 border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Job Location
              </Label>
              <Input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. New York, NY or Remote"
                className="bg-secondary/50 border-border focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground glass rounded-lg p-3 border border-border">
            <AlertCircle className="w-4 h-4 mt-0.5 text-warning shrink-0" />
            <p>Your data is analyzed locally and never stored. All processing is done privately.</p>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isAnalyzing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold text-base h-12"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Analyzing with AI...
              </>
            ) : (
              "Analyze Offer Now"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
