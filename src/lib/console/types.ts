export type NodeType = "prompt" | "tool" | "finding" | "control" | "attest" | "rulepack" | "replay";
export type Severity = "CAT_I" | "CAT_II" | "CAT_III" | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonLike = any;
export interface DagNode {
  id: string;
  label: string;
  type: NodeType;
  description: string | null;
  severity: Severity;
  val: number;
  ts: string;
  payload: JsonLike;
  sig: { alg: string; value: string } | null;
}
export interface DagLink { source: string; target: string; w: number }
export interface DagPayload {
  meta: {
    session_ref: string;
    tool_calls: number;
    findings: number;
    attestations: number;
    controls: number;
    tenant: string;
    classification: string;
  };
  nodes: DagNode[];
  links: DagLink[];
}