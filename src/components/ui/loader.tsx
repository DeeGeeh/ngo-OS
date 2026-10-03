import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type LoaderProps = Omit<ComponentPropsWithoutRef<"svg">, "children"> & {
  size?: number;
};

export function Loader({ className, size = 20, ...props }: LoaderProps) {
  const labelled = props["aria-label"] !== undefined;

  return (
    <svg
      {...props}
      aria-hidden={labelled ? undefined : (props["aria-hidden"] ?? true)}
      className={cn("inline-block shrink-0", className)}
      fill="none"
      height={size}
      role={labelled ? "status" : "presentation"}
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 20 20"
      width={size}
    >
      <rect height="17.5" opacity="0.2" rx="4" width="17.5" x="1.25" y="1.25" />
      <rect
        className="loader-trace"
        height="17.5"
        rx="4"
        strokeDasharray="16 47.1327412287"
        strokeLinecap="round"
        width="17.5"
        x="1.25"
        y="1.25"
      />
    </svg>
  );
}
