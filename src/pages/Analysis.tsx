import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, PieChart, Activity } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AnnualReturnsTable } from "@/components/AnnualReturnsTable";
import { CorrelationCard } from "@/components/CorrelationCard";
import { InvestmentAnalysis } from "@/components/InvestmentAnalysis";
import { InvestmentBehaviorAnalysis } from "@/components/InvestmentBehaviorAnalysis";
import { PortfolioSelector } from "@/components/PortfolioSelector";
import { Navigation } from "@/components/Navigation";
import {
  calculateCorrelations,
  calculateAnnualReturns,
  calculateOverallMetrics,
  PortfolioData,
} from "@/utils/portfolioAnalysis";
import {
  loadPortfolioFromDatabase,
  listPortfolios,
} from "@/utils/portfolioDatabase";

const Analysis = () => {
  const [data, setData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  const loadPortfoliosList = async () => {
    const portfolioList = await listPortfolios();
    setPortfolios(portfolioList);
    
    if (portfolioList.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolioList[0].id);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const portfolioList = await listPortfolios();
      setPortfolios(portfolioList);

      if (portfolioList.length > 0) {
        setSelectedPortfolioId(portfolioList[0].id);
        const portfolioData = await loadPortfolioFromDatabase(portfolioList[0].id);
        setData(portfolioData);
      }
      
      setLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    const loadSelectedPortfolio = async () => {
      if (selectedPortfolioId) {
        const portfolioData = await loadPortfolioFromDatabase(selectedPortfolioId);
        setData(portfolioData);
      }
    };

    loadSelectedPortfolio();
  }, [selectedPortfolioId]);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Loading Portfolio Data...</h2>
          </div>
        </div>
      </>
    );
  }

  if (data.length === 0) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">No Data Available</h2>
            <p className="text-muted-foreground mt-2">
              Please upload portfolio data in the Data Management page first.
            </p>
          </div>
        </div>
      </>
    );
  }

  const metrics = calculateOverallMetrics(data);
  const correlations = calculateCorrelations(data);
  const annualReturns = calculateAnnualReturns(data);

  if (!metrics) return null;

  return (
    <>
      <Navigation />
      <div className="min-h-[calc(100vh-3.5rem)] bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Portfolio Performance Analysis</h1>
            <p className="text-muted-foreground">
              Comprehensive analysis from 2014 to 2025
            </p>
          </div>

          <PortfolioSelector
            portfolios={portfolios}
            selectedPortfolioId={selectedPortfolioId}
            onSelectPortfolio={setSelectedPortfolioId}
            onPortfoliosChange={loadPortfoliosList}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Current Share Value"
              value={`¥${metrics.currentShareValue.toFixed(4)}`}
              icon={DollarSign}
            />
            <MetricCard
              title="Annualized Return"
              value={`${metrics.annualizedReturn.toFixed(2)}%`}
              icon={TrendingUp}
              trend={metrics.annualizedReturn}
            />
            <MetricCard
              title="Total Return"
              value={`${metrics.totalReturn.toFixed(2)}%`}
              icon={Activity}
              trend={metrics.totalReturn}
            />
            <MetricCard
              title="Outperformance vs Benchmarks"
              value={`${metrics.outperformance > 0 ? '+' : ''}${metrics.outperformance.toFixed(2)}%`}
              icon={PieChart}
              trend={metrics.outperformance}
            />
          </div>

          <PerformanceChart data={data} />

          <div className="grid gap-4 md:grid-cols-2">
            <CorrelationCard correlations={correlations} />
            <InvestmentAnalysis
              annualizedReturn={metrics.annualizedReturn}
              totalReturn={metrics.totalReturn}
              correlations={correlations}
              benchmarkReturns={{
                sha: metrics.shaAnnualized,
                she: metrics.sheAnnualized,
                csi300: metrics.csi300Annualized,
                avgBenchmark: metrics.avgBenchmarkAnnualized,
              }}
              globalIndices={{
                sp500: metrics.sp500Annualized,
                nasdaq: metrics.nasdaqAnnualized,
                ftse100: metrics.ftse100Annualized,
                hangseng: metrics.hangsengAnnualized,
              }}
              outperformance={metrics.annualizedOutperformance}
            />
          </div>

          <InvestmentBehaviorAnalysis data={data} />

          <AnnualReturnsTable returns={annualReturns} data={data} />
        </div>
      </div>
    </>
  );
};

export default Analysis;
