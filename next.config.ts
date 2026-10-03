import "./src/env";

import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

import { env } from "./src/env";

export default withWorkflow({
  allowedDevOrigins: ["100.91.214.4"],
  distDir: env.NEXT_OUTPUT_DIR,
  typedRoutes: true,
  reactCompiler: true,
} satisfies NextConfig);
