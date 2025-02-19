import { useEffect, useState } from "react";

interface TradingViewChartProps {
  baseSym: string;
  quoteSym: string;
  baseTokenAddress: string;
  quoteTokenAddress: string;
}

export function TradingViewChart({
  baseSym,
  quoteSym,
  baseTokenAddress,
  quoteTokenAddress,
}: TradingViewChartProps) {
  const [candleData, setCandleData] = useState<any>(null);

  // Fetching data from the API when the component is mounted
  useEffect(() => {
    const fetchCandleData = async () => {
      try {
        const response = await fetch(
          `https://fe-api.jup.ag/api/v1/charts/${baseTokenAddress}?quote_address=${quoteTokenAddress}&type=15m&time_from=1739685349&time_to=1739955349`
        );
        const data = await response.json();
        console.log("🚀 ~ fetchCandleData ~ data:", data)
        setCandleData(data);
      } catch (error) {
        console.error("Error fetching candle data", error);
      }
    };

    fetchCandleData();
  }, [quoteTokenAddress]);

  // Prepare the TradingView URL dynamically based on the token addresses
  const tradingViewUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_b51c4&symbol=${baseSym}${quoteSym}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=dark&studies=%5B%5D&theme=dark&style=1&timezone=exchange`;

  return (
    <div className="rounded-xl overflow-hidden w-full">
      <iframe
        title="TradingView Chart"
        src={tradingViewUrl}
        frameBorder="0"
        className="w-full !border-none"
           style={{ height: "385px", minHeight: "300px" }}
      />
    </div>
  );
}
