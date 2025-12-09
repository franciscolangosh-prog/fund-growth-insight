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
      { name: 'Nikkei225', value: row.nikkei225Return },
      { name: 'TSX', value: row.tsxReturn },
      { name: 'KLSE', value: row.klseReturn },
      { name: 'CAC40', value: row.cac40Return },
      { name: 'DAX', value: row.daxReturn },
      { name: 'STI', value: row.stiReturn },
      { name: 'ASX200', value: row.asx200Return },
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
        nikkei225Annualized: 0,
        tsxAnnualized: 0,
        klseAnnualized: 0,
        cac40Annualized: 0,
        daxAnnualized: 0,
        stiAnnualized: 0,
        asx200Annualized: 0,
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
    const nikkei225First = findFirstValidValue('nikkei225');
    const nikkei225Last = findLastValidValue('nikkei225');
    const tsxFirst = findFirstValidValue('tsx');
    const tsxLast = findLastValidValue('tsx');
    const klseFirst = findFirstValidValue('klse');
    const klseLast = findLastValidValue('klse');
    const cac40First = findFirstValidValue('cac40');
    const cac40Last = findLastValidValue('cac40');
    const daxFirst = findFirstValidValue('dax');
    const daxLast = findLastValidValue('dax');
    const stiFirst = findFirstValidValue('sti');
    const stiLast = findLastValidValue('sti');
    const asx200First = findFirstValidValue('asx200');
    const asx200Last = findLastValidValue('asx200');

    return {
      fundAnnualized: (Math.pow(last.shareValue / first.shareValue, 1 / years) - 1) * 100,
      shaAnnualized: (Math.pow(last.sha / first.sha, 1 / years) - 1) * 100,
      sheAnnualized: (Math.pow(last.she / first.she, 1 / years) - 1) * 100,
      csi300Annualized: (Math.pow(last.csi300 / first.csi300, 1 / years) - 1) * 100,
      sp500Annualized: sp500First > 0 && sp500Last > 0 ? (Math.pow(sp500Last / sp500First, 1 / years) - 1) * 100 : 0,
      nasdaqAnnualized: nasdaqFirst > 0 && nasdaqLast > 0 ? (Math.pow(nasdaqLast / nasdaqFirst, 1 / years) - 1) * 100 : 0,
      ftse100Annualized: ftse100First > 0 && ftse100Last > 0 ? (Math.pow(ftse100Last / ftse100First, 1 / years) - 1) * 100 : 0,
      hangsengAnnualized: hangsengFirst > 0 && hangsengLast > 0 ? (Math.pow(hangsengLast / hangsengFirst, 1 / years) - 1) * 100 : 0,
      nikkei225Annualized: nikkei225First > 0 && nikkei225Last > 0 ? (Math.pow(nikkei225Last / nikkei225First, 1 / years) - 1) * 100 : 0,
      tsxAnnualized: tsxFirst > 0 && tsxLast > 0 ? (Math.pow(tsxLast / tsxFirst, 1 / years) - 1) * 100 : 0,
      klseAnnualized: klseFirst > 0 && klseLast > 0 ? (Math.pow(klseLast / klseFirst, 1 / years) - 1) * 100 : 0,
      cac40Annualized: cac40First > 0 && cac40Last > 0 ? (Math.pow(cac40Last / cac40First, 1 / years) - 1) * 100 : 0,
      daxAnnualized: daxFirst > 0 && daxLast > 0 ? (Math.pow(daxLast / daxFirst, 1 / years) - 1) * 100 : 0,
      stiAnnualized: stiFirst > 0 && stiLast > 0 ? (Math.pow(stiLast / stiFirst, 1 / years) - 1) * 100 : 0,
      asx200Annualized: asx200First > 0 && asx200Last > 0 ? (Math.pow(asx200Last / asx200First, 1 / years) - 1) * 100 : 0,
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
      { name: 'Nikkei225', value: annualized.nikkei225Annualized },
      { name: 'TSX', value: annualized.tsxAnnualized },
      { name: 'KLSE', value: annualized.klseAnnualized },
      { name: 'CAC40', value: annualized.cac40Annualized },
      { name: 'DAX', value: annualized.daxAnnualized },
      { name: 'STI', value: annualized.stiAnnualized },
      { name: 'ASX200', value: annualized.asx200Annualized },
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
              <TableHead className="text-right">Nikkei225</TableHead>
              <TableHead className="text-right">TSX</TableHead>
              <TableHead className="text-right">KLSE</TableHead>
              <TableHead className="text-right">CAC40</TableHead>
              <TableHead className="text-right">DAX</TableHead>
              <TableHead className="text-right">STI</TableHead>
              <TableHead className="text-right">ASX200</TableHead>
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
                  <TableCell className={`text-right ${row.nikkei225Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.nikkei225Return !== 0 ? `${row.nikkei225Return.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${row.tsxReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.tsxReturn !== 0 ? `${row.tsxReturn.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${row.klseReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.klseReturn !== 0 ? `${row.klseReturn.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${row.cac40Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.cac40Return !== 0 ? `${row.cac40Return.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${row.daxReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.daxReturn !== 0 ? `${row.daxReturn.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${row.stiReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.stiReturn !== 0 ? `${row.stiReturn.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${row.asx200Return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.asx200Return !== 0 ? `${row.asx200Return.toFixed(2)}%` : '-'}
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
              <TableCell className={`text-right font-bold ${annualized.nikkei225Annualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.nikkei225Annualized !== 0 ? `${annualized.nikkei225Annualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.tsxAnnualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.tsxAnnualized !== 0 ? `${annualized.tsxAnnualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.klseAnnualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.klseAnnualized !== 0 ? `${annualized.klseAnnualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.cac40Annualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.cac40Annualized !== 0 ? `${annualized.cac40Annualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.daxAnnualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.daxAnnualized !== 0 ? `${annualized.daxAnnualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.stiAnnualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.stiAnnualized !== 0 ? `${annualized.stiAnnualized.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className={`text-right font-bold ${annualized.asx200Annualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {annualized.asx200Annualized !== 0 ? `${annualized.asx200Annualized.toFixed(2)}%` : '-'}
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
