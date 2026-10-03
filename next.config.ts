import "./src/env";

import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

export default withWorkflow({} satisfies NextConfig);
