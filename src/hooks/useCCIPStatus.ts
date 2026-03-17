import { useReadContract } from "wagmi";
import { type Hex } from "viem";
import { olympusAddresses } from "@/lib/olympus";
import { useMemo } from "react";
import { ccipReceiverAbi } from "@/lib/olympus-abi";
import { targetChain } from "@/lib/chains";

export type CCIPStatus = "idle" | "pending" | "stored" | "success" | "failed";

export function useCCIPStatus(messageId: Hex | undefined) {
  // Wagmi & TanStack Query otomatis menghandle polling & window focus!
  const { data: rawData, isLoading } = useReadContract({
    address: olympusAddresses.ccipReceiver,
    abi: ccipReceiverAbi,
    functionName: "pendingDeposits",
    args: messageId ? [messageId] : undefined,
    chainId: targetChain.id,
    query: {
      enabled: Boolean(messageId),
      refetchInterval: 5000, // Otomatis fetch tiap 5 detik
      // refetchOnWindowFocus: true // (Ini sudah TRUE secara default di Wagmi!)
    },
  });

  // Parse hasil balikan dari Smart Contract
  const result = useMemo(() => {
    if (!messageId) return { status: "idle" as CCIPStatus, data: null };
    if (isLoading && !rawData)
      return { status: "pending" as CCIPStatus, data: null };

    let amount = BigInt(0);
    let executed = false;
    let receiver = "0x0000000000000000000000000000000000000000";

    if (rawData && typeof rawData === "object" && "amount" in rawData) {
      amount = (rawData as any).amount;
      executed = (rawData as any).executed;
      receiver = (rawData as any).receiver;
    } else if (Array.isArray(rawData)) {
      amount = rawData[4] as bigint;
      executed = rawData[8] as boolean;
      receiver = rawData[3] as string;
    }

    if (amount > BigInt(0)) {
      return {
        status: executed ? ("success" as CCIPStatus) : ("stored" as CCIPStatus),
        data: { amount, receiver, executed },
      };
    }

    return { status: "pending" as CCIPStatus, data: null };
  }, [messageId, rawData, isLoading]);

  return result;
}
