import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, PieChart, Activity } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AnnualReturnsTable } from "@/components/AnnualReturnsTable";
import { CorrelationCard } from "@/components/CorrelationCard";
import { InvestmentAnalysis } from "@/components/InvestmentAnalysis";
import { InvestmentBehaviorAnalysis } from "@/components/InvestmentBehaviorAnalysis";
import { FileUpload } from "@/components/FileUpload";
import { PortfolioSelector } from "@/components/PortfolioSelector";
import {
  parseCSV,
  calculateCorrelations,
  calculateAnnualReturns,
  calculateOverallMetrics,
  PortfolioData,
} from "@/utils/portfolioAnalysis";
import {
  savePortfolioToDatabase,
  loadPortfolioFromDatabase,
  listPortfolios,
} from "@/utils/portfolioDatabase";

const Index = () => {
  const [data, setData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  const loadPortfolios = async () => {
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
        // Load first portfolio from database
        setSelectedPortfolioId(portfolioList[0].id);
        const portfolioData = await loadPortfolioFromDatabase(portfolioList[0].id);
        setData(portfolioData);
      } else {
        // Load default CSV and save to database
        try {
          const response = await fetch("/PORTFOLIO_SNAPSHOT.csv");
          const csvText = await response.text();
          const parsedData = parseCSV(csvText);
          
          const portfolioId = await savePortfolioToDatabase("Default Portfolio", parsedData);
          if (portfolioId) {
            setSelectedPortfolioId(portfolioId);
            await loadPortfolios();
          }
          setData(parsedData);
        } catch (error) {
          console.error("Error loading default portfolio data:", error);
        }
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

  const handleFileUploaded = async () => {
    await loadPortfolios();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading Portfolio Data...</h2>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error Loading Data</h2>
          <p className="text-muted-foreground mt-2">Please check the data file.</p>
        </div>
      </div>
    );
  }

  const metrics = calculateOverallMetrics(data);
  const correlations = calculateCorrelations(data);
  const annualReturns = calculateAnnualReturns(data);

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-background p-8">
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
          onPortfoliosChange={loadPortfolios}
        />

        <FileUpload onFileUploaded={handleFileUploaded} />

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
            outperformance={metrics.annualizedOutperformance}
          />
        </div>

        <InvestmentBehaviorAnalysis data={data} />

        <AnnualReturnsTable returns={annualReturns} />
      </div>
    </div>
  );
};

export default Index;
