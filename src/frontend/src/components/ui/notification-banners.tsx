import React from "react";

export function WarningNotification({
  message = "Oops! Something went terribly wrong.",
  onClose,
}: {
  message?: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-center justify-between max-w-80 w-full bg-red-600/20 text-red-600 px-3 h-10 rounded-sm">
      <div className="flex items-center">
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 14.167q.354 0 .593-.24.24-.24.24-.594a.8.8 0 0 0-.24-.593.8.8 0 0 0-.594-.24.8.8 0 0 0-.593.24.8.8 0 0 0-.24.593q0 .354.24.594t.593.24m-.834-3.334h1.667v-5H9.166zm.833 7.5a8.1 8.1 0 0 1-3.25-.656 8.4 8.4 0 0 1-2.645-1.781 8.4 8.4 0 0 1-1.782-2.646A8.1 8.1 0 0 1 1.666 10q0-1.73.656-3.25a8.4 8.4 0 0 1 1.782-2.646 8.4 8.4 0 0 1 2.645-1.781A8.1 8.1 0 0 1 10 1.667q1.73 0 3.25.656a8.4 8.4 0 0 1 2.646 1.781 8.4 8.4 0 0 1 1.781 2.646 8.1 8.1 0 0 1 .657 3.25 8.1 8.1 0 0 1-.657 3.25 8.4 8.4 0 0 1-1.78 2.646 8.4 8.4 0 0 1-2.647 1.781 8.1 8.1 0 0 1-3.25.656"
            fill="currentColor"
          />
        </svg>
        <p className="text-sm ml-2">{message}</p>
      </div>
      <button
        type="button"
        aria-label="close"
        className="active:scale-90 transition-all ml-2"
        onClick={onClose}
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 5 5 15M5 5l10 10"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export function SuccessNotification({
  message = "Success! Your task is fully completed.",
  onClose,
}: {
  message?: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-center justify-between text-blue-600 max-w-80 w-full bg-blue-600/10 h-10 shadow">
      <div className="h-full w-1.5 bg-blue-600" />
      <div className="flex items-center flex-1 px-2">
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            style={{
              fill: "none",
              stroke: "currentColor",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 1.95,
            }}
            d="M11.95 16.5h.1"
          />
          <path
            d="M3 12a9 9 0 0 1 9-9h0a9 9 0 0 1 9 9h0a9 9 0 0 1-9 9h0a9 9 0 0 1-9-9m9 0V7"
            style={{
              fill: "none",
              stroke: "currentColor",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 1.5,
            }}
          />
        </svg>
        <p className="text-sm ml-2">{message}</p>
      </div>
      <button
        type="button"
        aria-label="close"
        className="active:scale-90 transition-all mr-3"
        onClick={onClose}
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 5L5 15M5 5L15 15"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export function SuccessToastNotification({
  title = "Successfully saved!",
  description = "Anyone with a link can now view this file.",
  onClose,
}: {
  title?: string;
  description?: string;
  onClose?: () => void;
}) {
  return (
    <div className="bg-card inline-flex space-x-3 p-3 text-sm rounded border border-border shadow-sm">
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16.5 8.31V9a7.5 7.5 0 1 1-4.447-6.855M16.5 3 9 10.508l-2.25-2.25"
          stroke="#22C55E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <h3 className="text-foreground font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        aria-label="close"
        className="inline-flex active:scale-95 transition"
        onClick={onClose}
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="12.532"
            width="17.498"
            height="2.1"
            rx="1.05"
            transform="rotate(-45.74 0 12.532)"
            fill="#7d838b"
            fillOpacity=".7"
          />
          <rect
            x="12.531"
            y="13.914"
            width="17.498"
            height="2.1"
            rx="1.05"
            transform="rotate(-135.74 12.531 13.914)"
            fill="#7d838b"
            fillOpacity=".7"
          />
        </svg>
      </button>
    </div>
  );
}
