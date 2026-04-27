import type { NodeStatus } from "../hooks/useGraphRun.ts";

interface Props {
  status: NodeStatus;
}

const STYLES: Record<NodeStatus, string> = {
  idle: "bg-slate-700 text-slate-300",
  running: "bg-yellow-500/20 text-yellow-300 animate-pulse",
  finished: "bg-emerald-500/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-300",
};

const LABELS: Record<NodeStatus, string> = {
  idle: "idle",
  running: "running…",
  finished: "done",
  failed: "failed",
};

export function NodeStatusBadge({ status }: Props) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
