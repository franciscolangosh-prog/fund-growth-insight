import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Eye, Edit2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getRecordsByDateRange } from "@/utils/portfolioDatabase";
import { EditRecordInlineDialog } from "./EditRecordInlineDialog";
import { toast } from "sonner";

interface ViewRecordsDialogProps {
  portfolioId: string;
  onRecordUpdated: () => void;
}

interface PortfolioRecord {
  id: string;
  date: string;
  principle: number;
  share_value: number;
  sha: number;
  she: number;
  csi300: number;
}

export function ViewRecordsDialog({ portfolioId, onRecordUpdated }: ViewRecordsDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [records, setRecords] = useState<PortfolioRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const loadRecords = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (startDate > endDate) {
      toast.error("Start date must be before end date");
      return;
    }

    setLoading(true);
    const startDateStr = format(startDate, "yyyy-MM-dd");
    const endDateStr = format(endDate, "yyyy-MM-dd");
    
    const data = await getRecordsByDateRange(portfolioId, startDateStr, endDateStr);
    setRecords(data);
    setLoading(false);

    if (data.length === 0) {
      toast.info("No records found in the selected date range");
    }
  };

  useEffect(() => {
    if (open && startDate && endDate) {
      loadRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, portfolioId]);

  const handleEditClick = (recordId: string) => {
    setEditingRecordId(recordId);
  };

  const handleRecordUpdated = async () => {
    setEditingRecordId(null);
    await loadRecords();
    onRecordUpdated();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            View Records
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Portfolio Records</DialogTitle>
            <DialogDescription>
              Select a date range to view portfolio data records
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setStartDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={loadRecords} disabled={loading || !startDate || !endDate}>
              {loading ? "Loading..." : "Load Records"}
            </Button>
          </div>

          {records.length > 0 && (
            <div className="border rounded-lg">
              <div className="max-h-[400px] overflow-y-auto relative">
                <table className="w-full caption-bottom text-sm">
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr className="border-b bg-background">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">
                        Date
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground bg-background">
                        Principle
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground bg-background">
                        Share Value
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground bg-background">
                        SHA
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground bg-background">
                        SHE
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground bg-background">
                        CSI300
                      </th>
                      <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground bg-background">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">
                          {format(new Date(record.date), "yyyy-MM-dd")}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {Number(record.principle).toFixed(2)}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {Number(record.share_value).toFixed(4)}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {Number(record.sha).toFixed(2)}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {Number(record.she).toFixed(2)}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {Number(record.csi300).toFixed(2)}
                        </td>
                        <td className="p-4 align-middle text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(record.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && records.length === 0 && startDate && endDate && (
            <div className="text-center py-8 text-muted-foreground">
              No records found in the selected date range
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editingRecordId && (
        <EditRecordInlineDialog
          recordId={editingRecordId}
          portfolioId={portfolioId}
          open={!!editingRecordId}
          onOpenChange={(open) => !open && setEditingRecordId(null)}
          onRecordUpdated={handleRecordUpdated}
        />
      )}
    </>
  );
}
