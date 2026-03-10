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
        // This is a lightweight RPC call (eth_call), not a log scan.
        const result = await publicClient.readContract({
          address: apollosAddresses.ccipReceiver,
          abi: ccipReceiverAbi,
          functionName: "pendingDeposits",
          args: [messageId],
        });

        // Result tuple:
        // [0] messageId
        // [1] sourceChainSelector
        // [2] sourceSender
        // [3] receiver
        // [4] amount (uint256)
        // [5] sourceAsset
        // [6] targetBaseAsset
        // [7] minShares
        // [8] executed (bool)

        const amount = result[4];
        const executed = result[8];

        if (amount > BigInt(0)) {
          if (executed) {
            setStatus("success");
          } else {
            setStatus("stored"); // Ready to Zap
          }
          
          setData({
            amount,
            receiver: result[3],
            executed
          });
        } else {
          // If amount is 0, it means the mapping is empty for this messageId
          // This implies the CCIP message hasn't been processed by the receiver contract yet.
          setStatus("pending");
        }
      } catch (error) {
        console.error("Error polling CCIP status:", error);
        // Keep previous status on transient errors
      }
    };

    // Initial check
    checkStatus();

    // Poll every 5 seconds
    // RPC-friendly because it's just reading a specific storage slot
    const intervalId = setInterval(checkStatus, 5_000);

    return () => clearInterval(intervalId);
  }, [messageId, publicClient]);

  return { status, data };
}
