import React, { useEffect, useState } from "react";

const TradingViewWidget = ({ baseToken = "SOL", quoteToken = "USDT", interval = "1h" }) => {
  const [symbol, setSymbol] = useState(`BINANCE:${baseToken}${quoteToken}`);

  useEffect(() => {
    setSymbol(`BINANCE:${baseToken}${quoteToken}`);
  }, [baseToken, quoteToken]);

  return (
    <div className="tradingview-widget-container w-full h-[400px] rounded-xl overflow-hidden">
      <iframe
        title="TradingView Chart"
        src={`https://s3.tradingview.com/widgetembed/?symbol=${symbol}&interval=${interval}&theme=dark&style=1&timezone=Etc/UTC&locale=en&hidesidetoolbar=1`}
        frameBorder="0"
        className="w-full h-full"
      />
    </div>
  );
};

export default TradingViewWidget;
