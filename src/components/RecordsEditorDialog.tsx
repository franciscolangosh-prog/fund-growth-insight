"use client"

import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Edit, Plus, CalendarIcon, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getRecordsByDateRange, updatePortfolioRecord, addPortfolioRecord } from "@/utils/portfolioDatabase";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const recordSchema = z.object({
  id: z.string().optional(),
  date: z.date({
    required_error: "Date is required",
  }),
  principle: z.coerce.number().positive("Principle must be positive"),
  shareValue: z.coerce.number().positive("Share value must be positive"),
  sha: z.coerce.number(),
  she: z.coerce.number(),
  csi300: z.coerce.number(),
  sp500: z.coerce.number().optional(),
  nasdaq: z.coerce.number().optional(),
  ftse100: z.coerce.number().optional(),
  hangseng: z.coerce.number().optional(),
  isEditing: z.boolean().optional(),
});

const formSchema = z.object({
  records: z.array(recordSchema),
});

type RecordFormValues = z.infer<typeof formSchema>;

interface RecordsEditorDialogProps {
  portfolioId: string;
  onRecordSaved: () => void;
}

export function RecordsEditorDialog({ portfolioId, onRecordSaved }: RecordsEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      records: [],
    },
  });

  const { fields, append, replace, remove, update } = useFieldArray({
    control: form.control,
    name: "records",
  });

  useEffect(() => {
    const fetchRecords = async () => {
      if (dateRange?.from && dateRange?.to) {
        const from = format(dateRange.from, "yyyy-MM-dd");
        const to = format(dateRange.to, "yyyy-MM-dd");
        const data = await getRecordsByDateRange(portfolioId, from, to);
        replace(data.map(d => ({
          id: d.id,
          date: new Date(d.date),
          principle: Number(d.principle),
          shareValue: Number(d.share_value),
          sha: Number(d.sha),
          she: Number(d.she),
          csi300: Number(d.csi300),
          sp500: d.sp500 ? Number(d.sp500) : undefined,
          nasdaq: d.nasdaq ? Number(d.nasdaq) : undefined,
          ftse100: d.ftse100 ? Number(d.ftse100) : undefined,
          hangseng: d.hangseng ? Number(d.hangseng) : undefined,
          isEditing: false,
        })));
      }
    };
    if (open) {
      fetchRecords();
    }
  }, [dateRange, open, portfolioId, replace]);

  const onSubmit = async (values: RecordFormValues) => {
    for (const record of values.records) {
      if (!record.isEditing) continue;

      const dateStr = format(record.date, "yyyy-MM-dd");
      if (record.id) {
        const success = await updatePortfolioRecord(record.id, {
          principle: record.principle,
          shareValue: record.shareValue,
          sha: record.sha,
          she: record.she,
          csi300: record.csi300,
          sp500: record.sp500,
          nasdaq: record.nasdaq,
          ftse100: record.ftse100,
          hangseng: record.hangseng,
        });
        if (success) {
          toast.success(`Record for ${dateStr} updated successfully`);
        } else {
          toast.error(`Failed to update record for ${dateStr}`);
        }
      } else {
        const success = await addPortfolioRecord(portfolioId, {
          date: dateStr,
          principle: record.principle,
          shareValue: record.shareValue,
          sha: record.sha,
          she: record.she,
          csi300: record.csi300,
          sp500: record.sp500,
          nasdaq: record.nasdaq,
          ftse100: record.ftse100,
          hangseng: record.hangseng,
        });
        if (success) {
          toast.success(`Record for ${dateStr} added successfully`);
        } else {
          toast.error(`Failed to add record for ${dateStr}`);
        }
      }
    }
    onRecordSaved();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add/Edit Records
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Add/Edit Records</DialogTitle>
          <DialogDescription>
            Select a date range to view and edit records, or add new records. Maximum 30 days.
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
            variant="outline"
            onClick={() => append({ date: new Date(), principle: 0, shareValue: 0, sha: 0, she: 0, csi300: 0, sp500: 0, nasdaq: 0, ftse100: 0, hangseng: 0, isEditing: true })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto overflow-x-auto border rounded-md">
              <table className="w-full caption-bottom text-sm">
                <thead className="sticky top-0 z-10 bg-background border-b [&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[280px] bg-background">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[180px] bg-background">Principle</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[180px] bg-background">Share Value</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-background">SHA</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-background">SHE</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-background">CSI300</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-background">S&P500</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-background">Nasdaq</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-background">FTSE100</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-background">HangSeng</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background w-[100px]" />
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {fields.map((field, index) => (
                    <tr key={field.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.date`}
                            render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-[240px] justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                          />
                        ) : (
                          format(field.date, "PPP")
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.principle`}
                            render={({ field }) => (
                              <Input type="number" className="w-full" {...field} />
                            )}
                          />
                        ) : (
                          field.principle
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.shareValue`}
                            render={({ field }) => (
                              <Input type="number" step="0.0001" className="w-full" {...field} />
                            )}
                          />
                        ) : (
                          field.shareValue
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.sha`}
                            render={({ field }) => (
                              <Input type="number" step="0.01" className="w-full" {...field} />
                            )}
                          />
                        ) : (
                          field.sha
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.she`}
                            render={({ field }) => (
                              <Input type="number" step="0.01" className="w-full" {...field} />
                            )}
                          />
                        ) : (
                          field.she
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.csi300`}
                            render={({ field }) => (
                              <Input type="number" step="0.01" className="w-full" {...field} />
                            )}
                          />
                        ) : (
                          field.csi300
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.sp500`}
                            render={({ field }) => (
                              <Input type="number" step="0.01" className="w-full" {...field} />
                            )}
                          />
                        ) : (
                          field.sp500 ?? '-'
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.nasdaq`}
                            render={({ field }) => (
                              <Input type="number" step="0.01" className="w-full" {...field} />
                            )}
                          />
                        ) : (
                          field.nasdaq ?? '-'
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.ftse100`}
                            render={({ field }) => (
                              <Input type="number" step="0.01" className="w-full" {...field} />
                            )}
                          />
                        ) : (
                          field.ftse100 ?? '-'
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {field.isEditing ? (
                          <FormField
                            control={form.control}
                            name={`records.${index}.hangseng`}
                            render={({ field }) => (
                              <Input type="number" step="0.01" className="w-full" {...field} />
                            )}
                          />
                        ) : (
                          field.hangseng ?? '-'
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex gap-2">
                        {!field.isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => update(index, { ...field, isEditing: true })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
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
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save All Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
''