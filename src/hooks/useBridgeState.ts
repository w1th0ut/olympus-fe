import { useState, useEffect } from "react";
import { type Hex } from "viem";

const STORAGE_KEY = "apollos_bridge_state_v1";

export type BridgeState = {
  messageId?: Hex;
  txHash?: Hex;
  step: number;
  timestamp: number;
  startBlock?: bigint; // To optimize log scanning
};

const INITIAL_STATE: BridgeState = {
  step: -1,
  timestamp: 0,
};

export function useBridgeState() {
  const [state, setState] = useState<BridgeState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Handle BigInt serialization
        const parsed = JSON.parse(stored, (key, value) => {
          if (key === "startBlock" && value) return BigInt(value);
          return value;
        });
        setState(parsed);
      }
    } catch (e) {
      console.error("Failed to load bridge state", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      // Handle BigInt serialization
      const serialized = JSON.stringify(state, (key, value) => {
        if (typeof value === "bigint") return value.toString();
        return value;
      });
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      console.error("Failed to save bridge state", e);
    }
  }, [state, isLoaded]);

  const updateState = (updates: Partial<BridgeState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const clearState = () => {
    setState(INITIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { state, updateState, clearState, isLoaded };
}
