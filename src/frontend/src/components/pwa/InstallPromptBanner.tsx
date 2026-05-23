import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("medivault:install-dismissed") === "1",
  );
  const [installing, setInstalling] = useState(false);
  const [isStandalone] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches,
  );

  useEffect(() => {
    if (isStandalone) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      // Keep showing "Installing..." then hide
      setTimeout(() => setDeferredPrompt(null), 1500);
    } else {
      setDismissed(true);
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("medivault:install-dismissed", "1");
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed || isStandalone) return null;

  return (
    <div
      role="banner"
      data-ocid="install.prompt.banner"
      className="fixed bottom-4 left-4 right-4 z-50
        md:left-auto md:right-4 md:bottom-auto md:top-4 md:w-80
        flex items-center gap-3 px-4 py-3
        bg-card/90 backdrop-blur-xl border border-[var(--color-border-subtle)]
        rounded-2xl shadow-2xl"
      style={{
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-role-hospital)] to-[var(--color-accent-teal)]
          flex items-center justify-center flex-shrink-0 shadow-lg"
      >
        <Download size={18} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          Install MediVault
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {installing
            ? "Installing..."
            : "Add to home screen for the best experience"}
        </p>
      </div>

      {!installing && (
        <>
          <button
            type="button"
            onClick={handleInstall}
            data-ocid="install.prompt.install.button"
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold
              bg-gradient-to-r from-[var(--color-role-hospital)] to-[var(--color-accent-teal)] text-white
              hover:from-[var(--color-role-hospital)] hover:to-[var(--color-accent-teal)]
              transition-all duration-200 touch-target"
            aria-label="Install MediVault app"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            data-ocid="install.prompt.dismiss.button"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center
              rounded-full text-muted-foreground hover:text-foreground
              hover:bg-[var(--color-bg-muted)] transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
}

export default InstallPromptBanner;
