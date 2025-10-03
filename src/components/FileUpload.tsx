import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileLoad: (csvText: string) => void;
}

export function FileUpload({ onFileLoad }: FileUploadProps) {
  const { toast } = useToast();

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

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileLoad(text);
      toast({
        title: "File uploaded successfully",
        description: "Portfolio data loaded and analyzed",
      });
    };
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Please try again",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-semibold mb-2">Upload Portfolio Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file with columns: Date, Share_V, SHA, SHE, CSI300, Share, Gain_Loss, DailyGain, Market_Value, Principle
            </p>
          </div>
          <Button asChild>
            <label className="cursor-pointer">
              Select CSV File
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
