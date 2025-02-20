'use client'
import TrendingTokensList from '@/components/Tokens/TokenCard';
import TrendingTokensHeader from '@/components/Tokens/TokenHeader';
import TokenTable from '@/components/Tokens/TokenTable';
import TopNavigation from '@/components/ui/TopNavigation'
import React, { useEffect, useState } from 'react'
import TokenNotificationBanner from '@/components/Tokens/TokenNotificationBanner';

// Types
interface TrendingToken {
    address: string;
    name: string;
    symbol: string;
    icon: string;
    mcap: number;
    fdv: number;
    volume24h: number;
    liquidity: number;
    organicScore: number;
    organicVolume: number;
    tags: string[];
}

// Utility function for number formatting
const formatNumber = (num: number) => {
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(1)}`;
};

// Main layout component
const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-full h-full  bg-v3-header-background">
        <TopNavigation />
        <div className="w-full bg-[#151F29]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </div>
        </div>
    </div>
);

// Main content component
const TokensContent: React.FC<{ trendingTokens: TrendingToken[] }> = ({ trendingTokens }) => (
    <>
        <TokenNotificationBanner />
        <TrendingTokensHeader />
        <div className="overflow-x-auto">
            <TokenTable trendingTokens={trendingTokens} formatNumber={formatNumber} />
            <TrendingTokensList trendingTokens={trendingTokens} formatNumber={formatNumber} />
        </div>
    </>
);

// Main page component
const TokensPage = () => {
    const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);

    useEffect(() => {
        const fetchTrendingTokens = async () => {
            try {
                const response = await fetch('https://fe-api.jup.ag/api/v1/tokens/trending');
                const data = await response.json();
                setTrendingTokens(data.trending);
            } catch (error) {
                console.log('Error fetching trending tokens:', error);
            }
        };

        fetchTrendingTokens();
    }, []);

    return (
        <PageLayout>
            <TokensContent trendingTokens={trendingTokens} />
        </PageLayout>
    );
};

export default TokensPage;