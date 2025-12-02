"use client"

import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { RecordFormDialog } from "@/components/RecordFormDialog";
import { getRecordsByDateRange, updatePortfolioRecord, addPortfolioRecord, loadPortfolioFromDatabase } from "@/utils/portfolioDatabase";
import { convertToShareValue, UserPortfolioInput } from "@/utils/portfolioAnalysis";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface RecordData {
  id?: string;
  date: Date;
  principle: number;
  marketValue: number;
}

interface RecordsEditorDialogProps {
  portfolioId: string;
  onRecordSaved: () => void;
}

export function RecordsEditorDialog({ portfolioId, onRecordSaved }: RecordsEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingRecord, setEditingRecord] = useState<RecordData | undefined>();
  const [records, setRecords] = useState<RecordData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    const fetchRecords = async () => {
      if (dateRange?.from && dateRange?.to) {
        const from = format(dateRange.from, "yyyy-MM-dd");
        const to = format(dateRange.to, "yyyy-MM-dd");
        const data = await getRecordsByDateRange(portfolioId, from, to);
        
        // Load full portfolio history to reconstruct market values
        const fullData = await loadPortfolioFromDatabase(portfolioId);
        const marketValueMap = new Map(
          fullData.map(d => [d.date, d.marketValue])
        );
        
        setRecords(data.map(d => ({
          id: d.id,
          date: new Date(d.date),
          principle: Number(d.principle),
          marketValue: marketValueMap.get(d.date) || Number(d.principle),
        })));
      }
    };
    if (open) {
      fetchRecords();
    }
  }, [dateRange, open, portfolioId]);

  const handleFormSubmit = async (values: Omit<RecordData, "id">) => {
    const dateStr = format(values.date, "yyyy-MM-dd");
    
    // Load all records up to this date to calculate share value
    const allRecords = await loadPortfolioFromDatabase(portfolioId);
    const recordsUpToDate = allRecords.filter(r => r.date <= dateStr);
    
    // Create user input array including the new/edited record
    const userInputs: UserPortfolioInput[] = recordsUpToDate
      .filter(r => r.date !== dateStr) // Exclude the current record if editing
      .map(r => ({
        date: r.date,
        principle: r.principle,
        marketValue: r.marketValue,
      }));
    
    // Add the new/edited record
    userInputs.push({
      date: dateStr,
      principle: values.principle,
      marketValue: values.marketValue,
    });
    
    // Convert to share value format
    const converted = convertToShareValue(userInputs);
    const newRecord = converted.find(r => r.date === dateStr);
    
    if (!newRecord) {
      toast.error("Failed to calculate share value");
      return;
    }
    
    if (formMode === "edit" && editingRecord?.id) {
      const success = await updatePortfolioRecord(editingRecord.id, {
        principle: newRecord.principle,
        shareValue: newRecord.shareValue,
      });
      if (success) {
        toast.success(`Record for ${dateStr} updated successfully`);
        // Refresh records
        if (dateRange?.from && dateRange?.to) {
          const from = format(dateRange.from, "yyyy-MM-dd");
          const to = format(dateRange.to, "yyyy-MM-dd");
          const data = await getRecordsByDateRange(portfolioId, from, to);
          const fullData = await loadPortfolioFromDatabase(portfolioId);
          const marketValueMap = new Map(fullData.map(d => [d.date, d.marketValue]));
          setRecords(data.map(d => ({
            id: d.id,
            date: new Date(d.date),
            principle: Number(d.principle),
            marketValue: marketValueMap.get(d.date) || Number(d.principle),
          })));
        }
        onRecordSaved();
      } else {
        toast.error(`Failed to update record for ${dateStr}`);
      }
    } else {
      const success = await addPortfolioRecord(portfolioId, {
        date: dateStr,
        principle: newRecord.principle,
        shareValue: newRecord.shareValue,
      });
      if (success) {
        toast.success(`Record for ${dateStr} added successfully`);
        // Refresh records
        if (dateRange?.from && dateRange?.to) {
          const from = format(dateRange.from, "yyyy-MM-dd");
          const to = format(dateRange.to, "yyyy-MM-dd");
          const data = await getRecordsByDateRange(portfolioId, from, to);
          const fullData = await loadPortfolioFromDatabase(portfolioId);
          const marketValueMap = new Map(fullData.map(d => [d.date, d.marketValue]));
          setRecords(data.map(d => ({
            id: d.id,
            date: new Date(d.date),
            principle: Number(d.principle),
            marketValue: marketValueMap.get(d.date) || Number(d.principle),
          })));
        }
        onRecordSaved();
      } else {
        toast.error(`Failed to add record for ${dateStr}`);
      }
    }
  };

  const handleAddClick = () => {
    setFormMode("add");
    setEditingRecord(undefined);
    setFormOpen(true);
  };

  const handleEditClick = (record: RecordData) => {
    setFormMode("edit");
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleDeleteClick = async (record: RecordData) => {
    if (!record.id) return;
    
    // Implement delete functionality if needed
    toast.info("Delete functionality not yet implemented");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add/Edit Records
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Manage Records</DialogTitle>
          <DialogDescription>
            Select a date range to view records. Click Add to create new records or Edit to modify existing ones.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            maxDays={30}
          />
          <Button
            type="button"
            onClick={handleAddClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </div>
        
        <div className="max-h-[50vh] overflow-auto border rounded-md">
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-10 bg-background border-b">
              <tr className="border-b">
                <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground text-sm">Date</th>
                <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground text-sm">Principle</th>
                <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground text-sm">Market Value</th>
                <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-3 align-middle text-sm">{format(record.date, "MM/dd/yyyy")}</td>
                  <td className="p-3 align-middle text-sm">{record.principle.toLocaleString()}</td>
                  <td className="p-3 align-middle text-sm">{record.marketValue.toLocaleString()}</td>
                  <td className="p-3 align-middle">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteClick(record)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
      
      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        initialValues={editingRecord}
        mode={formMode}
      />
    </Dialog>
  );
}
''