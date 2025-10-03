import { useState } from "react";
import { Upload, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileLoad: (csvText: string) => void;
}

export function FileUpload({ onFileLoad }: FileUploadProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileLoad(text);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been loaded and analyzed.`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Please try again with a valid CSV file.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
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
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const template = `date,principle,share_value,sha,she,csi300
2024-01-01,10000,1.0000,3000.00,2000.00,3500.00
2024-01-02,10000,1.0050,3010.00,2005.00,3515.00`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded",
      description: "Use this template to format your portfolio data.",
    });
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
            Drag and drop your CSV file here, or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="mt-2" asChild>
              <span>Browse Files</span>
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
                  <li><code className="bg-background px-1 rounded">date</code> - Date in YYYY-MM-DD format</li>
                  <li><code className="bg-background px-1 rounded">principle</code> - Your invested capital amount</li>
                  <li><code className="bg-background px-1 rounded">share_value</code> - Portfolio share value (net asset value)</li>
                  <li><code className="bg-background px-1 rounded">sha</code> - Shanghai Composite Index value</li>
                  <li><code className="bg-background px-1 rounded">she</code> - Shenzhen Component Index value</li>
                  <li><code className="bg-background px-1 rounded">csi300</code> - CSI 300 Index value</li>
                </ul>
                <p className="mt-2"><strong>Example row:</strong></p>
                <code className="block bg-background px-2 py-1 rounded text-xs">
                  2024-01-01,10000,1.0050,3000.00,2000.00,3500.00
                </code>
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
