import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { RiskMetrics } from "@/utils/portfolioAnalysis";

interface PortfolioHealthScoreProps {
  riskMetrics: RiskMetrics;
  annualizedReturn: number;
  maxDrawdown: number;
}

export function PortfolioHealthScore({ 
  riskMetrics, 
  annualizedReturn, 
  maxDrawdown 
}: PortfolioHealthScoreProps) {
  // Calculate health score based on multiple factors
  const calculateHealthScore = () => {
    let score = 0;
    let maxScore = 0;
    
    // Sharpe Ratio (0-30 points)
    maxScore += 30;
    if (riskMetrics.sharpeRatio > 1.5) score += 30;
    else if (riskMetrics.sharpeRatio > 1.0) score += 25;
    else if (riskMetrics.sharpeRatio > 0.5) score += 15;
    else if (riskMetrics.sharpeRatio > 0) score += 5;
    
    // Volatility (0-20 points) - lower is better
    maxScore += 20;
    if (riskMetrics.volatility < 10) score += 20;
    else if (riskMetrics.volatility < 15) score += 15;
    else if (riskMetrics.volatility < 25) score += 10;
    else if (riskMetrics.volatility < 35) score += 5;
    
    // Max Drawdown (0-20 points) - lower is better
    maxScore += 20;
    if (maxDrawdown < 5) score += 20;
    else if (maxDrawdown < 10) score += 15;
    else if (maxDrawdown < 20) score += 10;
    else if (maxDrawdown < 30) score += 5;
    
    // Calmar Ratio (0-15 points)
    maxScore += 15;
    if (riskMetrics.calmarRatio > 2) score += 15;
    else if (riskMetrics.calmarRatio > 1) score += 10;
    else if (riskMetrics.calmarRatio > 0.5) score += 5;
    
    // Information Ratio (0-15 points)
    maxScore += 15;
    if (riskMetrics.informationRatio > 1) score += 15;
    else if (riskMetrics.informationRatio > 0.5) score += 10;
    else if (riskMetrics.informationRatio > 0) score += 5;
    
    return Math.round((score / maxScore) * 100);
  };

  const healthScore = calculateHealthScore();
  
  const getHealthLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "text-green-600", bgColor: "bg-green-100" };
    if (score >= 60) return { level: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (score >= 40) return { level: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    return { level: "Poor", color: "text-red-600", bgColor: "bg-red-100" };
  };

  const healthLevel = getHealthLevel(healthScore);

  // Risk level assessment
  const getRiskLevel = () => {
    if (riskMetrics.volatility < 15 && maxDrawdown < 10) return "Low Risk";
    if (riskMetrics.volatility < 25 && maxDrawdown < 20) return "Moderate Risk";
    return "High Risk";
  };

  const riskLevel = getRiskLevel();

  // Diversification score (simplified based on correlation)
  const getDiversificationScore = () => {
    const avgCorrelation = (Math.abs(riskMetrics.beta.sha) + Math.abs(riskMetrics.beta.she) + Math.abs(riskMetrics.beta.csi300)) / 3;
    if (avgCorrelation < 0.5) return 90;
    if (avgCorrelation < 0.8) return 70;
    if (avgCorrelation < 1.2) return 50;
    return 30;
  };

  const diversificationScore = getDiversificationScore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Portfolio Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Health Score */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${healthLevel.color}`}>
            {healthScore}
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            Overall Health Score
          </div>
          <Badge className={`${healthLevel.bgColor} ${healthLevel.color} border-0`}>
            {healthLevel.level}
          </Badge>
        </div>

        <Progress value={healthScore} className="h-2" />

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk Level</span>
              <Badge 
                variant="outline" 
                className={
                  riskLevel === "Low Risk" ? "text-green-600 border-green-600" :
                  riskLevel === "Moderate Risk" ? "text-yellow-600 border-yellow-600" :
                  "text-red-600 border-red-600"
                }
              >
                {riskLevel}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Diversification</span>
              <Badge variant="outline">
                {diversificationScore}%
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volatility</span>
              <Badge 
                variant="outline"
                className={
                  riskMetrics.volatility < 15 ? "text-green-600" :
                  riskMetrics.volatility < 25 ? "text-yellow-600" :
                  "text-red-600"
                }
              >
                {riskMetrics.volatility.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sharpe Ratio</span>
              <Badge 
                variant="outline"
                className={
                  riskMetrics.sharpeRatio > 1 ? "text-green-600" :
                  riskMetrics.sharpeRatio > 0.5 ? "text-yellow-600" :
                  "text-red-600"
                }
              >
                {riskMetrics.sharpeRatio.toFixed(2)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Health Recommendations */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Health Assessment</h4>
          <div className="space-y-2 text-sm">
            {healthScore >= 80 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Excellent portfolio health with strong risk-adjusted returns</span>
              </div>
            )}
            {healthScore >= 60 && healthScore < 80 && (
              <div className="flex items-center gap-2 text-blue-600">
                <Shield className="h-4 w-4" />
                <span>Good portfolio health with room for improvement</span>
              </div>
            )}
            {healthScore >= 40 && healthScore < 60 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Fair portfolio health - consider risk management improvements</span>
              </div>
            )}
            {healthScore < 40 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Poor portfolio health - significant improvements needed</span>
              </div>
            )}
            
            {riskMetrics.volatility > 25 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>High volatility - consider diversification</span>
              </div>
            )}
            
            {maxDrawdown > 20 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Large drawdowns - review risk management strategy</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}