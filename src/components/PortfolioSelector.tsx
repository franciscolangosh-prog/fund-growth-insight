import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Portfolio {
  id: string;
  name: string;
  created_at: string;
}

interface PortfolioSelectorProps {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  onSelectPortfolio: (id: string) => void;
  onPortfoliosChange: () => void;
}

export const PortfolioSelector = ({
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onPortfoliosChange,
}: PortfolioSelectorProps) => {
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Portfolio deleted successfully");
      onPortfoliosChange();
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      toast.error("Failed to delete portfolio");
    }
  };

  if (portfolios.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium whitespace-nowrap">
          Select Portfolio:
        </label>
        <Select value={selectedPortfolioId || undefined} onValueChange={onSelectPortfolio}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Choose a portfolio" />
          </SelectTrigger>
          <SelectContent>
            {portfolios.map((portfolio) => (
              <SelectItem key={portfolio.id} value={portfolio.id}>
                <div className="flex items-center justify-between w-full gap-2">
                  <span>{portfolio.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => handleDelete(portfolio.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};
