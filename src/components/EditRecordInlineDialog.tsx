import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { updatePortfolioRecord, getRecordById } from "@/utils/portfolioDatabase";
import { toast } from "sonner";

const recordSchema = z.object({
  principle: z.coerce.number().positive("Principle must be positive"),
  shareValue: z.coerce.number().positive("Share value must be positive"),
  sha: z.coerce.number(),
  she: z.coerce.number(),
  csi300: z.coerce.number(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

interface EditRecordInlineDialogProps {
  recordId: string;
  portfolioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordUpdated: () => void;
}

export function EditRecordInlineDialog({
  recordId,
  portfolioId,
  open,
  onOpenChange,
  onRecordUpdated,
}: EditRecordInlineDialogProps) {
  const [recordDate, setRecordDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const loadRecord = async () => {
      if (!recordId) return;
      
      setLoading(true);
      const record = await getRecordById(recordId);
      
      if (record) {
        setRecordDate(record.date);
        form.setValue("principle", Number(record.principle));
        form.setValue("shareValue", Number(record.share_value));
        form.setValue("sha", Number(record.sha));
        form.setValue("she", Number(record.she));
        form.setValue("csi300", Number(record.csi300));
      } else {
        toast.error("Failed to load record");
        onOpenChange(false);
      }
      setLoading(false);
    };

    if (open) {
      loadRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, open]);

  const onSubmit = async (values: RecordFormValues) => {
    const success = await updatePortfolioRecord(recordId, {
      principle: values.principle,
      shareValue: values.shareValue,
      sha: values.sha,
      she: values.she,
      csi300: values.csi300,
    });

    if (success) {
      toast.success("Record updated successfully");
      onOpenChange(false);
      onRecordUpdated();
    } else {
      toast.error("Failed to update record");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Record</DialogTitle>
          <DialogDescription>
            {recordDate && `Editing record for ${format(new Date(recordDate), "PPP")}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-4">Loading record...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Record</Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
