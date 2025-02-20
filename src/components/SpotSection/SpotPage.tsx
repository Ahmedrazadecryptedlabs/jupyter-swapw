"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/modal";
import Spotbg from "../../../public/images/spot-bg.webp";
import {
  AlignHorizontalDistributeCenter,
  ArrowDownUp,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePoolContext } from "@/context/PoolContext";
import {
  DEFAULT_SELL_ADDRESS,
  DEFAULT_BUY_ADDRESS,
  FEE_CONFIG,
  APP_CONNECTION,
} from "@/constants";
import { Token } from "@/types";
import {
  createJupiterApiClient,
  QuoteResponse,
  SwapResponse,
} from "@jup-ag/api";
import "react-loading-skeleton/dist/skeleton.css";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import showToast from "@/lib/showToast";
import SwapComponent from "@/components/ui/SwapComponent";
import LimitComponent from "./LimitComponent";
import ConnectWalletSection from "./ConnectWalletSection";
import DCASection from "./DCASection";
import VAComponent from "./VAComponent";
import TradingViewChartCard from "./ApeProChartCard";
import MiniTradingViewWidget from "./MiniTradingViewWidget";
import { useJupiterQuote } from "@/hooks/useJupiterQuote";
import { useSwap } from "@/context/SwapContext";

// Create Jupiter client
const jupiterQuoteApi = createJupiterApiClient();
const tabs = ["Swap", "Limit", "DCA", "VA"];

/** Type for each tab's config */
interface TabConfig {
  headerTop?: boolean;
  showCancelAll?: boolean;
  additionalProp: string;
  tabs: { id: string; label: string }[];
}

export default function SpotTradeSection() {
  const {
    connected,
    publicKey: connectedWalletPK,
    sendTransaction,
    signTransaction,
  } = useWallet();
  const { tokenList, tokenListLoading } = usePoolContext();

  const initialSellCurrency = tokenList.find(
    (token) => token.address === DEFAULT_SELL_ADDRESS
  );
  const initialBuyCurrency = tokenList.find(
    (token) => token.address === DEFAULT_BUY_ADDRESS
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"sell" | "buy">("sell");
  const [debouncedSellAmount, setDebouncedSellAmount] = useState<
    number | undefined
  >(undefined);
  const { buyAmount, quoteLoading, getJupiterQuote } = useJupiterQuote();
  const {
    sellCurrency,
    setSellCurrency,
    buyCurrency,
    setBuyCurrency,
    sellAmount,
    setSellAmount,
  } = useSwap();
  const [loadingSwap, setLoadingSwap] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filteredTokenList, setFilteredTokenList] = useState<Token[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("Swap");
  const [showChart, setShowChart] = useState(true);
  const [showConnectWallet, setShowConnectWallet] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);


  /**
   * 2) Execute Jupiter Swap
   */
  const executeJupiterSwap = async () => {
    if (!connectedWalletPK || !signTransaction || !sendTransaction) {
      showToast({ message: "Please connect your wallet.", type: "error" });
      return;
    }
    try {
      setLoadingSwap(true);

      const quoteResponse = await getJupiterQuote(
        sellCurrency!,
        buyCurrency!,
        sellAmount
      );
      if (!quoteResponse) throw new Error("Could not get quote from Jupiter");

      const blockhash = await APP_CONNECTION.getLatestBlockhash("confirmed");
      const referralAccountPubkey = new PublicKey(
        FEE_CONFIG.feeAccountReferralPublicKey
      );
      const mint = new PublicKey(buyCurrency!.address);
      const [feeAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("referral_ata"),
          referralAccountPubkey.toBuffer(),
          mint.toBuffer(),
        ],
        new PublicKey(FEE_CONFIG.jupiterReferralProgram)
      );

      const swapObj: SwapResponse = await jupiterQuoteApi.swapPost({
        swapRequest: {
          quoteResponse,
          userPublicKey: connectedWalletPK.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
          feeAccount: feeAccount.toBase58(),
        },
      });

      const transactionFromSwap = VersionedTransaction.deserialize(
        Buffer.from(swapObj.swapTransaction, "base64")
      );
      transactionFromSwap.message.recentBlockhash = blockhash.blockhash;

      const signedTransaction = await signTransaction(transactionFromSwap);
      const RAW_TX = signedTransaction.serialize();

      const signature = await APP_CONNECTION.sendRawTransaction(RAW_TX);
      showToast({
        message: `Swap Transaction Sent. Please wait for confirmation.`,
        type: "info",
      });
      console.log(`Transaction sent: https://solana.fm/tx/${signature}`);

      await APP_CONNECTION.confirmTransaction(signature, "confirmed");
      showToast({
        message: `Swap successful! Transaction: ${signature}`,
        type: "success",
      });
    } catch (error) {
      handleJupiterSwapError(error);
    } finally {
      setLoadingSwap(false);
    }
  };

  /**
   * 3) Handle swap error
   */
  const handleJupiterSwapError = (error: any) => {
    if (error.message?.includes("User rejected the request")) {
      showToast({
        message: "Transaction rejected by user. Please try again.",
        type: "error",
      });
    } else if (error.message?.includes("Attempt to debit an account")) {
      showToast({
        message:
          "Simulation failed: Attempt to debit an account but found no record of a prior credit. Please check your wallet balance or retry.",
        type: "error",
      });
    } else if (error.logs) {
      const logs = error.logs.join("\n");
      showToast({
        message: `Simulation failed with logs: ${logs}`,
        type: "error",
      });
    } else {
      showToast({
        message: `An unexpected error occurred: ${error.message}`,
        type: "error",
      });
    }
    console.error("Error executing Jupiter swap:", error);
  };

  /**
   * 4) Validate Solana Address
   */
  const isValidSolanaAddress = (address: any) => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  };

  /**
   * 5) If token list is ready, set initial tokens
   */
  useEffect(() => {
    if (!tokenListLoading && tokenList.length > 0) {
      setSellCurrency(initialSellCurrency ?? null);
      setBuyCurrency(initialBuyCurrency ?? null);
    }
  }, [tokenList, tokenListLoading]);

  /**
   * 6) Fetch token from external API, with localStorage guarded
   */
  const fetchTokenFromAPI = async (query: any) => {
    try {
      const response = await fetch(`https://tokens.jup.ag/token/${query}`);
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

      const tokenData = await response.json();
      if (tokenData && tokenData.address) {
        const simplifiedTokenData = {
          address: tokenData.address,
          decimals: tokenData.decimals,
          logoURI: tokenData.logoURI,
          symbol: tokenData.symbol,
          isExternal: true,
        };

        /** Wrap localStorage calls in a check for window. */
        if (typeof window !== "undefined") {
          const before_storedTokens = JSON.parse(
            window.localStorage.getItem("externalTokens") || "[]"
          );
          if (
            !before_storedTokens.some(
              (token: any) => token.address === simplifiedTokenData.address
            )
          ) {
            before_storedTokens.push(simplifiedTokenData);
            window.localStorage.setItem(
              "externalTokens",
              JSON.stringify(before_storedTokens)
            );
          }
        }
      } else {
        showToast({
          message: "Token not found on external API.",
          type: "error",
        });
      }

      if (typeof window !== "undefined") {
        const localTokens = JSON.parse(
          window.localStorage.getItem("externalTokens") || "[]"
        );
        const combinedTokenList = [...localTokens, ...tokenList];
        const filteredTokens = combinedTokenList.filter(
          (token) =>
            token.address
              .toLowerCase()
              .includes(debouncedSearchQuery.toLowerCase()) ||
            token.symbol
              .toLowerCase()
              .includes(debouncedSearchQuery.toLowerCase())
        );

        setFilteredTokenList(filteredTokens);
      }
    } catch (error) {
      console.error("Error fetching token from external API:", error);
      showToast({ message: `Failed to fetch token: ${error}`, type: "error" });
    }
  };

  /**
   * 7) Debounce sellAmount
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      if (sellAmount !== undefined && sellAmount > 0) {
        setDebouncedSellAmount(sellAmount);
      } else {
        setDebouncedSellAmount(undefined);
      }
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [sellAmount]);

  /**
   * 8) Debounce searchQuery
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setSearching(false);
    }, 500);

    setSearching(true); // show searching state
    return () => clearTimeout(handler);
  }, [searchQuery]);

  /**
   * 9) When debouncedSellAmount changes, fetch a Jupiter quote
   */
  useEffect(() => {
    if (!sellCurrency || !buyCurrency || debouncedSellAmount === undefined) {
      return;
    }
    getJupiterQuote(sellCurrency, buyCurrency, debouncedSellAmount);
  }, [sellCurrency, buyCurrency, debouncedSellAmount]);

  /**
   * 10) Debounce the search query (again - possible duplication?)
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  /**
   * 11) Filter tokens based on search, with localStorage guarded
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const localTokens = JSON.parse(
        window.localStorage.getItem("externalTokens") || "[]"
      );
      const combinedTokenList = [...localTokens, ...tokenList];

      const filteredTokens = combinedTokenList.filter(
        (token) =>
          token.address
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase()) ||
          token.symbol
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase())
      );

      setFilteredTokenList(filteredTokens);

      // If no match, and user typed something
      if (filteredTokens.length === 0 && debouncedSearchQuery) {
        if (isValidSolanaAddress(debouncedSearchQuery)) {
          fetchTokenFromAPI(debouncedSearchQuery);
        } else {
          showToast({
            message: "Invalid token address. Please check your input.",
            type: "error",
          });
        }
      }
    }
  }, [debouncedSearchQuery, tokenList]);

  /**
   * 12) Handle token selection from the modal
   */
  const handleTokenSelection = (token: Token) => {
    if (modalType === "sell") {
      setSellCurrency(token);
    } else if (modalType === "buy") {
      setBuyCurrency(token);
    }
    setModalOpen(false);
    setSearchQuery(""); // reset search
  };

  /**
   * 13) Render content for each tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case "Swap":
        return (
          <SwapComponent
            tokenListLoading={tokenListLoading}
            sellCurrency={sellCurrency}
            setSellCurrency={setSellCurrency}
            buyCurrency={buyCurrency}
            setBuyCurrency={setBuyCurrency}
            sellAmount={sellAmount}
            setSellAmount={setSellAmount}
            buyAmount={buyAmount}
            quoteLoading={quoteLoading}
            modalType={modalType}
            setModalType={setModalType}
            setModalOpen={setModalOpen}
            connected={connected}
            executeJupiterSwap={() => { }}
            loadingSwap={loadingSwap}
          />
        );
      case "Limit":
        return (
          <LimitComponent
            tokenListLoading={tokenListLoading}
            sellCurrency={sellCurrency}
            setSellCurrency={setSellCurrency}
            buyCurrency={buyCurrency}
            setBuyCurrency={setBuyCurrency}
            sellAmount={sellAmount}
            setSellAmount={setSellAmount}
            buyAmount={buyAmount}
            quoteLoading={quoteLoading}
            modalType={modalType}
            setModalType={setModalType}
            setModalOpen={setModalOpen}
            connected={connected}
            executeJupiterSwap={executeJupiterSwap}
            loadingSwap={loadingSwap}
          />
        );
      case "DCA":
        return (
          <DCASection
            tokenListLoading={tokenListLoading}
            sellCurrency={sellCurrency}
            setSellCurrency={setSellCurrency}
            buyCurrency={buyCurrency}
            setBuyCurrency={setBuyCurrency}
            sellAmount={sellAmount}
            setSellAmount={setSellAmount}
            buyAmount={buyAmount}
            quoteLoading={quoteLoading}
            modalType={modalType}
            setModalType={setModalType}
            setModalOpen={setModalOpen}
            connected={connected}
            executeJupiterSwap={executeJupiterSwap}
            loadingSwap={loadingSwap}
          />
        );
      case "VA":
        return (
          <VAComponent
            tokenListLoading={tokenListLoading}
            sellCurrency={sellCurrency}
            setSellCurrency={setSellCurrency}
            buyCurrency={buyCurrency}
            setBuyCurrency={setBuyCurrency}
            sellAmount={sellAmount}
            setSellAmount={setSellAmount}
            buyAmount={buyAmount}
            quoteLoading={quoteLoading}
            modalType={modalType}
            setModalType={setModalType}
            setModalOpen={setModalOpen}
            connected={connected}
            executeJupiterSwap={executeJupiterSwap}
            loadingSwap={loadingSwap}
          />
        );
      default:
        return null;
    }
  };


  /**
   * 14) Define tab states with index signature
   */
  const tabStates: { [key: string]: TabConfig } = {
    Swap: {
      showCancelAll: false,
      additionalProp: "swap-specific-data",
      tabs: [{ id: "default", label: "Default" }],
    },
    Limit: {
      headerTop: true,
      showCancelAll: true,
      additionalProp: "limit-specific-data",
      tabs: [
        { id: "openOrders", label: "Open Orders" },
        { id: "Order History", label: "Order History" },
      ],
    },
    DCA: {
      headerTop: true,
      showCancelAll: false,
      additionalProp: "dca-specific-data",
      tabs: [
        { id: "activeDCAs", label: "Active DCAs" },
        { id: "pastDCAs", label: "Past DCAs" },
      ],
    },
    VA: {
      headerTop: true,
      showCancelAll: true,
      additionalProp: "va-specific-data",
      tabs: [
        { id: "activeVAs", label: "Active VAs" },
        { id: "pastVAs", label: "Past VAs" },
      ],
    },
  };

  /**
   * 15) Return the main UI
   */
  return (
    <div className="mt-12 p-0 sm:p-4">
      <div className="flex flex-wrap justify-center lg:flex-nowrap w-full lg:w-2/3 gap-4 p-4 m-auto">
        {/* Chart Section with Animation */}
        <AnimatePresence>
          {showChart && (
            <motion.div
              key="chart-section"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="chart-section w-full lg:w-[65%] order-2 lg:order-none"
            >
              <div className="bg-gray-900 rounded-2xl order-2 overflow-hidden hidden md:block">
                <TradingViewChartCard
                  baseToken={sellCurrency ?? undefined}
                  quoteToken={buyCurrency ?? undefined}
                />
              </div>

              {showConnectWallet && (
                <motion.div
                  key="connect-wallet"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="transition-opacity order-4 lg:order-none"
                >
                  {(() => {
                    const { tabs: _, ...rest } = tabStates[activeTab] || {};
                    return (
                      <ConnectWalletSection
                        tabs={tabStates[activeTab]?.tabs || []}
                        defaultActiveTab={
                          tabStates[activeTab]?.tabs?.[0]?.id || ""
                        }
                        {...rest}
                      />
                    );
                  })()}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs Section */}
        <motion.div
          initial={{ width: showChart ? "33%" : "35%", opacity: 0 }}
          animate={{ width: showChart ? "33%" : "35%", opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="tabs-section w-full space-y-3 order-1 lg:order-none"
        >
          <div className="flex md:flex-row items-center justify-between rounded-full w-full">
            <div
              className={`flex items-center px-1 space-x-1 justify-evenly bg-[#192230] rounded-full py-1 ${showChart ? "w-full" : "w-full !mr-12"
                }`}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab !== "Swap") {
                      setShowChart(true);
                    }
                  }}
                  className={`w-full py-3 rounded-full text-sm font-bold transition-all ${activeTab === tab
                      ? "bg-primary/20 text-primary"
                      : "bg-transparent text-white hover:bg-primary/10 hover:text-gray-200"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Right-Side Icons */}
            {activeTab === "Swap" && (
              <div className="flex items-center space-x-1 ml-2">
                <motion.button
                  onClick={() => setShowChart(!showChart)}
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition ${showChart
                      ? "bg-primary/10 text-cyan-400"
                      : "bg-primary-transparent text-white"
                    }`}
                >
                  <AlignHorizontalDistributeCenter size={17} />
                </motion.button>
                <motion.button
                  onClick={() => setShowConnectWallet(!showConnectWallet)}
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition ${showConnectWallet
                      ? "bg-primary/10 text-cyan-400"
                      : "bg-primary-transparent text-white"
                    }`}
                >
                  <Clock size={19} />
                </motion.button>
              </div>
            )}
          </div>

          {showChart && (
            <div className="bg-gray-900 rounded-2xl order-2 overflow-hidden block md:hidden">
              {/* <TradingViewChartCard
                baseToken={sellCurrency}
                quoteToken={buyCurrency}
              /> */}
            </div>
          )}

          {/* Dynamic Tab Content */}
          {renderTabContent()}

          {!showChart && (
            <div className="order-5 lg:order-none">
              <MiniTradingViewWidget />
              <AnimatePresence>
                {showConnectWallet && (
                  <motion.div
                    key="connect-wallet-static"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {(() => {
                      const { tabs: _, ...rest } = tabStates[activeTab] || {};
                      return (
                        <ConnectWalletSection
                          tabs={tabStates[activeTab]?.tabs || []}
                          defaultActiveTab={
                            tabStates[activeTab]?.tabs?.[0]?.id || ""
                          }
                          {...rest}
                        />
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        <div className="fixed inset-x-0 bottom-0 -z-10 h-screen bg-v3-header-background">
          <img
            alt="Spot Background"
            width="2027"
            height="100"
            decoding="async"
            className="absolute bottom-0 w-full object-cover opacity-40 [mask-image:linear-gradient(to_top,rgba(0,0,0,1)_60%,transparent_90%)]"
            sizes="100vw"
            src={Spotbg.src}
            style={{ color: "transparent", width: "100%", height: "auto" }}
          />
        </div>
      </div>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onTokenSelect={handleTokenSelection}
        />
      )}
    </div>
  );
}
