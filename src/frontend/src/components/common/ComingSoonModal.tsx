import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  features?: string[];
  badge?: string;
}

export function ComingSoonModal({
  open,
  onClose,
  title,
  description,
  features = [],
  badge = "Coming Soon",
}: ComingSoonModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          data-ocid="coming_soon.dialog"
        >
          <motion.div
            className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Decorative orb */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              data-ocid="coming_soon.close_button"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--color-bg-muted)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 mb-1">
                  {badge}
                </span>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {title}
                </h2>
              </div>
            </div>

            <p className="text-muted-foreground text-sm mb-5">{description}</p>

            {features.length > 0 && (
              <ul className="space-y-2 mb-6">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full gradient-brand flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            <Button
              onClick={onClose}
              className="w-full btn-gradient-glow text-white"
              data-ocid="coming_soon.confirm_button"
            >
              Got it — notify me when it launches!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ComingSoonCardProps {
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ComingSoonCard({
  title,
  description,
  badge = "Coming Soon",
  icon,
  onClick,
  className,
}: ComingSoonCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid="coming_soon.card"
      className={cn(
        "glass-card rounded-2xl p-5 text-left w-full relative overflow-hidden group",
        "border-dashed transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-start gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-sm font-bold text-foreground">
              {title}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {badge}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
