import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnnualReturn } from "@/utils/portfolioAnalysis";

interface AnnualReturnsTableProps {
  returns: AnnualReturn[];
}

export function AnnualReturnsTable({ returns }: AnnualReturnsTableProps) {
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
