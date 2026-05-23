import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  QrCode,
  ScanLine,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const GLASS =
  "bg-[var(--color-bg-surface)] backdrop-blur-md border border-[var(--color-border-subtle)] rounded-xl";

type ParsedMedicine = {
  id?: string;
  name?: string;
  dosage?: string;
  expiryDate?: string;
};

export default function QRScannerPage() {
  const [rawJson, setRawJson] = useState("");
  const [parsed, setParsed] = useState<ParsedMedicine | null>(null);
  const [error, setError] = useState("");
  const [cameraRequested, setCameraRequested] = useState(false);
  const manualSectionRef = useRef<HTMLDivElement>(null);

  const handleCameraScan = async () => {
    setCameraRequested(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately — we just needed to check permission
      for (const track of stream.getTracks()) track.stop();
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        toast.error("Camera access denied — use the manual paste option below");
        manualSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        toast.error(
          "Unable to access camera. Use the manual paste option below.",
        );
        manualSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } finally {
      setCameraRequested(false);
    }
  };

  const handleParse = () => {
    setError("");
    setParsed(null);
    try {
      const obj = JSON.parse(rawJson.trim()) as ParsedMedicine;
      if (!obj.name && !obj.id) {
        setError("No medicine data found in the JSON.");
        return;
      }
      setParsed(obj);
    } catch {
      setError("Invalid JSON. Please paste valid QR code data.");
    }
  };

  return (
    <div
      className="p-6 space-y-6 max-w-2xl mx-auto"
      data-ocid="qr-scanner.page"
    >
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <QrCode size={22} className="text-primary" />
          QR Code Scanner
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan a medicine QR code to view its details
        </p>
      </div>

      {/* Scanner viewfinder */}
      <div className={cn(GLASS, "p-6 flex flex-col items-center gap-4")}>
        <p className="text-sm font-medium text-muted-foreground self-start">
          Camera Scanner
        </p>
        <div className="relative w-52 h-52 rounded-2xl border-2 border-dashed border-primary/40 flex items-center justify-center bg-[var(--color-bg-surface)]">
          {/* Corner accents */}
          <span className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl-sm" />
          <span className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr-sm" />
          <span className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl-sm" />
          <span className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br-sm" />
          {/* Scan line animation */}
          <ScanLine size={36} className="text-primary/60 animate-pulse" />
          <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-primary/70 to-transparent animate-bounce top-1/2" />
        </div>
        <button
          type="button"
          onClick={handleCameraScan}
          disabled={cameraRequested}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-sm font-medium text-foreground disabled:opacity-50"
          data-ocid="qr-scanner.camera_button"
        >
          <Camera size={15} className="text-primary shrink-0" />
          {cameraRequested ? "Requesting camera…" : "Try Camera Scanner"}
        </button>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Camera size={15} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            Camera scanning requests permission. If denied, use the manual paste
            below.
          </p>
        </div>
      </div>

      {/* Manual input */}
      <div ref={manualSectionRef} className={cn(GLASS, "p-5 space-y-4")}>
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Or paste QR data (JSON)
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Copy the JSON data from a MediVault QR code and paste it here.
          </p>
          <Textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder={
              '{ "id": "med-001", "name": "Aspirin", "dosage": "75mg", "expiryDate": "1767052800000" }'
            }
            className="font-mono text-xs min-h-[100px] resize-none"
            data-ocid="qr-scanner.textarea"
          />
        </div>

        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            data-ocid="qr-scanner.error_state"
          >
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        <Button
          type="button"
          className="w-full gap-2"
          onClick={handleParse}
          disabled={!rawJson.trim()}
          data-ocid="qr-scanner.submit_button"
        >
          <ScanLine size={15} />
          Parse QR Data
        </Button>
      </div>

      {/* Result */}
      {parsed && (
        <div
          className={cn(
            GLASS,
            "p-5 border-emerald-500/20 bg-emerald-500/5 space-y-3",
          )}
          data-ocid="qr-scanner.success_state"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-foreground">Medicine Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { label: "Medicine Name", value: parsed.name ?? "—" },
                { label: "Dosage", value: parsed.dosage ?? "—" },
                {
                  label: "Expiry Date",
                  value: parsed.expiryDate
                    ? new Date(Number(parsed.expiryDate)).toLocaleDateString()
                    : "—",
                },
                { label: "Medicine ID", value: parsed.id ?? "—" },
              ] as { label: string; value: string }[]
            ).map((field) => (
              <div
                key={field.label}
                className="bg-[var(--color-bg-surface)] rounded-lg p-3 border border-[var(--color-border-subtle)]"
              >
                <p className="text-xs text-muted-foreground mb-0.5">
                  {field.label}
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
