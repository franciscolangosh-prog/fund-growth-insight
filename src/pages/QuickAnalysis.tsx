import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, PieChart, Activity, Upload } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AnnualReturnsTable } from "@/components/AnnualReturnsTable";
import { CorrelationCard } from "@/components/CorrelationCard";
import { InvestmentAnalysis } from "@/components/InvestmentAnalysis";
import { InvestmentBehaviorAnalysis } from "@/components/InvestmentBehaviorAnalysis";
import { QuickInsightsCard } from "@/components/QuickInsightsCard";
import { RiskMetricsCard } from "@/components/RiskMetricsCard";
import { DrawdownChart } from "@/components/DrawdownChart";
import { RollingReturnsChart } from "@/components/RollingReturnsChart";
import { ReturnsBoxPlot } from "@/components/ReturnsBoxPlot";
import { InvestmentGrowthCalculator } from "@/components/InvestmentGrowthCalculator";
import { MonthlyReturnsHeatmap } from "@/components/MonthlyReturnsHeatmap";
import { BestWorstPeriodsCard } from "@/components/BestWorstPeriodsCard";
import { RiskAdjustedComparison } from "@/components/RiskAdjustedComparison";
import { VolatilityChart } from "@/components/VolatilityChart";
import { LocalPortfolioSelector } from "@/components/LocalPortfolioSelector";
import { LocalFileUpload } from "@/components/LocalFileUpload";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateCorrelations,
  calculateAnnualReturns,
  calculateOverallMetrics,
  PortfolioData,
} from "@/utils/portfolioAnalysis";
import {
  loadPortfolioFromLocal,
  listLocalPortfolios,
  LocalPortfolio,
} from "@/utils/localPortfolioStorage";

const QuickAnalysis = () => {
  const [data, setData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<LocalPortfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const loadPortfoliosList = () => {
    const portfolioList = listLocalPortfolios();
    setPortfolios(portfolioList);

    if (portfolioList.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolioList[0].id);
    } else if (portfolioList.length === 0) {
      setSelectedPortfolioId(null);
      setData([]);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const portfolioList = listLocalPortfolios();
      setPortfolios(portfolioList);

      if (portfolioList.length > 0) {
        setSelectedPortfolioId(portfolioList[0].id);
        const portfolioData = await loadPortfolioFromLocal(portfolioList[0].id);
        setData(portfolioData);
      }

      setLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    const loadSelectedPortfolio = async () => {
      if (selectedPortfolioId) {
        const portfolioData = await loadPortfolioFromLocal(selectedPortfolioId);
        setData(portfolioData);
      }
    };

    loadSelectedPortfolio();
  }, [selectedPortfolioId]);

  const handleFileUploaded = async () => {
    const portfolioList = listLocalPortfolios();
    setPortfolios(portfolioList);
    
    if (portfolioList.length > 0) {
      setSelectedPortfolioId(portfolioList[0].id);
      const portfolioData = await loadPortfolioFromLocal(portfolioList[0].id);
      setData(portfolioData);
    }
    
    setShowUpload(false);
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Loading...</h2>
          </div>
        </div>
      </>
    );
  }

  if (data.length === 0 || portfolios.length === 0) {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-3.5rem)] bg-background p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Quick Portfolio Analysis</h1>
              <p className="text-muted-foreground">
                Analyze your portfolio performance without creating an account
              </p>
            </div>
            
            <PrivacyNotice />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Get Started
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with your portfolio data to start analyzing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocalFileUpload onFileUploaded={handleFileUploaded} />
              </CardContent>
            </Card>
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Quick Portfolio Analysis</h1>
              <p className="text-muted-foreground">
                Private analysis — your data stays in your browser
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowUpload(!showUpload)}>
              <Upload className="h-4 w-4 mr-2" />
              {showUpload ? "Hide Upload" : "Upload New Portfolio"}
            </Button>
          </div>

          <PrivacyNotice variant="compact" />

          {showUpload && (
            <LocalFileUpload onFileUploaded={handleFileUploaded} />
          )}

          <LocalPortfolioSelector
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
              subtitle="vs Avg(SHA, SHE, CSI300)"
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
                nikkei225: metrics.nikkei225Annualized,
                tsx: metrics.tsxAnnualized,
                klse: metrics.klseAnnualized,
                cac40: metrics.cac40Annualized,
                dax: metrics.daxAnnualized,
                sti: metrics.stiAnnualized,
                asx200: metrics.asx200Annualized,
              }}
              outperformance={metrics.annualizedOutperformance}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InvestmentBehaviorAnalysis data={data} />
            <QuickInsightsCard data={data} annualReturns={annualReturns} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <RiskMetricsCard data={data} />
            <BestWorstPeriodsCard data={data} />
          </div>

          <DrawdownChart data={data} />

          <RollingReturnsChart data={data} />

          <ReturnsBoxPlot data={data} />

          <VolatilityChart data={data} />

          <RiskAdjustedComparison data={data} />

          <InvestmentGrowthCalculator data={data} />

          <MonthlyReturnsHeatmap data={data} />

          <AnnualReturnsTable returns={annualReturns} data={data} />
        </div>
      </div>
    </>
  );
};

export default QuickAnalysis;
