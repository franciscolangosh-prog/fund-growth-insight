import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle } from "lucide-react";

export function CronJobManager() {
  const currentSchedule = "50 23,5,11,17 * * *";

  const parseCronSchedule = (schedule: string): string => {
    const parts = schedule.split(' ');
    if (parts.length < 5) return schedule;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    let description = "Runs ";
    
    // Parse minute and hour
    if (hour.includes(',')) {
      const hours = hour.split(',');
      description += `at ${minute} minutes past hours ${hours.join(', ')}`;
    } else if (hour === '*') {
      description += `every hour at ${minute} minutes`;
    } else {
      description += `at ${hour}:${minute}`;
    }
    
    // Parse day
    if (dayOfMonth === '*' && month === '*') {
      description += " daily";
    } else if (dayOfMonth !== '*') {
      description += ` on day ${dayOfMonth} of each month`;
    }
    
    return description;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Market Data Cron Schedule
        </CardTitle>
        <CardDescription>
          Automated market data fetching schedule (read-only)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Job Name</p>
                <p className="text-sm text-muted-foreground">fetch-market-data-scheduled</p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                Active
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">Schedule</p>
              <p className="text-sm font-mono text-muted-foreground">{currentSchedule}</p>
              <p className="text-xs text-muted-foreground italic">
                {parseCronSchedule(currentSchedule)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2">Current Configuration</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Market data fetches at: 23:50, 5:50, 11:50, 17:50 (UTC)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Yahoo Finance API integrated
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Auto-backfill for non-trading days
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
