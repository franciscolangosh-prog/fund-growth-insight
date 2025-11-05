import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

const recordFormSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  principle: z.coerce.number().positive("Principle must be positive"),
  shareValue: z.coerce.number().positive("Share value must be positive"),
});

type RecordFormValues = z.infer<typeof recordFormSchema>;

interface RecordFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecordFormValues) => void;
  initialValues?: Partial<RecordFormValues>;
  mode: "add" | "edit";
}

export function RecordFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  mode,
}: RecordFormDialogProps) {
  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      date: new Date(),
      principle: 0,
      shareValue: 0,
    },
  });

  useEffect(() => {
    if (open && initialValues) {
      form.reset(initialValues as RecordFormValues);
    } else if (open && mode === "add") {
      form.reset({
        date: new Date(),
        principle: 0,
        shareValue: 0,
      });
    }
  }, [open, initialValues, mode, form]);

  const handleSubmit = (values: RecordFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Record" : "Edit Record"}</DialogTitle>
          <DialogDescription>
            Enter your portfolio data. Market indices will be automatically populated from our centralized database.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principle</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                      <Input type="number" step="0.0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === "add" ? "Add Record" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
