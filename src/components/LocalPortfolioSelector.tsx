import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteLocalPortfolio, LocalPortfolio } from "@/utils/localPortfolioStorage";

interface LocalPortfolioSelectorProps {
  portfolios: LocalPortfolio[];
  selectedPortfolioId: string | null;
  onSelectPortfolio: (id: string) => void;
  onPortfoliosChange: () => void;
}

export function LocalPortfolioSelector({
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onPortfoliosChange,
}: LocalPortfolioSelectorProps) {
  const { toast } = useToast();

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const success = deleteLocalPortfolio(id);
    
    if (success) {
      toast({
        title: "Portfolio deleted",
        description: "The portfolio has been removed from your browser.",
      });
      onPortfoliosChange();
    } else {
      toast({
        title: "Error deleting portfolio",
        description: "There was an error deleting the portfolio.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select
              value={selectedPortfolioId || undefined}
              onValueChange={onSelectPortfolio}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{portfolio.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(portfolio.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedPortfolioId && (
            <Button
              variant="destructive"
              size="icon"
              onClick={(e) => handleDelete(selectedPortfolioId, e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
