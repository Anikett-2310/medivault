"use client";
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function ShaderShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseEnter = () => setIsActive(true);
    const handleMouseLeave = () => setIsActive(false);
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  // Suppress unused warning
  void isActive;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--color-bg-base)] relative overflow-hidden"
    >
      <svg aria-hidden="true" className="absolute inset-0 w-0 h-0">
        <defs>
          <filter
            id="glass-effect"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feTurbulence baseFrequency="0.005" numOctaves={1} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={0.3} />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02  0 1 0 0 0.02  0 0 1 0 0.05  0 0 0 0.9 0"
              result="tint"
            />
          </filter>
          <filter
            id="gooey-filter"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={4} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
          <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient
            id="logo-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="oklch(0.68 0.24 200)" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="oklch(0.55 0.22 245)" />
          </linearGradient>
          <linearGradient
            id="hero-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="oklch(0.68 0.24 200)" />
            <stop offset="70%" stopColor="oklch(0.72 0.22 75)" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={2} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={[
          "#000000",
          "oklch(0.68 0.24 200)",
          "oklch(0.55 0.22 245)",
          "oklch(0.25 0.06 220)",
          "oklch(0.72 0.22 75)",
        ]}
        speed={0.3}
      />
      <MeshGradient
        className="absolute inset-0 w-full h-full opacity-60"
        colors={[
          "#000000",
          "#ffffff",
          "oklch(0.68 0.24 200)",
          "oklch(0.72 0.22 75)",
        ]}
        speed={0.2}
      />

      <header className="relative z-20 flex items-center justify-between p-6">
        <motion.div
          className="flex items-center group cursor-pointer"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <span className="text-[var(--color-text-primary)] font-bold text-xl tracking-tight">
            MediVault
          </span>
        </motion.div>

        <nav className="flex items-center space-x-2">
          <a
            href="#features"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-light px-3 py-2 rounded-full hover:bg-[var(--color-bg-muted)] transition-all duration-200"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-light px-3 py-2 rounded-full hover:bg-[var(--color-bg-muted)] transition-all duration-200"
          >
            About
          </a>
          <a
            href="#contact"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-light px-3 py-2 rounded-full hover:bg-[var(--color-bg-muted)] transition-all duration-200"
          >
            Contact
          </a>
        </nav>
      </header>

      <main className="absolute bottom-8 left-8 z-20 max-w-2xl">
        <div className="text-left">
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--color-bg-surface)] backdrop-blur-sm mb-6 relative border border-[var(--color-border-subtle)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent rounded-full" />
            <span className="text-[var(--color-text-primary)] text-sm font-medium relative z-10 tracking-wide">
              Smart Medicine Lifecycle Management
            </span>
          </motion.div>

          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-bold text-[var(--color-text-primary)] mb-6 leading-none tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.span
              className="block font-light text-[var(--color-text-primary)] text-4xl md:text-5xl lg:text-6xl mb-2 tracking-wider"
              style={{
                background:
                  "linear-gradient(135deg, #ffffff 0%, oklch(0.68 0.24 200) 30%, oklch(0.72 0.22 75) 70%, #ffffff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Secure
            </motion.span>
            <span className="block font-black text-[var(--color-text-primary)] drop-shadow-2xl">
              Medicine
            </span>
            <span className="block font-light text-[var(--color-text-secondary)] italic">
              Lifecycle
            </span>
          </motion.h1>

          <motion.p
            className="text-lg font-light text-[var(--color-text-tertiary)] mb-8 leading-relaxed max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Decentralized medicine management on the Internet Computer. Track
            prescriptions, manage inventory, and ensure medication adherence —
            all secured on-chain.
          </motion.p>

          <motion.div
            className="flex items-center gap-6 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <motion.button
              type="button"
              className="px-10 py-4 rounded-full bg-transparent border-2 border-[var(--color-border-base)] text-[var(--color-text-primary)] font-medium text-sm transition-all duration-300 hover:bg-[var(--color-bg-muted)] hover:border-cyan-400/50 hover:text-[var(--color-accent-primary)] cursor-pointer backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                window.location.href = "#features";
              }}
            >
              Learn More
            </motion.button>
            <motion.button
              type="button"
              className="px-10 py-4 rounded-full bg-[var(--color-accent-primary)] text-white font-semibold text-sm transition-all duration-300 hover:opacity-90 cursor-pointer shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Get Started
            </motion.button>
          </motion.div>
        </div>
      </main>

      <div className="absolute bottom-8 right-8 z-30">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <PulsingBorder
            colors={[
              "oklch(0.68 0.24 200)",
              "oklch(0.55 0.22 245)",
              "oklch(0.72 0.22 75)",
              "#00FF88",
              "#FFD700",
              "#FF6B35",
              "#ffffff",
            ]}
            colorBack="#00000000"
            speed={1.5}
            roundness={1}
            thickness={0.1}
            softness={0.2}
            intensity={5}
            spotSize={0.1}
            pulse={0.1}
            smoke={0.5}
            smokeSize={4}
            scale={0.65}
            rotation={0}
            style={{ width: "60px", height: "60px", borderRadius: "50%" }}
          />
          <motion.svg
            aria-hidden="true"
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{ transform: "scale(1.6)" }}
          >
            <defs>
              <path
                id="hero-circle"
                d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
              />
            </defs>
            <text
              className="fill-[var(--color-text-secondary)] font-medium"
              fontSize={6}
            >
              <textPath href="#hero-circle" startOffset="0%">
                MediVault • Secure • Decentralized • On-Chain •
              </textPath>
            </text>
          </motion.svg>
        </div>
      </div>
    </div>
  );
}
