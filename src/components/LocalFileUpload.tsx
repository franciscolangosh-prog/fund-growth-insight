import { useState } from "react";
import { Upload, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { parseCSV } from "@/utils/portfolioAnalysis";
import { savePortfolioToLocal } from "@/utils/localPortfolioStorage";

interface LocalFileUploadProps {
  onFileUploaded: () => void;
}

export function LocalFileUpload({ onFileUploaded }: LocalFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileRead = async (file: File) => {
    if (!portfolioName.trim()) {
      toast({
        title: "Portfolio name required",
        description: "Please enter a name for your portfolio before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parseResult = parseCSV(text);

        // Check for parsing/validation errors
        if (parseResult.errors.length > 0) {
          parseResult.errors.forEach(error => {
            toast({
              title: "Validation Error",
              description: error,
              variant: "destructive",
            });
          });
          setIsUploading(false);
          return;
        }

        if (parseResult.data.length === 0) {
          toast({
            title: "Invalid CSV",
            description: "No valid data found in the file. Please check the format.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        const portfolioId = savePortfolioToLocal(portfolioName.trim(), parseResult.data);
        
        if (portfolioId) {
          toast({
            title: "Portfolio uploaded successfully!",
            description: `"${portfolioName}" with ${parseResult.data.length} records has been saved to your browser's local storage.`,
          });
          setPortfolioName("");
          onFileUploaded();
        } else {
          toast({
            title: "Error saving portfolio",
            description: "There was an error saving your portfolio. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast({
          title: "Error parsing file",
          description: "Could not parse the CSV file. Please check the format.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Could not read the file. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
        return;
      }
      handleFileRead(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
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
    const templateContent = `Date,Principle,ShareValue
2024-01-01,10000,1.0000
2024-01-02,10000,1.0125
2024-01-03,10100,1.0150`;
    
    const blob = new Blob([templateContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Portfolio CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="portfolioName">Portfolio Name</Label>
          <Input
            id="portfolioName"
            placeholder="My Portfolio"
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
          />
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">
            Drag and drop your CSV file here, or
          </p>
          <Label htmlFor="csvFile" className="cursor-pointer">
            <Button variant="outline" disabled={isUploading} asChild>
              <span>{isUploading ? "Uploading..." : "Browse Files"}</span>
            </Button>
          </Label>
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Required columns: Date, Principle, ShareValue</span>
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" />
            Download Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
