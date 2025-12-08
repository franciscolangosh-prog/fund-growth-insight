import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnnualReturn, PortfolioData } from "@/utils/portfolioAnalysis";

interface AnnualReturnsTableProps {
  returns: AnnualReturn[];
  data: PortfolioData[];
}

export function AnnualReturnsTable({ returns, data }: AnnualReturnsTableProps) {
  const getBestPerformer = (row: AnnualReturn) => {
    const indices = [
      { name: 'Fund', value: row.fundReturn },
      { name: 'SHA', value: row.shaReturn },
      { name: 'SHE', value: row.sheReturn },
      { name: 'CSI300', value: row.csi300Return },
      { name: 'S&P500', value: row.sp500Return },
      { name: 'Nasdaq', value: row.nasdaqReturn },
      { name: 'FTSE100', value: row.ftse100Return },
      { name: 'HangSeng', value: row.hangsengReturn },
    ];
    return indices.reduce((best, current) => current.value > best.value ? current : best);
  };

  // Calculate annualized returns for the whole period
  const calculateAnnualizedReturns = () => {
    if (data.length === 0) {
      return {
        fundAnnualized: 0,
        shaAnnualized: 0,
        sheAnnualized: 0,
        csi300Annualized: 0,
        sp500Annualized: 0,
        nasdaqAnnualized: 0,
        ftse100Annualized: 0,
        hangsengAnnualized: 0,
      };
    }

    const first = data[0];
    const last = data[data.length - 1];
    const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    if (years <= 0) {
      return {
        fundAnnualized: 0,
        shaAnnualized: 0,
        sheAnnualized: 0,
        csi300Annualized: 0,
        sp500Annualized: 0,
        nasdaqAnnualized: 0,
        ftse100Annualized: 0,
        hangsengAnnualized: 0,
      };
    }

    // Helper to find the first valid value (searching forward from start)
    const findFirstValidValue = (field: keyof PortfolioData): number => {
      for (let i = 0; i < data.length; i++) {
        if (Number(data[i][field]) > 0) {
          return Number(data[i][field]);
        }
      }
      return 0;
    };

    // Helper to find the last valid value (searching backward from end)
    const findLastValidValue = (field: keyof PortfolioData): number => {
      for (let i = data.length - 1; i >= 0; i--) {
        if (Number(data[i][field]) > 0) {
          return Number(data[i][field]);
        }
      }
      return 0;
    };

    // Find first and last valid values for global indices
    const sp500First = findFirstValidValue('sp500');
    const sp500Last = findLastValidValue('sp500');
    const nasdaqFirst = findFirstValidValue('nasdaq');
    const nasdaqLast = findLastValidValue('nasdaq');
    const ftse100First = findFirstValidValue('ftse100');
    const ftse100Last = findLastValidValue('ftse100');
    const hangsengFirst = findFirstValidValue('hangseng');
    const hangsengLast = findLastValidValue('hangseng');

    return {
      fundAnnualized: (Math.pow(last.shareValue / first.shareValue, 1 / years) - 1) * 100,
      shaAnnualized: (Math.pow(last.sha / first.sha, 1 / years) - 1) * 100,
      sheAnnualized: (Math.pow(last.she / first.she, 1 / years) - 1) * 100,
      csi300Annualized: (Math.pow(last.csi300 / first.csi300, 1 / years) - 1) * 100,
      sp500Annualized: sp500First > 0 && sp500Last > 0 ? (Math.pow(sp500Last / sp500First, 1 / years) - 1) * 100 : 0,
      nasdaqAnnualized: nasdaqFirst > 0 && nasdaqLast > 0 ? (Math.pow(nasdaqLast / nasdaqFirst, 1 / years) - 1) * 100 : 0,
      ftse100Annualized: ftse100First > 0 && ftse100Last > 0 ? (Math.pow(ftse100Last / ftse100First, 1 / years) - 1) * 100 : 0,
      hangsengAnnualized: hangsengFirst > 0 && hangsengLast > 0 ? (Math.pow(hangsengLast / hangsengFirst, 1 / years) - 1) * 100 : 0,
    };
  };

  const annualized = calculateAnnualizedReturns();

  // Get best performer for annualized returns row
  const getBestAnnualized = () => {
    const indices = [
      { name: 'Fund', value: annualized.fundAnnualized },
      { name: 'SHA', value: annualized.shaAnnualized },
      { name: 'SHE', value: annualized.sheAnnualized },
      { name: 'CSI300', value: annualized.csi300Annualized },
      { name: 'S&P500', value: annualized.sp500Annualized },
      { name: 'Nasdaq', value: annualized.nasdaqAnnualized },
      { name: 'FTSE100', value: annualized.ftse100Annualized },
      { name: 'HangSeng', value: annualized.hangsengAnnualized },
    ];
    return indices.reduce((best, current) => (current.value > 0 && current.value > best.value) ? current : best);
  };

  const bestAnnualized = getBestAnnualized();

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Annual Returns Comparison (All Markets)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Fund</TableHead>
              <TableHead className="text-right">SHA</TableHead>
              <TableHead className="text-right">SHE</TableHead>
              <TableHead className="text-right">CSI300</TableHead>
              <TableHead className="text-right">S&P500</TableHead>
              <TableHead className="text-right">Nasdaq</TableHead>
              <TableHead className="text-right">FTSE100</TableHead>
              <TableHead className="text-right">HangSeng</TableHead>
              <TableHead className="text-right">Best</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((row) => {
              const best = getBestPerformer(row);
              return (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className={`text-right font-semibold ${row.fundReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.fundReturn.toFixed(2)}%
                  </TableCell>
                  <TableCell className={`text-right ${row.shaReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.shaReturn.toFixed(2)}%
                  </TableCell>
                  <TableCell className={`text-right ${row.sheReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.sheReturn.toFixed(2)}%
                  </TableCell>
                  <TableCell className={`text-right ${row.csi300Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.csi300Return.toFixed(2)}%
                  </TableCell>
                  <TableCell className={`text-right ${row.sp500Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.sp500Return !== 0 ? `${row.sp500Return.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${row.nasdaqReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.nasdaqReturn !== 0 ? `${row.nasdaqReturn.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${row.ftse100Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.ftse100Return !== 0 ? `${row.ftse100Return.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${row.hangsengReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.hangsengReturn !== 0 ? `${row.hangsengReturn.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {best.name}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Summary row with annualized returns */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell className="font-bold">Annualized Return</TableCell>
              <TableCell className={`text-right font-bold ${annualized.fundAnnualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.fundAnnualized.toFixed(2)}%
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.shaAnnualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.shaAnnualized.toFixed(2)}%
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.sheAnnualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.sheAnnualized.toFixed(2)}%
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.csi300Annualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.csi300Annualized.toFixed(2)}%
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.sp500Annualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.sp500Annualized !== 0 ? `${annualized.sp500Annualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.nasdaqAnnualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.nasdaqAnnualized !== 0 ? `${annualized.nasdaqAnnualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.ftse100Annualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.ftse100Annualized !== 0 ? `${annualized.ftse100Annualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.hangsengAnnualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.hangsengAnnualized !== 0 ? `${annualized.hangsengAnnualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className="text-right font-bold text-primary">
                {bestAnnualized.name}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
