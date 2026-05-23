import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { useLabReports, useReportMutation } from "@/hooks/useBackend";
import { validateFile } from "@/hooks/useFormValidation";
import { cn } from "@/lib/utils";
import type { Report } from "@/types";
import {
  ExternalLink,
  FileText,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const GLASS = "bg-card backdrop-blur-sm border border-border rounded-xl";

const REPORT_TYPES = [
  "Diagnostic",
  "Blood Test",
  "X-Ray",
  "MRI",
  "Other",
] as const;
type ReportType = (typeof REPORT_TYPES)[number];

function truncateId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export default function ReportsPage() {
  const { data: reports, isLoading } = useLabReports();
  const mutation = useReportMutation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [patientId, setPatientId] = useState("");
  const [reportType, setReportType] = useState<ReportType>("Diagnostic");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !patientId.trim()) {
      toast.error("Please select a file and enter a patient ID");
      return;
    }
    const validationError = validateFile(selectedFile, {
      maxMB: 5,
      allowedTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploading(true);
    try {
      const fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(selectedFile);
      });
      const res = await mutation.mutateAsync({
        patientId: patientId.trim(),
        fileUrl,
        reportType,
      });
      if (res.__kind__ === "ok") {
        toast.success("Report uploaded successfully");
        setPatientId("");
        setSelectedFile(null);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        toast.error(`Upload failed: ${res.err}`);
      }
    } catch {
      toast.error("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  const filtered = (reports ?? []).filter(
    (r: Report) =>
      !search.trim() ||
      r.patientId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold">
          Lab Reports <span className="gradient-text">🔬</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload and manage diagnostic reports
        </p>
      </motion.div>

      {/* Upload section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          GLASS,
          "p-5 border-dashed hover:border-teal-500/50 transition-colors",
        )}
      >
        <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Upload size={13} className="text-white" />
          </div>
          Upload New Report
        </h2>
        <form
          onSubmit={handleUpload}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div>
            <label
              htmlFor="lab-patient-id"
              className="text-xs font-semibold text-muted-foreground mb-1.5 block"
            >
              Patient ID
            </label>
            <input
              id="lab-patient-id"
              data-ocid="lab.report.patient_id_input"
              type="text"
              required
              placeholder="e.g. PAT-00142"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-teal-400/50 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="lab-report-type"
              className="text-xs font-semibold text-muted-foreground mb-1.5 block"
            >
              Report Type
            </label>
            <select
              id="lab-report-type"
              data-ocid="lab.report.type_select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-teal-400/50 transition-colors"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="lab-report-file"
              className="text-xs font-semibold text-muted-foreground mb-1.5 block"
            >
              File (PDF, JPG, PNG)
            </label>
            <div className="relative">
              <input
                ref={fileRef}
                id="lab-report-file"
                data-ocid="lab.report.upload_button"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.dcm"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground file:bg-teal-600 file:text-white file:border-0 file:rounded-md file:text-xs file:px-2 file:py-1 file:mr-2 outline-none"
              />
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              data-ocid="lab.report.submit_button"
              disabled={uploading || !selectedFile || !patientId.trim()}
              className="w-full py-2 bg-[var(--color-role-diagnostic)] hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload size={14} /> Upload
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className={cn(GLASS, "p-3 flex items-center gap-3")}
      >
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input
          data-ocid="lab.report.search_input"
          type="text"
          placeholder="Search by patient ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(GLASS, "overflow-hidden")}
      >
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Report ID</span>
          <span>Patient ID</span>
          <span>Type</span>
          <span>Date</span>
          <span>File</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title="No reports found"
            description="Upload your first diagnostic report using the form above."
            className="border-0 rounded-none"
          />
        ) : (
          <div>
            {filtered.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                data-ocid={`lab.report.item.${idx + 1}`}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0 items-center"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {truncateId(r.id)}
                </span>
                <span className="text-sm text-foreground truncate min-w-0">
                  {r.patientId}
                </span>
                <span className="badge-teal">{r.reportType}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(Number(r.uploadDate)).toLocaleDateString()}
                </span>
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[var(--color-role-patient)] hover:text-[var(--color-role-patient)]/80 dark:hover:text-[var(--color-role-patient)]/80 transition-colors"
                >
                  <ExternalLink size={12} /> View
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
