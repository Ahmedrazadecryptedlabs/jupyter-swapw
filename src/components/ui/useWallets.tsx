"use client";

import { useContext } from "react";
import 

export const useWallets = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallets must be used within a WalletProvider");
  }
  return context.wallets;
};