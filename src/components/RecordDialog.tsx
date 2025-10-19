import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addPortfolioRecord, updatePortfolioRecord, getRecordByDate } from "@/utils/portfolioDatabase";
import { toast } from "sonner";

const recordSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  principle: z.coerce.number().positive("Principle must be positive"),
  shareValue: z.coerce.number().positive("Share value must be positive"),
  sha: z.coerce.number(),
  she: z.coerce.number(),
  csi300: z.coerce.number(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

interface RecordDialogProps {
  portfolioId: string;
  onRecordSaved: () => void;
  mode: "add" | "edit";
}

export function RecordDialog({ portfolioId, onRecordSaved, mode }: RecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      principle: 0,
      shareValue: 0,
      sha: 0,
      she: 0,
      csi300: 0,
    },
  });

  const onDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    form.setValue("date", date);

    if (mode === "edit") {
      const dateStr = format(date, "yyyy-MM-dd");
      const existingRecord = await getRecordByDate(portfolioId, dateStr);
      
      if (existingRecord) {
        setExistingRecordId(existingRecord.id);
        form.setValue("principle", Number(existingRecord.principle));
        form.setValue("shareValue", Number(existingRecord.share_value));
        form.setValue("sha", Number(existingRecord.sha));
        form.setValue("she", Number(existingRecord.she));
        form.setValue("csi300", Number(existingRecord.csi300));
        toast.success("Record loaded for editing");
      } else {
        toast.error("No record found for this date");
        setExistingRecordId(null);
      }
    }
  };

  const onSubmit = async (values: RecordFormValues) => {
    const dateStr = format(values.date, "yyyy-MM-dd");

    if (mode === "add") {
      const success = await addPortfolioRecord(portfolioId, {
        date: dateStr,
        principle: values.principle,
        shareValue: values.shareValue,
        sha: values.sha,
        she: values.she,
        csi300: values.csi300,
      });

      if (success) {
        toast.success("Record added successfully");
        setOpen(false);
        form.reset();
        onRecordSaved();
      } else {
        toast.error("Failed to add record");
      }
    } else if (mode === "edit" && existingRecordId) {
      const success = await updatePortfolioRecord(existingRecordId, {
        principle: values.principle,
        shareValue: values.shareValue,
        sha: values.sha,
        she: values.she,
        csi300: values.csi300,
      });

      if (success) {
        toast.success("Record updated successfully");
        setOpen(false);
        form.reset();
        setExistingRecordId(null);
        onRecordSaved();
      } else {
        toast.error("Failed to update record");
      }
    } else {
      toast.error("Please select a date with an existing record");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "add" ? "default" : "outline"}>
          {mode === "add" ? (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Record
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Record" : "Edit Record"}</DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Add a new portfolio data record"
              : "Select a date and edit the portfolio data record"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={onDateSelect}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="principle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Principle</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Enter principle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shareValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Share Value</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.0001" placeholder="Enter share value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SHA</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="SHA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="she"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SHE</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="SHE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="csi300"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CSI300</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="CSI300" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                  setExistingRecordId(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === "add" ? "Add Record" : "Update Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
