import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { PortfolioData } from '@/utils/portfolioAnalysis';

interface InvestmentGrowthCalculatorProps {
  data: PortfolioData[];
}

export function InvestmentGrowthCalculator({ data }: InvestmentGrowthCalculatorProps) {
  const [investmentAmount, setInvestmentAmount] = useState<string>("10000");
  const [startDateIndex, setStartDateIndex] = useState<string>("0");

  // Get available years for the dropdown
  const availableYears = useMemo(() => {
    const years: Array<{ index: number; year: number; date: string }> = [];
    let lastYear = -1;
    
    data.forEach((d, index) => {
      const year = new Date(d.date).getFullYear();
      if (year !== lastYear) {
        years.push({ index, year, date: d.date });
        lastYear = year;
      }
    });
    
    return years;
  }, [data]);

  const results = useMemo(() => {
    const amount = parseFloat(investmentAmount) || 0;
    const startIdx = parseInt(startDateIndex) || 0;
    
    if (amount <= 0 || startIdx >= data.length - 1 || data.length === 0) {
      return null;
    }

    const startData = data[startIdx];
    const endData = data[data.length - 1];
    
    const startDate = new Date(startData.date);
    const endDate = new Date(endData.date);
    const years = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    // Fund growth
    const fundGrowthRate = endData.shareValue / startData.shareValue;
    const fundEndValue = amount * fundGrowthRate;
    const fundTotalReturn = (fundGrowthRate - 1) * 100;
    const fundAnnualizedReturn = (Math.pow(fundGrowthRate, 1 / years) - 1) * 100;

    // CSI300 comparison
    const csi300GrowthRate = startData.csi300 > 0 ? endData.csi300 / startData.csi300 : 1;
    const csi300EndValue = amount * csi300GrowthRate;
    const csi300TotalReturn = (csi300GrowthRate - 1) * 100;

    // S&P500 comparison
    const sp500GrowthRate = startData.sp500 > 0 && endData.sp500 > 0 
      ? endData.sp500 / startData.sp500 
      : null;
    const sp500EndValue = sp500GrowthRate ? amount * sp500GrowthRate : null;
    const sp500TotalReturn = sp500GrowthRate ? (sp500GrowthRate - 1) * 100 : null;

    // Bank deposit comparison (assume 3% annual)
    const bankRate = 0.03;
    const bankEndValue = amount * Math.pow(1 + bankRate, years);
    const bankTotalReturn = (bankEndValue / amount - 1) * 100;

    return {
      startDate: startData.date,
      endDate: endData.date,
      years,
      initialAmount: amount,
      fund: {
        endValue: fundEndValue,
        totalReturn: fundTotalReturn,
        annualizedReturn: fundAnnualizedReturn,
        profit: fundEndValue - amount,
      },
      csi300: {
        endValue: csi300EndValue,
        totalReturn: csi300TotalReturn,
        profit: csi300EndValue - amount,
      },
      sp500: sp500EndValue ? {
        endValue: sp500EndValue,
        totalReturn: sp500TotalReturn!,
        profit: sp500EndValue - amount,
      } : null,
      bank: {
        endValue: bankEndValue,
        totalReturn: bankTotalReturn,
        profit: bankEndValue - amount,
      },
      outperformance: {
        vsCsi300: fundEndValue - csi300EndValue,
        vsSp500: sp500EndValue ? fundEndValue - sp500EndValue : null,
        vsBank: fundEndValue - bankEndValue,
      },
    };
  }, [data, investmentAmount, startDateIndex]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-green-500" />
          Investment Growth Calculator
        </CardTitle>
        <CardDescription>
          "What if I invested ¥X on date Y?" - Model historical scenarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Investment Amount (¥)
            </Label>
            <Input
              id="amount"
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              placeholder="10000"
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Starting Year
            </Label>
            <Select value={startDateIndex} onValueChange={setStartDateIndex}>
              <SelectTrigger>
                <SelectValue placeholder="Select start year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y.index} value={y.index.toString()}>
                    {y.year} ({new Date(y.date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {results && (
          <>
            {/* Period Info */}
            <div className="p-3 bg-muted/30 rounded-lg text-sm">
              <p>
                <strong>Investment Period:</strong>{' '}
                {new Date(results.startDate).toLocaleDateString()} → {new Date(results.endDate).toLocaleDateString()}{' '}
                ({results.years.toFixed(1)} years)
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fund Result - Primary */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <span className="font-semibold text-indigo-600">This Fund</span>
                </div>
                <p className="text-3xl font-bold">¥{results.fund.endValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className={results.fund.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Profit: {results.fund.profit >= 0 ? '+' : ''}¥{results.fund.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-muted-foreground">
                    Total Return: {results.fund.totalReturn >= 0 ? '+' : ''}{results.fund.totalReturn.toFixed(1)}%
                  </p>
                  <p className="text-muted-foreground">
                    Annualized: {results.fund.annualizedReturn >= 0 ? '+' : ''}{results.fund.annualizedReturn.toFixed(1)}%/year
                  </p>
                </div>
              </div>

              {/* CSI300 Comparison */}
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-green-600">CSI 300 Index</span>
                </div>
                <p className="text-2xl font-bold">¥{results.csi300.endValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className={results.csi300.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Profit: {results.csi300.profit >= 0 ? '+' : ''}¥{results.csi300.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-muted-foreground">
                    Total Return: {results.csi300.totalReturn >= 0 ? '+' : ''}{results.csi300.totalReturn.toFixed(1)}%
                  </p>
                  <p className={`font-semibold ${results.outperformance.vsCsi300 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Fund {results.outperformance.vsCsi300 >= 0 ? 'beats' : 'lags'} by ¥{Math.abs(results.outperformance.vsCsi300).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* S&P500 Comparison */}
              {results.sp500 && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-red-600">S&P 500 Index</span>
                  </div>
                  <p className="text-2xl font-bold">¥{results.sp500.endValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className={results.sp500.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Profit: {results.sp500.profit >= 0 ? '+' : ''}¥{results.sp500.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-muted-foreground">
                      Total Return: {results.sp500.totalReturn >= 0 ? '+' : ''}{results.sp500.totalReturn.toFixed(1)}%
                    </p>
                    <p className={`font-semibold ${results.outperformance.vsSp500! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Fund {results.outperformance.vsSp500! >= 0 ? 'beats' : 'lags'} by ¥{Math.abs(results.outperformance.vsSp500!).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              )}

              {/* Bank Deposit Comparison */}
              <div className="p-4 bg-gray-50 dark:bg-gray-950/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-600">Bank Deposit (3%)</span>
                </div>
                <p className="text-2xl font-bold">¥{results.bank.endValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-green-600">
                    Profit: +¥{results.bank.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-muted-foreground">
                    Total Return: +{results.bank.totalReturn.toFixed(1)}%
                  </p>
                  <p className={`font-semibold ${results.outperformance.vsBank >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Fund {results.outperformance.vsBank >= 0 ? 'beats' : 'lags'} by ¥{Math.abs(results.outperformance.vsBank).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">
                A ¥{parseFloat(investmentAmount).toLocaleString()} investment in this fund starting in {new Date(results.startDate).getFullYear()} would 
                be worth <strong className="text-foreground">¥{results.fund.endValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong> today, 
                {results.fund.profit >= 0 
                  ? ` a gain of ¥${results.fund.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${results.fund.totalReturn.toFixed(1)}%).`
                  : ` a loss of ¥${Math.abs(results.fund.profit).toLocaleString('en-US', { maximumFractionDigits: 0 })} (${results.fund.totalReturn.toFixed(1)}%).`}
                {' '}This {results.outperformance.vsCsi300 >= 0 ? 'outperforms' : 'underperforms'} the CSI300 index by ¥{Math.abs(results.outperformance.vsCsi300).toLocaleString('en-US', { maximumFractionDigits: 0 })}.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
