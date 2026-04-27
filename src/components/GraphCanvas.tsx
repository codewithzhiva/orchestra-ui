import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import { useCallback } from "react";
import type { NodeStatus } from "../hooks/useGraphRun.ts";
import { NodeStatusBadge } from "./NodeStatusBadge.tsx";

export type NodeType = "llm" | "http" | "code";

interface OrchestraNodeData {
  label: string;
  nodeType: NodeType;
  status: NodeStatus;
  [key: string]: unknown;
}

function OrchestraNode({ data }: { data: OrchestraNodeData }) {
  const borderColor: Record<NodeType, string> = {
    llm: "border-violet-500",
    http: "border-sky-500",
    code: "border-amber-500",
  };
  const typeLabel: Record<NodeType, string> = {
    llm: "LLM",
    http: "HTTP",
    code: "CODE",
  };

  return (
    <div
      className={`bg-slate-800 border-2 ${borderColor[data.nodeType]} rounded-lg px-4 py-3 min-w-[140px] shadow-lg`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
          {typeLabel[data.nodeType]}
        </span>
        <NodeStatusBadge status={data.status} />
      </div>
      <div className="text-sm font-semibold text-white truncate">{data.label}</div>
    </div>
  );
}

const nodeTypes = { orchestra: OrchestraNode };

interface Props {
  nodeStatuses: Record<string, NodeStatus>;
  onSelectionChange?: (nodeId: string | null) => void;
  onGraphChange?: (nodes: Node[], edges: Edge[]) => void;
}

const INITIAL_NODES: Node[] = [
  {
    id: "input",
    type: "orchestra",
    position: { x: 80, y: 80 },
    data: { label: "input", nodeType: "llm", status: "idle" },
  },
];

export function GraphCanvas({ nodeStatuses, onSelectionChange, onGraphChange }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const next = addEdge({ ...params, animated: true }, eds);
        onGraphChange?.(nodes, next);
        return next;
      });
    },
    [nodes, setEdges, onGraphChange],
  );

  // Sync node statuses from run
  const displayNodes = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      status: nodeStatuses[n.id] ?? "idle",
    },
  }));

  return (
    <ReactFlow
      nodes={displayNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={(changes) => {
        onNodesChange(changes);
        onGraphChange?.(nodes, edges);
      }}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => onSelectionChange?.(node.id)}
      onPaneClick={() => onSelectionChange?.(null)}
      fitView
      className="bg-slate-950"
    >
      <Background color="#334155" gap={20} />
      <Controls className="[&>button]:bg-slate-800 [&>button]:border-slate-600 [&>button]:text-slate-300" />
      <MiniMap
        nodeColor={(n) => {
          const t = (n.data as OrchestraNodeData).nodeType;
          return t === "llm" ? "#7c3aed" : t === "http" ? "#0284c7" : "#d97706";
        }}
        className="bg-slate-900 border-slate-700"
      />
    </ReactFlow>
  );
}

export { useNodesState, useEdgesState, type Node, type Edge };
