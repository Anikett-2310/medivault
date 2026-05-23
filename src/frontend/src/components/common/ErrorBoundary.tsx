import { RefreshCw } from "lucide-react";
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Intentional production logging — error boundaries need this for production debugging/monitoring
    console.error("[MediVault ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[40vh] flex items-center justify-center p-8">
          <div
            className="max-w-sm w-full bg-card border border-border rounded-2xl p-8 shadow-2xl text-center space-y-5"
            data-ocid="error_boundary.panel"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-status-danger)]/20 border border-[var(--color-status-danger)]/30 flex items-center justify-center">
              <RefreshCw
                size={24}
                className="text-[var(--color-status-danger)]"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                An unexpected error occurred in this section. Your data is safe.
              </p>
              {this.state.error?.message && (
                <p className="text-xs font-mono text-[var(--color-status-danger)] bg-[var(--color-status-danger)]/10 border border-[var(--color-status-danger)]/20 rounded-lg px-3 py-2 break-words">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--color-accent-teal)] to-[var(--color-role-hospital)] hover:from-[var(--color-accent-teal)] hover:to-[var(--color-role-hospital)] text-white transition-all duration-200 shadow-lg"
              data-ocid="error_boundary.refresh_button"
            >
              <RefreshCw size={14} />
              Refresh Section
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
