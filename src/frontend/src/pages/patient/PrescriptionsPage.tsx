import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMedicines } from "@/hooks/useBackend";
import { validateFile } from "@/hooks/useFormValidation";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  FileText,
  Lock,
  ScanLine,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const isImage = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);

export default function PrescriptionsPage() {
  const { data: medicines = [], isLoading } = useMyMedicines();
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  type RxFilter = "All" | "Uploaded" | "NotUploaded";
  const [rxFilter, setRxFilter] = useState<RxFilter>("All");

  const medicinesWithRx = medicines.filter((m) => m.prescriptionUrl);

  const RX_PILLS: { value: RxFilter; label: string }[] = [
    { value: "All", label: "All" },
    { value: "Uploaded", label: "Uploaded" },
    { value: "NotUploaded", label: "Not Uploaded" },
  ];

  const filteredMedicines = medicines.filter((m) => {
    if (rxFilter === "Uploaded") return !!m.prescriptionUrl;
    if (rxFilter === "NotUploaded") return !m.prescriptionUrl;
    return true;
  });

  const displayedList =
    rxFilter === "All"
      ? medicinesWithRx
      : filteredMedicines.filter((m) =>
          rxFilter === "Uploaded" ? !!m.prescriptionUrl : !m.prescriptionUrl,
        );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateFile(file, {
      maxMB: 5,
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
      ],
    });
    if (validationError) {
      toast.error(validationError);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setSelectedFileName(file.name);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedMedId || !actor) {
      toast.error("Select a medicine and file first");
      return;
    }
    // Re-validate on submit in case state is stale
    const validationError = validateFile(selectedFile, {
      maxMB: 5,
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
      ],
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.onprogress = (e) => {
          if (e.lengthComputable)
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        reader.readAsDataURL(selectedFile);
      });
      const res = await actor.updateMedicinePrescriptionUrl(
        selectedMedId,
        dataUrl,
      );
      if (res.__kind__ === "ok") {
        toast.success("Prescription uploaded successfully");
        qc.invalidateQueries({ queryKey: ["medicines"] });
        setSelectedFile(null);
        setSelectedFileName("");
        setPreviewUrl(null);
        setSelectedMedId("");
        if (fileRef.current) fileRef.current.value = "";
      } else {
        toast.error(`Upload failed: ${res.err}`);
      }
    } catch {
      toast.error("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePrescription = async (medId: string) => {
    if (!actor) return;
    try {
      const res = await actor.updateMedicinePrescriptionUrl(medId, "");
      if (res.__kind__ === "ok") {
        toast.success("Prescription removed");
        qc.invalidateQueries({ queryKey: ["medicines"] });
      } else {
        toast.error(`Failed to remove prescription: ${res.err}`);
      }
    } catch {
      toast.error("Failed to remove prescription. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6" data-ocid="prescriptions.page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload and manage your prescription documents
        </p>
      </div>

      {/* Upload Card */}
      <div className="glassmorphism border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Upload size={16} className="text-primary" /> Upload Prescription
        </h2>

        <div>
          <Label htmlFor="medicine-select-rx">Medicine</Label>
          <Select value={selectedMedId} onValueChange={setSelectedMedId}>
            <SelectTrigger
              id="medicine-select-rx"
              className="mt-1"
              data-ocid="prescriptions.select"
            >
              <SelectValue placeholder="Select medicine..." />
            </SelectTrigger>
            <SelectContent>
              {medicines.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} — {m.dosage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="prescription-file">Prescription File</Label>
          <button
            type="button"
            className="mt-1 w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => fileRef.current?.click()}
            aria-label="Upload prescription file"
            data-ocid="prescriptions.dropzone"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-40 rounded-lg object-contain"
              />
            ) : (
              <>
                <FileText size={32} className="text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {selectedFileName || "Click to select prescription file"}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  JPG, PNG, PDF supported
                </p>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            id="prescription-file"
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {uploading && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || !selectedMedId || uploading}
          className="w-full gap-2"
          data-ocid="prescriptions.upload_button"
        >
          {uploading
            ? `Uploading ${uploadProgress}%...`
            : "Upload Prescription"}
        </Button>
      </div>

      {/* Prescriptions List */}
      <div className="glassmorphism border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-semibold text-foreground">Prescriptions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {medicinesWithRx.length} of {medicines.length} medicines have
                prescriptions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RX_PILLS.map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setRxFilter(pill.value)}
                data-ocid={`prescriptions.filter.${pill.value.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  rxFilter === pill.value
                    ? "gradient-brand text-white shadow-md"
                    : "bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-muted-foreground hover:text-foreground hover:bg-[var(--color-bg-elevated)]"
                }`}
              >
                {pill.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground self-center">
              Showing {displayedList.length} of {medicines.length} medicines
            </span>
          </div>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : displayedList.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14"
            data-ocid="prescriptions.empty_state"
          >
            <FileText size={36} className="text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              {rxFilter === "NotUploaded"
                ? "All medicines have prescriptions uploaded"
                : rxFilter === "Uploaded"
                  ? "No prescriptions uploaded yet"
                  : "No medicines found"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayedList.map((med, idx) => (
              <div
                key={med.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
                data-ocid={`prescriptions.item.${idx + 1}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {med.prescriptionUrl && isImage(med.prescriptionUrl) ? (
                    <img
                      src={med.prescriptionUrl}
                      alt={med.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <FileText size={18} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {med.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {med.dosage} · {med.category}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="badge-success">Uploaded</Badge>
                  {med.prescriptionUrl && (
                    <a
                      href={med.prescriptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="View prescription"
                      data-ocid={`prescriptions.view_link.${idx + 1}`}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePrescription(med.id)}
                    className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Remove prescription"
                    data-ocid={`prescriptions.delete_button.${idx + 1}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase 2 Placeholder */}
      <div className="glassmorphism border border-border rounded-xl p-5 opacity-70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
            <Lock size={16} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">
                OCR Prescription Parsing
              </p>
              <Badge className="badge-purple">Coming Soon</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically extract medicine details from prescription images
              using AI
            </p>
          </div>
          <ScanLine size={18} className="text-muted-foreground/40 shrink-0" />
        </div>
      </div>
    </div>
  );
}
