import { useEffect, useState } from "react";
import { type Hex } from "viem";
import { usePublicClient } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { ccipReceiverAbi } from "@/lib/apollos-abi";
import { apollosAddresses } from "@/lib/apollos";

export type CCIPStatus = "idle" | "pending" | "stored" | "success" | "failed";

export function useCCIPStatus(messageId: Hex | undefined) {
  const [status, setStatus] = useState<CCIPStatus>("idle");
  const [data, setData] = useState<any>(null);

  // We use a public client for Arbitrum Sepolia to poll the contract state
  const publicClient = usePublicClient({ 
    chainId: arbitrumSepolia.id 
  });

  useEffect(() => {
    if (!messageId || !publicClient) {
      setStatus("idle");
      return;
    }

    // Default to pending if we have a messageId but no data yet
    setStatus((prev) => (prev === "idle" ? "pending" : prev));

    const checkStatus = async () => {
      try {
        // Read the 'pendingDeposits' mapping from the smart contract
        const result = await publicClient.readContract({
          address: apollosAddresses.ccipReceiver,
          abi: ccipReceiverAbi,
          functionName: "pendingDeposits",
          args: [messageId],
        });

        // Robust Type Guarding for Viem Return Values (Array vs Object)
        let amount = BigInt(0);
        let executed = false;
        let receiver = "0x0000000000000000000000000000000000000000";

        // Case 1: Object (Named fields)
        if (result && typeof result === 'object' && 'amount' in result) {
            amount = (result as any).amount;
            executed = (result as any).executed;
            receiver = (result as any).receiver;
        } 
        // Case 2: Array (Tuple)
        // [0] messageId, [1] chainSelector, [2] sender, [3] receiver, [4] amount, [5] sourceAsset, [6] targetBaseAsset, [7] minShares, [8] executed
        else if (Array.isArray(result)) {
            amount = result[4] as bigint;
            executed = result[8] as boolean;
            receiver = result[3] as string;
        }

        if (amount > BigInt(0)) {
          if (executed) {
            setStatus("success");
          } else {
            setStatus("stored"); // Ready to Zap
          }
          
          setData({
            amount,
            receiver,
            executed
          });
        } else {
          // Mapping empty => Message not yet processed by receiver
          setStatus("pending");
        }
      } catch (error) {
        console.error("Error polling CCIP status:", error);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 5 seconds
    const intervalId = setInterval(checkStatus, 5_000);

    return () => clearInterval(intervalId);
  }, [messageId, publicClient]);

  return { status, data };
}
