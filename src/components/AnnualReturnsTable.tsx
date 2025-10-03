import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnnualReturn } from "@/utils/portfolioAnalysis";

interface AnnualReturnsTableProps {
  returns: AnnualReturn[];
}

export function AnnualReturnsTable({ returns }: AnnualReturnsTableProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Annual Returns by Year</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Fund Return</TableHead>
              <TableHead className="text-right">SHA Index</TableHead>
              <TableHead className="text-right">SHE Index</TableHead>
              <TableHead className="text-right">CSI 300</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((row) => (
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
