import { Info, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PrivacyNoticeProps {
  variant?: "info" | "compact";
}

export function PrivacyNotice({ variant = "info" }: PrivacyNoticeProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <span>Your data stays private — stored only in your browser's local cache.</span>
      </div>
    );
  }

  return (
    <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800 dark:text-blue-300">Privacy-First Analysis</AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-400">
        Your portfolio data is stored locally in your browser and never uploaded to our servers.
        This means your data will be lost if you clear your browser cache. For permanent storage,
        sign in to save your portfolios securely.
      </AlertDescription>
    </Alert>
  );
}
