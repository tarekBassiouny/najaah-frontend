"use client";

import { use } from "react";
import { AgentExecutionDetails } from "@/features/agents/components/AgentExecutionDetails";

type AgentExecutionDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default function AgentExecutionDetailsPage({
  params,
}: AgentExecutionDetailsPageProps) {
  const { id } = use(params);
  return <AgentExecutionDetails executionId={id} />;
}
