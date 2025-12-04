import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { parseCSV } from "@/utils/portfolioAnalysis";
import { savePortfolioToDatabase } from "@/utils/portfolioDatabase";

interface FileUploadProps {
  onFileUploaded: () => void;
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileRead = async (file: File) => {
    if (!portfolioName.trim()) {
      toast.error("Please enter a portfolio name first");
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      const parseResult = parseCSV(csvText);
      
      // Check for parsing/validation errors
      if (parseResult.errors.length > 0) {
        parseResult.errors.forEach(error => toast.error(error));
        setIsUploading(false);
        return;
      }
      
      if (parseResult.data.length === 0) {
        toast.error("No valid data found in the CSV file");
        setIsUploading(false);
        return;
      }
      
      const portfolioId = await savePortfolioToDatabase(portfolioName, parseResult.data);
      
      if (portfolioId) {
        toast.success("Portfolio saved successfully!");
        setPortfolioName("");
        onFileUploaded();
      } else {
        toast.error("Failed to save portfolio to database");
      }
      
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast.error("Error reading file. Please try again.");
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Invalid file type. Please upload a CSV file");
      return;
    }

    handleFileRead(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileRead(file);
    } else {
      toast.error("Invalid file type. Please upload a CSV file.");
    }
  };

  const downloadTemplate = () => {
    const template = `Sheet1
date,principle,market_value
01/01/2024,10000.00,10000.00
02/01/2024,10000.00,10500.00
03/01/2024,12000.00,12600.00`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Template downloaded");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Your Portfolio Data
        </CardTitle>
        <CardDescription>
          Upload a CSV file with your portfolio history to analyze your investment performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="portfolioName" className="text-sm font-medium">
            Portfolio Name
          </label>
          <Input
            id="portfolioName"
            type="text"
            placeholder="e.g., My Investment Portfolio 2025"
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            disabled={isUploading}
          />
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-2">
            {portfolioName.trim() ? "Drag and drop your CSV file here, or click to browse" : "Enter a portfolio name first"}
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={isUploading || !portfolioName.trim()}
          />
          <label htmlFor="file-upload">
            <Button 
              variant="outline" 
              className="mt-2" 
              asChild
              disabled={isUploading || !portfolioName.trim()}
            >
              <span>{isUploading ? "Uploading..." : "Browse Files"}</span>
            </Button>
          </label>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">CSV Format Requirements</h4>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p><strong>Required columns (in order):</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code className="bg-background px-1 rounded">date</code> - Date in DD/MM/YYYY format</li>
                  <li><code className="bg-background px-1 rounded">principle</code> - Total amount invested (cumulative)</li>
                  <li><code className="bg-background px-1 rounded">market_value</code> - Current total portfolio value</li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  First row should contain sheet name, second row should contain column headers. The system will automatically calculate share values and fetch market indices data.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadTemplate}
              className="ml-4 flex items-center gap-2 shrink-0"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}