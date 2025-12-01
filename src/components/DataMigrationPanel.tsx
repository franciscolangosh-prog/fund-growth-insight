import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { backfillMarketData } from "@/utils/marketDataService";
import { useToast } from "@/hooks/use-toast";

export function DataMigrationPanel() {
  const [backfillStatus, setBackfillStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [startDate, setStartDate] = useState('2025-10-09');
  const [endDate, setEndDate] = useState('2025-11-05');
  const { toast } = useToast();

  const handleBackfillData = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Dates",
        description: "Please provide both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    setBackfillStatus('running');
    
    try {
      const success = await backfillMarketData(startDate, endDate);
      
      if (success) {
        setBackfillStatus('success');
        toast({
          title: "Backfill Complete",
          description: `Market data from ${startDate} to ${endDate} has been fetched.`,
        });
      } else {
        setBackfillStatus('error');
        toast({
          title: "Backfill Failed",
          description: "Failed to backfill market data. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setBackfillStatus('error');
      toast({
        title: "Error",
        description: "An unexpected error occurred during backfill.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Market Data Management
        </CardTitle>
        <CardDescription>
          Backfill historical market data for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Backfill Section */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Backfill Missing Data
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Fetch market data for a specific date range to fill gaps in historical data.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="start-date" className="text-sm">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={backfillStatus === 'running'}
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-sm">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={backfillStatus === 'running'}
              />
            </div>
          </div>

          <Button 
            onClick={handleBackfillData}
            disabled={backfillStatus === 'running'}
            className="w-full"
            variant="outline"
          >
            {backfillStatus === 'running' ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Backfilling...
              </>
            ) : backfillStatus === 'success' ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Backfill Complete
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Backfill Date Range
              </>
            )}
          </Button>

          {backfillStatus === 'success' && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully backfilled market data for the specified date range.
              </AlertDescription>
            </Alert>
          )}

          {backfillStatus === 'error' && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to backfill market data. Check the console for details.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Instructions */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-2">Status</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>✅ Daily cron job configured (runs at 23:50, 5:50, 11:50, 17:50 UTC)</li>
            <li>✅ Yahoo Finance API integrated (free, no API key needed)</li>
            <li>📝 Use backfill above to populate missing historical data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
