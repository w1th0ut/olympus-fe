export function getAgentBaseUrl() {
  return (process.env.NEXT_PUBLIC_OLYMPUS_AGENT_URL ?? "").trim().replace(/\/$/, "");
}

async function fetchAgentJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getAgentBaseUrl();
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_OLYMPUS_AGENT_URL is not configured");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Agent request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type AgentRuntimeState = {
  moduleReady: boolean;
  walletConfigured: boolean;
  executionEnabled: boolean;
  agentReady: boolean;
  initError: string;
  chains: string[];
};

export type AgentHealthResponse = {
  status: "ok";
  service: "olympus-agent";
  runtime: AgentRuntimeState;
  olympusBackendReachable: boolean;
  now: number;
};

export type AgentToolCatalogItem = {
  name: string;
  description: string;
  parameters: string[];
  source: "polkadot-agent-kit" | "olympus-custom";
  requiresWallet: boolean;
  allowed: boolean;
};

export type AgentToolsResponse = {
  runtime: AgentRuntimeState;
  tools: AgentToolCatalogItem[];
};

export type AgentPlanTool = {
  name: string;
  args?: Record<string, unknown>;
  reason?: string;
};

export type AgentPlan = {
  answer: string;
  summary: string;
  recommendedTools: AgentPlanTool[];
  riskNotes: string[];
  nextStep: string;
};

export type AgentChatResponse = {
  ok: true;
  runtime: AgentRuntimeState;
  context: unknown;
  plan: AgentPlan;
};

export type AgentExecuteResponse = {
  ok: true;
  runtime: AgentRuntimeState;
  execution: {
    tool: string;
    source: "polkadot-agent-kit" | "olympus-custom";
    result: string;
  };
};

export async function fetchAgentHealth() {
  return fetchAgentJson<AgentHealthResponse>("/api/agent/health");
}

export async function fetchAgentTools() {
  return fetchAgentJson<AgentToolsResponse>("/api/agent/tools");
}

export async function sendAgentChat(payload: { message: string; asset?: "WETH" | "WBTC" | "DOT" }) {
  return fetchAgentJson<AgentChatResponse>("/api/agent/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function executeAgentTool(payload: {
  toolName: string;
  args?: Record<string, unknown>;
}) {
  return fetchAgentJson<AgentExecuteResponse>("/api/agent/execute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
