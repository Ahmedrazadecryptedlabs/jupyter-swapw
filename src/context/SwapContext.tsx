"use client";

import React, { createContext, useContext, useState } from "react";
import { Token } from "@/types";

// Define the context type
interface SwapContextType {
  sellCurrency: Token | null;
  setSellCurrency: (token: Token | null) => void;
  buyCurrency: Token | null;
  setBuyCurrency: (token: Token | null) => void;
  sellAmount: number | undefined;
  setSellAmount: (amount: number | undefined) => void;
}

// Create context with default values
const SwapContext = createContext<SwapContextType | undefined>(undefined);

// Create provider component
export const SwapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sellCurrency, setSellCurrency] = useState<Token | null>(null);
  const [buyCurrency, setBuyCurrency] = useState<Token | null>(null);
  const [sellAmount, setSellAmount] = useState<number | undefined>(undefined);

  return (
    <SwapContext.Provider
      value={{
        sellCurrency,
        setSellCurrency,
        buyCurrency,
        setBuyCurrency,
        sellAmount,
        setSellAmount,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
};

// Custom hook to use SwapContext
export const useSwap = () => {
  const context = useContext(SwapContext);
  if (!context) {
    throw new Error("useSwap must be used within a SwapProvider");
  }
  return context;
};
