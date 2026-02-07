"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAvailableAgents,
  useExecuteAgent,
} from "../hooks/use-agent-executions";
import { AGENT_TYPE_LABELS } from "../types/agent";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { useTenant } from "@/app/tenant-provider";

type ExecuteAgentDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onExecuted?: (_executionId: string | number) => void;
};

function prettify(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ExecuteAgentDialog({
  open,
  onOpenChange,
  onExecuted,
}: ExecuteAgentDialogProps) {
  const { data: availableAgents = [], isLoading: isLoadingAgents } =
    useAvailableAgents();
  const { mutate: executeAgent, isPending } = useExecuteAgent();
  const { centerId } = useTenant();

  const [agentType, setAgentType] = useState("");
  const [contextJson, setContextJson] = useState("{}");
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(() => {
    return availableAgents.map((agent) => ({
      type: agent.type,
      label:
        agent.name ??
        AGENT_TYPE_LABELS[agent.type] ??
        prettify(agent.type) ??
        "Unknown",
    }));
  }, [availableAgents]);

  useEffect(() => {
    if (!agentType && options.length > 0) {
      setAgentType(options[0].type);
    }
  }, [agentType, options]);

  const handleRun = () => {
    if (!agentType) {
      setError("Agent type is required.");
      return;
    }
    if (!centerId) {
      setError("Center is required to run an agent.");
      return;
    }

    let context: Record<string, unknown> | undefined;
    const trimmedContext = contextJson.trim();
    if (trimmedContext && trimmedContext !== "{}") {
      try {
        const parsed = JSON.parse(trimmedContext);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          setError("Context must be a JSON object.");
          return;
        }
        context = parsed as Record<string, unknown>;
      } catch {
        setError("Context must be valid JSON.");
        return;
      }
    }

    setError(null);

    executeAgent(
      {
        agent_type: agentType,
        center_id: centerId,
        context,
      },
      {
        onSuccess: (execution) => {
          onOpenChange(false);
          setContextJson("{}");
          onExecuted?.(execution.id);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run Agent</DialogTitle>
          <DialogDescription>
            Start an agent execution for the selected center with context.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Agent Type</Label>
            <Select value={agentType} onValueChange={setAgentType}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingAgents
                      ? "Loading available agents..."
                      : "Select agent type"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.type} value={option.type}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Center</Label>
            <CenterPicker
              className="w-full min-w-0"
              hideWhenCenterScoped={false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context-json">Context (JSON object)</Label>
            <textarea
              id="context-json"
              value={contextJson}
              onChange={(event) => setContextJson(event.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder='{"course_id": 12}'
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              For content publishing: {'{ "course_id": 12 }'} • For enrollment:
              {' { "course_id": 12, "student_ids": [1,2,3] }'}
            </p>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={isPending || isLoadingAgents}>
            {isPending ? "Starting..." : "Run Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
