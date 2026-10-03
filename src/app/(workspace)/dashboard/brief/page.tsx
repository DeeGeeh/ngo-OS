import type { Metadata } from "next";
import { DailyBrief } from "../_components/daily-brief";

export const metadata: Metadata = { title: "Daily brief | Nest" };

export default function BriefPage() {
  return (
    <div className="mx-auto w-full max-w-md p-6">
      <DailyBrief />
    </div>
  );
}
