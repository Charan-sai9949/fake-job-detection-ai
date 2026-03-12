import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Building2, Mail, DollarSign, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { analyzeOfferWithAPI, type FormData } from "@/lib/analysis";

export default function CheckOfferPage() {
  const [form, setForm] = useState<FormData>({
    jobDescription: "", companyName: "", email: "", salary: "", location: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = (file: File) => {
    const validTypes = ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const validExtensions = file.name.endsWith(".pdf") || file.name.endsWith(".txt") || file.name.endsWith(".doc") || file.name.endsWith(".docx");
    
    if (validTypes.includes(file.type) || validExtensions) {
      toast({ title: "File uploaded", description: `${file.name} — ready for analysis.` });
      setUploadedFile(file);
      setUploadedFileName(file.name);
    } else {
      toast({ title: "Invalid file", description: "Please upload a PDF, Word document, or text file.", variant: "destructive" });
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setUploadedFileName("");
    toast({ title: "File cleared", description: "Ready to upload a new file or continue with manual entry." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobDescription.trim() && !form.companyName.trim() && !uploadedFile) {
      toast({ title: "Missing information", description: "Please provide at least a job description, company name, or upload a file.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    try {
      // Create FormData for backend - MUST use FormData, not JSON
      const formData = new FormData();
      
      // Append file if present
      if (uploadedFile) {
        console.log("[DEBUG] Appending file to FormData:", uploadedFile.name, uploadedFile.type);
        formData.append("pdf", uploadedFile);
      }
      
      // Append form fields - always
      formData.append("jobDescription", form.jobDescription);
      formData.append("email", form.email);
      formData.append("companyName", form.companyName);
      formData.append("salary", form.salary);
      formData.append("location", form.location);

      console.log("[DEBUG] Sending FormData to backend:", {
        hasFile: uploadedFile ? uploadedFile.name : "no file",
        jobDescription: form.jobDescription.substring(0, 50) + "...",
        email: form.email,
        companyName: form.companyName,
      });
      
      const result = await analyzeOfferWithAPI(formData);
      setIsAnalyzing(false);
      navigate("/result", { state: { ...result, form } });
    } catch (error) {
      setIsAnalyzing(false);
      console.error("[ERROR] Analysis error:", error);
      toast({ 
        title: "Analysis failed", 
        description: `Unable to analyze the offer. Error: ${error instanceof Error ? error.message : "Unknown error"}. Please check the backend server is running on port 5000.`, 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10 animate-slide-up" style={{ animationFillMode: "both" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium mb-4 animate-border-glow">
            ML-Powered Analysis Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Analyze Your <span className="text-primary text-glow">Job Offer</span>
          </h1>
          <p className="text-muted-foreground">
            Paste the job description below or fill in the details. Our ML ensemble model assesses the risk in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up delay-200" style={{ animationFillMode: "both" }}>
          <div
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`glass rounded-xl p-8 text-center border-2 border-dashed transition-all cursor-pointer ${dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input id="file-input" type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Drop files or click to upload</p>
            <p className="text-sm text-muted-foreground mt-1">Supports .pdf, .doc, .docx, and .txt files</p>
          </div>

          {uploadedFileName && (
            <div className="glass rounded-lg p-4 border border-success/30 bg-success/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">📄 File uploaded</p>
                  <p className="text-xs text-muted-foreground">{uploadedFileName}</p>
                </div>
              </div>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={handleClearFile}
                className="text-muted-foreground hover:text-destructive"
              >
                ✕
              </Button>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-background text-muted-foreground">or paste job details</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Job Description
            </Label>
            <Textarea id="jobDescription" name="jobDescription" value={form.jobDescription} onChange={handleChange}
              placeholder="Paste the full job description here..." className="min-h-[140px] bg-secondary/50 border-border focus:border-primary resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Company Name</Label>
              <Input id="companyName" name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. TechCorp Inc." className="bg-secondary/50 border-border focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Recruiter Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="e.g. hr@company.com" className="bg-secondary/50 border-border focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary" className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Salary Offered (₹)</Label>
              <Input id="salary" name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. 50000" className="bg-secondary/50 border-border focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Job Location</Label>
              <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Bangalore or Remote" className="bg-secondary/50 border-border focus:border-primary" />
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground glass rounded-lg p-3 border border-border">
            <AlertCircle className="w-4 h-4 mt-0.5 text-warning shrink-0" />
            <p>Your data is analyzed by our ML model. Sensitive data is not stored permanently.</p>
          </div>

          <Button type="submit" size="lg" disabled={isAnalyzing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold text-base h-12">
            {isAnalyzing ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" />Analyzing with AI...</>) : "Analyze Offer Now"}
          </Button>
        </form>
      </div>
    </div>
  );
}
