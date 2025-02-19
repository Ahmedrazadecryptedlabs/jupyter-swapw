import React from "react";

interface TradingViewEmbedProps {
  baseSym: string;
  quoteSym: string;
}

const TradingViewEmbed: React.FC<TradingViewEmbedProps> = ({ baseSym, quoteSym }) => (
  <div className="rounded-xl overflow-hidden w-full">
    <iframe
      title="TradingView Chart"
      src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_b51c4&symbol=${baseSym}${quoteSym}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=dark&studies=%5B%5D&theme=dark&style=1&timezone=exchange`}
      frameBorder="0"
      className="w-full !border-none"
      style={{ height: "385px", minHeight: "300px" }}
    />
  </div>
);

export default TradingViewEmbed;
