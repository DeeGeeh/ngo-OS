import "./src/env";

import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

import { env } from "./src/env";

export default withWorkflow({
  distDir: env.NEXT_OUTPUT_DIR,
  typedRoutes: true,
  reactCompiler: true,
} satisfies NextConfig);
