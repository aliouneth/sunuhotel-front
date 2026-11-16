"use client";

import { useId, useRef, useState } from "react";

/**
 * Minimal, dependency-free anti-spam guard for public forms.
 *
 * Two cheap signals are combined:
 * - a honeypot field that humans never see (bots that autofill every input
 *   will fill it);
 * - a time trap rejecting submissions sent within `minSeconds` of mount.
 *
 * This is a first line of defence only: the API also applies IP throttling.
 */
export function useSpamGuard(minSeconds = 3) {
  const mountedAt = useRef(Date.now());
  const [honeypot, setHoneypot] = useState("");

  function isSpam(): boolean {
    return (
      honeypot.trim().length > 0 ||
      Date.now() - mountedAt.current < minSeconds * 1000
    );
  }

  return { honeypot, setHoneypot, isSpam };
}

export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div
      className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
      aria-hidden="true"
    >
      <label htmlFor={id}>Ne pas remplir ce champ</label>
      <input
        id={id}
        name="company_website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
