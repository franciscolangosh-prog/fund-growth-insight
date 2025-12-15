import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle, AlertCircle, RefreshCw, Upload, FileText } from "lucide-react";
import { backfillMarketData } from "@/utils/marketDataService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ParsedMarketData {
  date: string;
  sha?: number | null;
  she?: number | null;
  csi300?: number | null;
  sp500?: number | null;
  nasdaq?: number | null;
  ftse100?: number | null;
  hangseng?: number | null;
  nikkei225?: number | null;
  tsx?: number | null;
  klse?: number | null;
  cac40?: number | null;
  dax?: number | null;
  sti?: number | null;
  asx200?: number | null;
}

export function DataMigrationPanel() {
  const [backfillStatus, setBackfillStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [startDate, setStartDate] = useState('2025-10-09');
  const [endDate, setEndDate] = useState('2025-11-05');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadResult(null);
    }
  };

  const parseCSVDate = (dateStr: string): string => {
    // Handle various date formats
    let parts: string[] = [];
    
    if (dateStr.includes('/')) {
      parts = dateStr.split('/');
    } else if (dateStr.includes('-')) {
      // Check if it's already YYYY-MM-DD format
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      parts = dateStr.split('-');
    } else if (dateStr.includes('.')) {
      parts = dateStr.split('.');
    }
    
    if (parts.length === 3) {
      // Assume DD/MM/YYYY or DD-MM-YYYY format
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    
    return dateStr;
  };

  const parseCSV = (csvText: string): ParsedMarketData[] => {
    const lines = csvText.trim().split('\n');
    const results: ParsedMarketData[] = [];
    
    // Find header line
    let headerIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (!firstLine.includes('date')) {
      headerIndex = 1; // Skip sheet name row if present
    }
    
    const header = lines[headerIndex].toLowerCase().split(',').map(h => h.trim());
    
    // Map column names to indices
    const colMap: Record<string, number> = {};
    header.forEach((col, idx) => {
      if (col.includes('date')) colMap['date'] = idx;
      else if (col === 'sha' || col.includes('shanghai')) colMap['sha'] = idx;
      else if (col === 'she' || col.includes('shenzhen')) colMap['she'] = idx;
      else if (col === 'csi300' || col.includes('csi') || col.includes('300')) colMap['csi300'] = idx;
      else if (col === 'sp500' || col.includes('s&p') || col.includes('sp')) colMap['sp500'] = idx;
      else if (col === 'nasdaq' || col.includes('nasd')) colMap['nasdaq'] = idx;
      else if (col === 'ftse100' || col.includes('ftse')) colMap['ftse100'] = idx;
      else if (col === 'hangseng' || col.includes('hang') || col.includes('hsi')) colMap['hangseng'] = idx;
      else if (col === 'nikkei225' || col.includes('nikkei') || col === 'n225') colMap['nikkei225'] = idx;
      else if (col === 'tsx' || col.includes('tsx') || col.includes('gsptse')) colMap['tsx'] = idx;
      else if (col === 'klse' || col.includes('klse') || col.includes('malaysia')) colMap['klse'] = idx;
      else if (col === 'cac40' || col.includes('cac') || col.includes('fchi')) colMap['cac40'] = idx;
      else if (col === 'dax' || col.includes('dax') || col.includes('gdaxi')) colMap['dax'] = idx;
      else if (col === 'sti' || col.includes('straits') || col.includes('singapore')) colMap['sti'] = idx;
      else if (col === 'asx200' || col.includes('asx') || col.includes('axjo')) colMap['asx200'] = idx;
    });
    
    if (colMap['date'] === undefined) {
      throw new Error('CSV must have a "date" column');
    }
    
    // Parse data rows
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      const dateValue = values[colMap['date']];
      if (!dateValue) continue;
      
      const formattedDate = parseCSVDate(dateValue);
      
      const record: ParsedMarketData = {
        date: formattedDate,
      };
      
      // Parse each index value
      const indexKeys: Array<keyof Omit<ParsedMarketData, "date">> = [
        "sha",
        "she",
        "csi300",
        "sp500",
        "nasdaq",
        "ftse100",
        "hangseng",
        "nikkei225",
        "tsx",
        "klse",
        "cac40",
        "dax",
        "sti",
        "asx200",
      ];
      
      for (const key of indexKeys) {
        if (colMap[key] !== undefined) {
          const val = parseFloat(values[colMap[key]]);
          if (!isNaN(val) && val > 0) {
            record[key] = val;
          }
        }
      }
      
      results.push(record);
    }
    
    return results;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus('running');
    setUploadResult(null);

    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        throw new Error('No valid data found in CSV');
      }

      console.log(`Parsed ${data.length} records from CSV`);

      // Upsert in batches
      const batchSize = 50;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('market_indices')
          .upsert(batch, { onConflict: 'date' });

        if (error) {
          console.error('Batch upsert error:', error);
          failCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      setUploadResult({ total: data.length, success: successCount, failed: failCount });
      
      if (failCount === 0) {
        setUploadStatus('success');
        toast({
          title: "Upload Complete",
          description: `Successfully imported ${successCount} market data records.`,
        });
      } else {
        setUploadStatus('error');
        toast({
          title: "Partial Upload",
          description: `Imported ${successCount} records, ${failCount} failed.`,
          variant: "destructive",
        });
      }
      
      // Reset file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to parse or upload CSV file.",
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
          Import or backfill historical market data for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CSV Upload Section */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Market Data CSV
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a CSV file with market indices data. Existing records with matching dates will be updated.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={uploadStatus === 'running'}
                className="flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadStatus === 'running'}
                variant="default"
              >
                {uploadStatus === 'running' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            
            {selectedFile && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Selected: {selectedFile.name}
              </p>
            )}

            {uploadResult && (
              <Alert className={uploadStatus === 'success' ? '' : 'border-destructive'}>
                {uploadStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  Processed {uploadResult.total} records: {uploadResult.success} successful
                  {uploadResult.failed > 0 && `, ${uploadResult.failed} failed`}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs font-medium mb-1">Expected CSV Format:</p>
            <code className="text-xs text-muted-foreground block">
              date, sha, she, csi300, sp500, nasdaq, ftse100, hangseng,
            </code>
            <code className="text-xs text-muted-foreground block">
              nikkei225, tsx, klse, cac40, dax, sti, asx200
            </code>
            <p className="text-xs text-muted-foreground mt-1">
              Date formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
            </p>
          </div>
        </div>

        {/* Backfill Section */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Backfill from APIs
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Fetch market data from Yahoo Finance for a specific date range.
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
            <li>📝 Use CSV upload for historical data not available from APIs (e.g., early CSI 300)</li>
            <li>📝 Use backfill for recent date ranges available from Yahoo Finance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}