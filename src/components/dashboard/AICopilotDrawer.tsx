"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Loader2, Play, RefreshCcw, Send, Sparkles, Wallet } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  executeAgentTool,
  fetchAgentHealth,
  fetchAgentTools,
  sendAgentChat,
  type AgentChatResponse,
  type AgentHealthResponse,
  type AgentPlan,
  type AgentToolCatalogItem,
  type AgentToolsResponse,
} from "@/lib/agent";

type DashboardSectionKey = "balances" | "earn" | "pools" | "credit-line" | "bridge";

type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: AgentPlan;
};

type ToolPreset = {
  key: string;
  label: string;
  description: string;
  toolName: string;
  args?: Record<string, unknown>;
};

type PromptPreset = {
  label: string;
  prompt: string;
};

const SECTION_COPY: Record<
  DashboardSectionKey,
  {
    eyebrow: string;
    summary: string;
    prompts: PromptPreset[];
    tools: ToolPreset[];
  }
> = {
  balances: {
    eyebrow: "Portfolio Copilot",
    summary:
      "Use the agent to summarize Olympus-wide state, recent guardian actions, and your native operational balance before taking protocol actions.",
    prompts: [
      {
        label: "Portfolio Overview",
        prompt: "Summarize my Olympus portfolio state, including the latest risk, NAV, and guardian activity across all markets.",
      },
      {
        label: "Protocol Pulse",
        prompt: "Give me the latest Olympus protocol pulse across WETH, WBTC, and DOT, and call out anything operationally important.",
      },
      {
        label: "PAS Readiness",
        prompt: "Check my native PAS readiness on paseo_asset_hub and tell me if the agent is operationally ready for native actions.",
      },
    ],
    tools: [
      {
        key: "overview",
        label: "Olympus Overview",
        description: "Read the latest Olympus backend overview across vaults, pricing, and protocol activity.",
        toolName: "get_olympus_overview",
      },
      {
        key: "balance",
        label: "Check PAS Balance",
        description: "Confirm the agent wallet balance on Paseo Asset Hub before native execution.",
        toolName: "check_balance",
        args: { chain: "paseo_asset_hub" },
      },
    ],
  },
  earn: {
    eyebrow: "Vault Copilot",
    summary:
      "Focus the agent on Olympus vault health, dynamic fee changes, spot-versus-oracle divergence, and guardian actions around delta-neutral yield.",
    prompts: [
      {
        label: "WETH Risk Brief",
        prompt: "Summarize WETH vault risk, health factor, leverage, dynamic fee changes, and the latest guardian actions in Olympus.",
      },
      {
        label: "Oracle vs Spot",
        prompt: "Compare Olympus oracle price and OlympusSwap spot price for WBTC, then explain whether divergence looks acceptable.",
      },
      {
        label: "Yield Conditions",
        prompt: "Explain whether current Olympus vault conditions look favorable for depositors and highlight the main risk drivers.",
      },
    ],
    tools: [
      {
        key: "weth-market",
        label: "WETH Snapshot",
        description: "Read the latest WETH market snapshot from Olympus backend state.",
        toolName: "get_olympus_market_snapshot",
        args: { asset: "WETH" },
      },
      {
        key: "guardian-weth",
        label: "WETH Guardian Logs",
        description: "Pull the latest WETH guardian and risk-management activity.",
        toolName: "get_olympus_guardian_logs",
        args: { asset: "WETH", limit: 8 },
      },
      {
        key: "guardian-wbtc",
        label: "WBTC Guardian Logs",
        description: "Review recent WBTC monitoring, fee, and health signals.",
        toolName: "get_olympus_guardian_logs",
        args: { asset: "WBTC", limit: 8 },
      },
    ],
  },
  pools: {
    eyebrow: "DEX Copilot",
    summary:
      "Use the copilot to explain OlympusSwap liquidity conditions, fee posture, spot pricing, and any divergence relative to oracle-backed market reads.",
    prompts: [
      {
        label: "Liquidity Conditions",
        prompt: "Explain the current OlympusSwap liquidity and divergence conditions across WETH, WBTC, and DOT pools.",
      },
      {
        label: "Fee Posture",
        prompt: "Summarize Olympus DEX fee conditions and explain which market is currently under the highest fee pressure.",
      },
      {
        label: "DOT Pool Check",
        prompt: "Check whether the DOT OlympusSwap pool looks operationally abnormal and explain the reason clearly.",
      },
    ],
    tools: [
      {
        key: "overview",
        label: "Olympus Overview",
        description: "Read the latest protocol-wide pricing, fee, and activity overview.",
        toolName: "get_olympus_overview",
      },
      {
        key: "guardian-dot",
        label: "DOT Guardian Logs",
        description: "Inspect the latest DOT divergence and fee-management events.",
        toolName: "get_olympus_guardian_logs",
        args: { asset: "DOT", limit: 8 },
      },
      {
        key: "guardian-weth",
        label: "WETH Guardian Logs",
        description: "Inspect the latest WETH fee and volatility events.",
        toolName: "get_olympus_guardian_logs",
        args: { asset: "WETH", limit: 8 },
      },
    ],
  },
  "credit-line": {
    eyebrow: "Lending Copilot",
    summary:
      "Use the agent to interpret Olympus lending health, NAV and VaR updates, and how delegated USDC debt affects current market posture.",
    prompts: [
      {
        label: "Lending Risk",
        prompt: "Summarize current Olympus lending risk across all markets, including health factor, leverage, and any rebalance pressure.",
      },
      {
        label: "NAV and VaR",
        prompt: "Explain the latest NAV and VaR updates in Olympus and tell me which vault deserves the most attention.",
      },
      {
        label: "DOT Debt Profile",
        prompt: "Show the latest risk signals for the DOT vault and explain how delegated USDC debt is affecting that market.",
      },
    ],
    tools: [
      {
        key: "wbtc-market",
        label: "WBTC Snapshot",
        description: "Read the latest WBTC market state relevant to lending and vault monitoring.",
        toolName: "get_olympus_market_snapshot",
        args: { asset: "WBTC" },
      },
      {
        key: "guardian-dot",
        label: "DOT Risk Logs",
        description: "Review recent DOT strategist, auditor, and accountant events.",
        toolName: "get_olympus_guardian_logs",
        args: { asset: "DOT", limit: 8 },
      },
      {
        key: "guardian-weth",
        label: "WETH Risk Logs",
        description: "Review recent WETH lending-side monitoring and health events.",
        toolName: "get_olympus_guardian_logs",
        args: { asset: "WETH", limit: 8 },
      },
    ],
  },
  bridge: {
    eyebrow: "Native Ops Copilot",
    summary:
      "This view is for agent-side native readiness, Paseo Asset Hub access, and explaining the current constraints between Olympus local execution and future cross-chain routing.",
    prompts: [
      {
        label: "Native Balance",
        prompt: "Check my native PAS balance on paseo_asset_hub and confirm whether the agent can execute Polkadot-native actions safely.",
      },
      {
        label: "Initialize Native Access",
        prompt: "Initialize paseo_asset_hub chain access for the agent and explain what that unlocks for Olympus operations.",
      },
      {
        label: "Bridge Constraints",
        prompt: "Explain the current Olympus bridge path and operational constraints between local execution, XCM simulation, and future native routing.",
      },
    ],
    tools: [
      {
        key: "init-paseo",
        label: "Init Paseo Asset Hub",
        description: "Initialize native chain access for the agent on Paseo Asset Hub.",
        toolName: "initialize_chain_api",
        args: { chainId: "paseo_asset_hub" },
      },
      {
        key: "balance",
        label: "Check PAS Balance",
        description: "Read the native PAS balance held by the agent wallet.",
        toolName: "check_balance",
        args: { chain: "paseo_asset_hub" },
      },
      {
        key: "overview",
        label: "Olympus Overview",
        description: "Read the latest protocol-side activity before planning bridge operations.",
        toolName: "get_olympus_overview",
      },
    ],
  },
};

const TOOL_LABELS: Record<string, string> = {
  get_olympus_overview: "Olympus Overview",
  get_olympus_market_snapshot: "Market Snapshot",
  get_olympus_guardian_logs: "Guardian Logs",
  initialize_chain_api: "Initialize Chain API",
  check_balance: "Check Native Balance",
  swap_tokens: "Swap Tokens",
  join_pool: "Join Nomination Pool",
  bond_extra: "Bond Extra",
  unbond: "Unbond",
  withdraw_unbonded: "Withdraw Unbonded",
  claim_rewards: "Claim Rewards",
};

function getMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStatusTone(isActive: boolean) {
  return isActive
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
    : "border-black/10 bg-black/[0.03] text-neutral-600";
}

function stringifyExecution(result: string) {
  return result.replace(/\s+/g, " ").trim();
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function humanizeExecutionResult(toolName: string, rawResult: string) {
  const parsed = safeJsonParse(rawResult);
  const nestedPayload =
    parsed && typeof parsed === "object" && typeof parsed.content === "string"
      ? safeJsonParse(parsed.content)
      : null;

  const payload = nestedPayload ?? parsed;

  if (toolName === "get_olympus_overview" && payload && typeof payload === "object") {
    const overviewPayload = payload as {
      backendHealth?: { status?: string };
      prices?: { prices?: Record<string, { priceUsd?: number }> };
      recentActivity?: { items?: Array<{ event?: string; poolTag?: string }> };
    };
    const healthStatus =
      typeof overviewPayload.backendHealth?.status === "string"
        ? overviewPayload.backendHealth.status
        : "unknown";
    const priceEntries =
      overviewPayload.prices?.prices && typeof overviewPayload.prices.prices === "object"
      ? Object.entries(overviewPayload.prices.prices)
          .slice(0, 3)
          .map(([asset, item]) => {
            const price = typeof item?.priceUsd === "number" ? item.priceUsd : null;
            return price !== null ? `${asset} $${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : asset;
          })
      : [];
    const recentEvents = Array.isArray(overviewPayload.recentActivity?.items)
      ? [
          ...new Set(
            overviewPayload.recentActivity.items
              .slice(0, 4)
              .map((item: { event?: string }) => item?.event)
              .filter(Boolean),
          ),
        ]
      : [];

    const summaryParts = [`Olympus backend health is ${healthStatus}.`];
    if (priceEntries.length > 0) {
      summaryParts.push(`Tracked prices: ${priceEntries.join(" | ")}.`);
    }
    if (recentEvents.length > 0) {
      summaryParts.push(`Latest protocol activity includes ${recentEvents.join(", ")}.`);
    }

    return summaryParts.join(" ");
  }

  if (toolName === "get_olympus_market_snapshot" && payload && typeof payload === "object") {
    const snapshotPayload = payload as {
      asset?: string;
      price?: { priceUsd?: number };
      recentActivity?: { items?: Array<{ event?: string }> };
    };
    const asset = typeof snapshotPayload.asset === "string" ? snapshotPayload.asset : "Selected asset";
    const price =
      typeof snapshotPayload.price?.priceUsd === "number" ? snapshotPayload.price.priceUsd : null;
    const latestEvent = Array.isArray(snapshotPayload.recentActivity?.items)
      ? snapshotPayload.recentActivity.items.find((item: { event?: string }) => item?.event)?.event
      : "";

    const summaryParts = [
      price !== null
        ? `${asset} market snapshot loaded at $${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}.`
        : `${asset} market snapshot loaded.`,
    ];

    if (latestEvent) {
      summaryParts.push(`Latest tracked event: ${latestEvent}.`);
    }

    return summaryParts.join(" ");
  }

  if (toolName === "get_olympus_guardian_logs" && payload && typeof payload === "object") {
    const guardianPayload = payload as {
      items?: Array<{ event?: string; poolTag?: string }>;
    };
    const items = Array.isArray(guardianPayload.items) ? guardianPayload.items : [];
    const latestEvents = [
      ...new Set(items.slice(0, 4).map((item: { event?: string }) => item?.event).filter(Boolean)),
    ];
    const latestPool = items.find((item: { poolTag?: string }) => item?.poolTag)?.poolTag;

    if (items.length > 0) {
      return `${items.length} guardian log entries loaded${latestPool ? ` for ${latestPool}` : ""}. Latest events: ${latestEvents.join(", ")}.`;
    }

    return "No guardian log entries were returned for the selected filter.";
  }

  if (toolName === "check_balance" && payload && typeof payload === "object") {
    const data = typeof payload.data === "string" ? payload.data : "";
    const chain =
      typeof payload.chain === "string"
        ? payload.chain
        : data.toLowerCase().includes("paseo_asset_hub")
          ? "paseo_asset_hub"
          : "the selected chain";

    const balanceMatch = data.match(/Balance on [^:]+:\s*(.+)$/i);
    const balanceText = balanceMatch?.[1]?.trim() || data.trim();

    if (balanceText) {
      return `Native balance on ${chain} is ${balanceText}.`;
    }
  }

  if (toolName === "initialize_chain_api" && payload && typeof payload === "object") {
    const data = typeof payload.data === "string" ? payload.data : "";
    const chain =
      typeof payload.chainId === "string"
        ? payload.chainId
        : typeof payload.chain === "string"
          ? payload.chain
          : "the selected chain";

    if (payload.success === true || /initialized/i.test(data)) {
      return `Chain access for ${chain} is ready.`;
    }
  }

  if (payload && typeof payload === "object") {
    if (typeof payload.data === "string" && payload.data.trim()) {
      return payload.data.trim();
    }

    if (typeof payload.content === "string" && payload.content.trim()) {
      return payload.content.trim();
    }
  }

  return stringifyExecution(rawResult);
}

function getToolLabel(toolName: string) {
  return TOOL_LABELS[toolName] ?? toolName;
}

function formatToolArgs(args?: Record<string, unknown>) {
  if (!args) {
    return [];
  }

  return Object.entries(args)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`);
}

function extractAssetHint(message: string): "WETH" | "WBTC" | "DOT" | undefined {
  const normalized = message.toUpperCase();

  if (normalized.includes("WETH")) {
    return "WETH";
  }
  if (normalized.includes("WBTC")) {
    return "WBTC";
  }
  if (normalized.includes("DOT")) {
    return "DOT";
  }

  return undefined;
}

function shouldReplaceWithLocalFallback(plan: AgentPlan) {
  const answer = String(plan.answer || "").toLowerCase();
  const summary = String(plan.summary || "").toLowerCase();

  return (
    answer.includes("fallback planning mode") ||
    answer.includes("generated without gemini enrichment") ||
    answer.includes("gemini planning timed out") ||
    summary.startsWith("tracked assets:")
  );
}

function buildLocalFallbackPlan({
  message,
  activeSection,
  sectionTitle,
  runtime,
  toolPresets,
}: {
  message: string;
  activeSection: DashboardSectionKey;
  sectionTitle: string;
  runtime: AgentHealthResponse["runtime"] | AgentToolsResponse["runtime"] | null;
  toolPresets: ToolPreset[];
}): AgentPlan {
  const assetHint = extractAssetHint(message);
  const fallbackTools = toolPresets.slice(0, 2).map((tool) => ({
    name: tool.toolName,
    args: tool.args ?? {},
    reason: tool.description,
  }));

  const sectionAnswers: Record<DashboardSectionKey, string> = {
    balances:
      "Your Olympus dashboard is ready for a portfolio-wide review. Start with the latest protocol overview, then confirm native PAS readiness if you want to use Polkadot-side actions.",
    earn:
      "The next useful step is to review vault health, fee posture, and oracle-versus-spot alignment before changing any yield exposure.",
    pools:
      "The next useful step is to review OlympusSwap liquidity conditions, fee posture, and whether any pool shows abnormal divergence.",
    "credit-line":
      "The next useful step is to review lending health, leverage pressure, NAV, and VaR before adjusting any debt-heavy position.",
    bridge:
      "The next useful step is to confirm native Paseo readiness and review current bridge constraints before planning any cross-chain action.",
  };

  const sectionSummaries: Record<DashboardSectionKey, string> = {
    balances:
      "Use Olympus Overview first to inspect protocol-wide pricing, guardian activity, and vault state. If you plan to use native agent actions, verify the PAS balance right after that.",
    earn:
      "Use market snapshots and guardian logs to check whether fee changes, health conditions, and spot-versus-oracle divergence support the current vault setup.",
    pools:
      "Use protocol overview and guardian logs to see which pool is under the most fee or divergence pressure before treating current DEX pricing as healthy.",
    "credit-line":
      "Use market snapshots and guardian logs to understand whether current leverage, lending health, and risk metrics still support the open credit profile.",
    bridge:
      "Use native readiness checks before bridge planning so the agent only proposes routes that are operationally realistic for Olympus right now.",
  };

  const sectionNextSteps: Record<DashboardSectionKey, string> = {
    balances:
      "Open the Olympus overview first, then verify PAS balance if you want to continue toward native execution.",
    earn:
      "Start with a market snapshot or guardian log review before interpreting vault conditions as favorable.",
    pools:
      "Start with guardian logs for the pool you care about most, then compare that against protocol-wide overview data.",
    "credit-line":
      "Start with the market snapshot and recent guardian logs for the market under review, then decide whether the debt profile still looks acceptable.",
    bridge:
      "Initialize Paseo Asset Hub or check PAS balance first, then continue into bridge planning only after native readiness is confirmed.",
  };

  const sectionRiskNotes: Record<DashboardSectionKey, string[]> = {
    balances: [],
    earn: [],
    pools: [],
    "credit-line": [],
    bridge: [],
  };

  const runtimeNotes = [];
  if (runtime?.walletConfigured && activeSection === "bridge") {
    runtimeNotes.push("Native wallet is configured for Polkadot-side execution.");
  }
  if (runtime?.executionEnabled && activeSection === "bridge") {
    runtimeNotes.push("Execution controls are available from this drawer when needed.");
  };
  const answer =
    assetHint && activeSection !== "balances" && activeSection !== "bridge"
      ? `${sectionAnswers[activeSection]} This request is centered on ${assetHint}.`
      : sectionAnswers[activeSection];

  return {
    answer,
    summary: sectionSummaries[activeSection],
    recommendedTools: fallbackTools,
    riskNotes: [...sectionRiskNotes[activeSection], ...runtimeNotes],
    nextStep: fallbackTools.length > 0
      ? sectionNextSteps[activeSection]
      : "Use a section-specific quick prompt to continue with the next Olympus step.",
  };
}

interface AICopilotDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSection: DashboardSectionKey;
  sectionTitle: string;
}

export function AICopilotDrawer({
  open,
  onOpenChange,
  activeSection,
  sectionTitle,
}: AICopilotDrawerProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [agentHealth, setAgentHealth] = useState<AgentHealthResponse | null>(null);
  const [agentTools, setAgentTools] = useState<AgentToolsResponse | null>(null);
  const [lastExecution, setLastExecution] = useState<string>("");
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [runningToolName, setRunningToolName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  const sectionCopy = SECTION_COPY[activeSection];
  const quickPrompts = sectionCopy.prompts;
  const toolPresets = sectionCopy.tools;

  const allowedToolMap = useMemo(() => {
    const entries = (agentTools?.tools ?? []).map((tool) => [tool.name, tool] as const);
    return new Map<string, AgentToolCatalogItem>(entries);
  }, [agentTools]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadMeta = async () => {
      setIsMetaLoading(true);
      setErrorMessage("");

      try {
        const [health, tools] = await Promise.all([fetchAgentHealth(), fetchAgentTools()]);
        if (cancelled) {
          return;
        }
        setAgentHealth(health);
        setAgentTools(tools);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load AI copilot.");
        }
      } finally {
        if (!cancelled) {
          setIsMetaLoading(false);
        }
      }
    };

    void loadMeta();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const appendAssistantMessage = (response: AgentChatResponse) => {
    const plan = shouldReplaceWithLocalFallback(response.plan)
      ? buildLocalFallbackPlan({
          message: "",
          activeSection,
          sectionTitle,
          runtime: response.runtime,
          toolPresets,
        })
      : response.plan;

    setMessages((current) => [
      ...current,
      {
        id: getMessageId(),
        role: "assistant",
        content: plan.answer,
        plan,
      },
    ]);
  };

  const handleSendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || isSending) {
      return;
    }

    setPrompt("");
    setErrorMessage("");
    setMessages((current) => [
      ...current,
      {
        id: getMessageId(),
        role: "user",
        content: message,
      },
    ]);
    setIsSending(true);

    try {
      const response = await sendAgentChat({ message, asset: extractAssetHint(message) });
      const plan = shouldReplaceWithLocalFallback(response.plan)
        ? buildLocalFallbackPlan({
            message,
            activeSection,
            sectionTitle,
            runtime: response.runtime,
            toolPresets,
          })
        : response.plan;

      setMessages((current) => [
        ...current,
        {
          id: getMessageId(),
          role: "assistant",
          content: plan.answer,
          plan,
        },
      ]);
    } catch (error) {
      const plan = buildLocalFallbackPlan({
        message,
        activeSection,
        sectionTitle,
        runtime: agentHealth?.runtime ?? agentTools?.runtime ?? null,
        toolPresets,
      });

      setMessages((current) => [
        ...current,
        {
          id: getMessageId(),
          role: "assistant",
          content: plan.answer,
          plan,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleRunTool = async (toolName: string, args?: Record<string, unknown>) => {
    if (runningToolName) {
      return;
    }

    setRunningToolName(toolName);
    setErrorMessage("");

    try {
      const response = await executeAgentTool({ toolName, args });
      const readableResult = humanizeExecutionResult(toolName, response.execution.result);
      setLastExecution(`${getToolLabel(toolName)}: ${readableResult}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `Failed to run ${toolName}.`);
    } finally {
      setRunningToolName("");
    }
  };

  const handlePromptKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage(prompt);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden border-l border-black/10 bg-[#f3efe6] p-0 sm:max-w-[468px]"
      >
        <SheetHeader className="gap-4 border-b border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(243,239,230,0.92))] pb-5 pr-14">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-syne text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">
                {sectionCopy.eyebrow}
              </p>
              <SheetTitle className="font-syne text-xl font-bold text-neutral-950">
                AI Copilot
              </SheetTitle>
              <SheetDescription className="font-manrope text-sm text-neutral-700">
                Polkadot-native agent guidance for the current {sectionTitle.toLowerCase()} view.
              </SheetDescription>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/85 p-2.5 shadow-[0px_10px_22px_0px_rgba(0,0,0,0.08)]">
              <Sparkles className="h-4 w-4 text-neutral-800" />
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.05)]">
            <p className="font-manrope text-sm leading-6 text-neutral-700">{sectionCopy.summary}</p>
          </div>

          {isMetaLoading ? (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={getStatusTone(Boolean(agentHealth?.runtime.agentReady))}
              >
                <Bot className="h-3 w-3" />
                {agentHealth?.runtime.agentReady ? "Agent ready" : "Agent unavailable"}
              </Badge>
              <Badge
                variant="outline"
                className={getStatusTone(Boolean(agentHealth?.runtime.walletConfigured))}
              >
                <Wallet className="h-3 w-3" />
                {agentHealth?.runtime.walletConfigured ? "Wallet ready" : "Wallet missing"}
              </Badge>
              <Badge
                variant="outline"
                className={getStatusTone(Boolean(agentHealth?.runtime.executionEnabled))}
              >
                {agentHealth?.runtime.executionEnabled ? "Execution enabled" : "Advisory only"}
              </Badge>
            </div>
          )}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="border-b border-black/10 px-4 py-3">
            <Accordion type="multiple" className="space-y-2">
              <AccordionItem value="quick-prompts" className="rounded-2xl border border-black/10 bg-white px-4 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.04)]">
                <AccordionTrigger className="py-3 font-syne text-sm font-bold text-neutral-950 hover:no-underline">
                  <div className="flex flex-col items-start">
                    <span>Quick prompts</span>
                    <span className="mt-1 font-manrope text-xs font-normal text-neutral-600">
                      {quickPrompts.length} Olympus-specific starting points
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {quickPrompts.map((item) => (
                    <button
                      key={item.prompt}
                      type="button"
                      onClick={() => {
                        void handleSendMessage(item.prompt);
                      }}
                      className="w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
                    >
                      <p className="font-syne text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                        {item.label}
                      </p>
                      <p className="mt-1 font-manrope text-sm leading-5 text-neutral-800">{item.prompt}</p>
                    </button>
                  ))}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="utility-actions" className="rounded-2xl border border-black/10 bg-white px-4 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.04)]">
                <AccordionTrigger className="py-3 font-syne text-sm font-bold text-neutral-950 hover:no-underline">
                  <div className="flex flex-col items-start">
                    <span>Utility actions</span>
                    <span className="mt-1 font-manrope text-xs font-normal text-neutral-600">
                      {toolPresets.length} direct agent tools for this view
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {toolPresets.map((preset) => {
                    const toolConfig = allowedToolMap.get(preset.toolName);
                    const isDisabled = toolConfig ? !toolConfig.allowed : false;
                    const isRunning = runningToolName === preset.toolName;

                    return (
                      <button
                        key={preset.key}
                        type="button"
                        disabled={isDisabled || isRunning}
                        onClick={() => {
                          void handleRunTool(preset.toolName, preset.args);
                        }}
                        className="w-full rounded-2xl border border-black/10 bg-[#faf8f3] p-4 text-left transition-colors hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-syne text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                              {getToolLabel(preset.toolName)}
                            </p>
                            <p className="mt-1 font-syne text-sm font-bold text-neutral-950">
                              {preset.label}
                            </p>
                            <p className="mt-1 font-manrope text-xs leading-5 text-neutral-600">
                              {preset.description}
                            </p>
                          </div>

                          <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 font-syne text-[11px] font-bold text-neutral-700">
                            {isRunning ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                            {isDisabled ? "Manual" : "Run"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <ScrollArea className="h-0 min-h-0 flex-1">
            <div className="space-y-4 px-4 py-4">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 bg-white/70 p-4">
                  <p className="font-syne text-sm font-bold text-neutral-950">Ready to assist</p>
                  <p className="mt-2 font-manrope text-sm text-neutral-700">
                    Ask for an Olympus risk brief, a guardian activity explanation, a native PAS balance
                    check, or a concrete next step for the current workflow.
                  </p>
                </div>
              ) : null}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-10 rounded-2xl border border-black/10 bg-white p-4"
                      : "mr-6 rounded-2xl border border-black/10 bg-[#eef1f5] p-4"
                  }
                >
                  <p className="font-manrope text-sm leading-6 text-neutral-800">{message.content}</p>

                  {message.plan ? (
                    <>
                      <Separator className="my-3 bg-black/10" />

                      <div className="space-y-3">
                        <div>
                          <p className="font-syne text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                            Summary
                          </p>
                          <p className="mt-1 font-manrope text-sm text-neutral-700">
                            {message.plan.summary}
                          </p>
                        </div>

                        {message.plan.recommendedTools.length > 0 ? (
                          <div>
                            <p className="font-syne text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                              Suggested Actions
                            </p>
                            <div className="mt-2 space-y-2">
                              {message.plan.recommendedTools.map((tool) => {
                                const toolConfig = allowedToolMap.get(tool.name);
                                const canRun = Boolean(toolConfig?.allowed);
                                const isRunning = runningToolName === tool.name;

                                return (
                                  <div
                                    key={`${message.id}-${tool.name}-${JSON.stringify(tool.args ?? {})}`}
                                    className="rounded-xl border border-black/10 bg-white/80 p-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-syne text-xs font-bold text-neutral-950">
                                          {getToolLabel(tool.name)}
                                        </p>
                                        <p className="mt-1 font-manrope text-xs text-neutral-600">
                                          {tool.reason ?? "Suggested by the AI copilot for the current context."}
                                        </p>
                                        {formatToolArgs(tool.args).length > 0 ? (
                                          <div className="mt-2 flex flex-wrap gap-1.5">
                                            {formatToolArgs(tool.args).map((item) => (
                                              <Badge
                                                key={item}
                                                variant="outline"
                                                className="border-black/10 bg-black/[0.03] px-2 py-0.5 font-manrope text-[11px] font-medium text-neutral-600"
                                              >
                                                {item}
                                              </Badge>
                                            ))}
                                          </div>
                                        ) : null}
                                      </div>

                                      {canRun ? (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          disabled={isRunning}
                                          onClick={() => {
                                            void handleRunTool(tool.name, tool.args);
                                          }}
                                          className="h-8 rounded-full border-black/15 bg-white px-3 font-syne text-[11px] font-bold text-neutral-800"
                                        >
                                          {isRunning ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Play className="h-3 w-3" />
                                          )}
                                          Run
                                        </Button>
                                      ) : (
                                        <Badge variant="outline" className="border-black/10 bg-black/[0.03] text-neutral-500">
                                          Manual
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        <div>
                          <p className="font-syne text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                            Next Step
                          </p>
                          <p className="mt-1 font-manrope text-sm text-neutral-700">
                            {message.plan.nextStep}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              ))}

              {isSending ? (
                <div className="mr-6 rounded-2xl border border-black/10 bg-[#eef1f5] p-4">
                  <div className="flex items-center gap-2 font-manrope text-sm text-neutral-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking through the Olympus and Polkadot context.
                  </div>
                </div>
              ) : null}
            </div>
          </ScrollArea>

          <div className="border-t border-black/10 px-4 py-4">
            {lastExecution ? (
              <div className="mb-3 max-h-24 overflow-y-auto rounded-xl border border-black/10 bg-white px-3 py-2">
                <div className="flex items-start gap-2">
                  <RefreshCcw className="mt-0.5 h-3.5 w-3.5 text-neutral-500" />
                  <p className="font-manrope text-xs leading-5 text-neutral-700">{lastExecution}</p>
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
                <p className="font-manrope text-xs text-red-700">{errorMessage}</p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-black/10 bg-white p-3">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handlePromptKeyDown}
                placeholder={`Ask the copilot about ${sectionTitle.toLowerCase()}, Olympus risk, or Polkadot-native execution...`}
                className="min-h-[96px] resize-none border-0 px-0 py-0 shadow-none focus-visible:ring-0"
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="font-manrope text-[11px] text-neutral-500">
                  Enter sends. Shift+Enter adds a new line.
                </p>

                <Button
                  type="button"
                  onClick={() => {
                    void handleSendMessage(prompt);
                  }}
                  disabled={!prompt.trim() || isSending}
                  className="rounded-full bg-neutral-950 px-4 font-syne text-xs font-bold text-white hover:bg-neutral-800"
                >
                  {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
