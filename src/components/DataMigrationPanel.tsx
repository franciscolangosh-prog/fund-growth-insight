import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Database, Download, CheckCircle, AlertCircle } from "lucide-react";
import { migrateMarketData, fetchLatestMarketData } from "@/utils/marketDataService";
import { useToast } from "@/hooks/use-toast";

export function DataMigrationPanel() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleMigration = async () => {
    setMigrationStatus('running');
    console.log('Starting market data migration...');

    try {
      const success = await migrateMarketData();
      
      if (success) {
        setMigrationStatus('success');
        toast({
          title: "Migration Complete",
          description: "Market data has been successfully migrated to the new table.",
        });
      } else {
        setMigrationStatus('error');
        toast({
          title: "Migration Failed",
          description: "There was an error migrating the data. Check the console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      toast({
        title: "Migration Error",
        description: "An unexpected error occurred during migration.",
        variant: "destructive",
      });
    }
  };

  const handleFetchMarketData = async () => {
    setFetchStatus('running');
    console.log('Fetching latest market data...');

    try {
      const success = await fetchLatestMarketData();
      
      if (success) {
        setFetchStatus('success');
        toast({
          title: "Market Data Fetched",
          description: "Latest market indices have been updated.",
        });
      } else {
        setFetchStatus('error');
        toast({
          title: "Fetch Failed",
          description: "There was an error fetching market data. Check the console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setFetchStatus('error');
      toast({
        title: "Fetch Error",
        description: "An unexpected error occurred while fetching data.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Migration & Management
        </CardTitle>
        <CardDescription>
          Migrate existing market data and manage daily updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Migration Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Step 1: Migrate Existing Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Copy all market index data from portfolio records to the centralized market_indices table.
              This is a one-time operation.
            </p>
          </div>

          <Button
            onClick={handleMigration}
            disabled={migrationStatus === 'running' || migrationStatus === 'success'}
            className="w-full"
          >
            {migrationStatus === 'running' && (
              <>
                <Progress className="mr-2" />
                Migrating...
              </>
            )}
            {migrationStatus === 'success' && (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Migration Complete
              </>
            )}
            {migrationStatus === 'idle' && "Run Migration"}
            {migrationStatus === 'error' && (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Retry Migration
              </>
            )}
          </Button>

          {migrationStatus === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Market data migration completed successfully! All historical market indices are now in the centralized table.
              </AlertDescription>
            </Alert>
          )}

          {migrationStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Migration failed. Please check the console for error details and try again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Fetch Market Data Section */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <h3 className="text-sm font-semibold mb-2">Step 2: Update Market Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fetch the latest market indices. This will be automated with a daily cron job.
            </p>
          </div>

          <Button
            onClick={handleFetchMarketData}
            disabled={fetchStatus === 'running'}
            variant="secondary"
            className="w-full"
          >
            {fetchStatus === 'running' && (
              <>
                <Download className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            )}
            {fetchStatus === 'success' && (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Data Updated
              </>
            )}
            {fetchStatus === 'idle' && (
              <>
                <Download className="mr-2 h-4 w-4" />
                Fetch Latest Market Data
              </>
            )}
            {fetchStatus === 'error' && (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Retry Fetch
              </>
            )}
          </Button>

          {fetchStatus === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Market data updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {fetchStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to fetch market data. Check the console for details.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Instructions */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-2">Status</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>✅ Daily cron job configured (runs at 6 AM UTC)</li>
            <li>✅ Yahoo Finance API integrated (free, no API key needed)</li>
            <li>📝 Run migration above to populate historical data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
