import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, RefreshCw, CheckCircle, AlertCircle, Edit2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CronJobManager() {
  const [editing, setEditing] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState("50 23,5,11,17 * * *");
  const [newSchedule, setNewSchedule] = useState("");
  const { toast } = useToast();

  const handleEdit = () => {
    setEditing(true);
    setNewSchedule(currentSchedule);
  };

  const handleCancel = () => {
    setEditing(false);
    setNewSchedule("");
  };

  const handleSave = () => {
    if (!newSchedule.trim()) {
      toast({
        title: "Invalid Schedule",
        description: "Please enter a valid cron expression.",
        variant: "destructive",
      });
      return;
    }

    // Copy SQL to clipboard
    const sql = `-- Unschedule existing job
SELECT cron.unschedule(jobname) 
FROM cron.job 
WHERE jobname LIKE '%market%';

-- Schedule new job with updated timing
SELECT cron.schedule(
  'fetch-market-data-scheduled',
  '${newSchedule}',
  $$
  SELECT
    net.http_post(
        url:='https://iigwtsthbbpufchbjmur.supabase.co/functions/v1/fetch-market-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZ3d0c3RoYmJwdWZjaGJqbXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTkyODEsImV4cCI6MjA3NTA5NTI4MX0.CbGprJ8z8CylcMdjIad1smKRT-sOaGWQHOmomnPhJBg"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);`;

    navigator.clipboard.writeText(sql).then(() => {
      setCurrentSchedule(newSchedule);
      toast({
        title: "SQL Copied to Clipboard",
        description: "Paste this SQL in the Cloud → Database section to update the schedule.",
      });
      setEditing(false);
      setNewSchedule("");
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the SQL from the console.",
        variant: "destructive",
      });
      console.log('SQL to execute:', sql);
    });
  };

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
          View and manage the automated market data fetching schedule
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

            {!editing ? (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Schedule</p>
                  <p className="text-sm font-mono text-muted-foreground">{currentSchedule}</p>
                  <p className="text-xs text-muted-foreground italic">
                    {parseCronSchedule(currentSchedule)}
                  </p>
                </div>

                <Button
                  onClick={handleEdit}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Schedule
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cron-schedule" className="text-sm">Cron Expression</Label>
                  <Input
                    id="cron-schedule"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    placeholder="50 23,5,11,17 * * *"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: minute hour day month weekday
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Copy SQL to Update
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Click "Copy SQL to Update" to copy the SQL command. Then go to Cloud → Database and execute it to update the schedule.
            </AlertDescription>
          </Alert>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Quick Schedules</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(true);
                  setNewSchedule("0 6 * * *");
                }}
              >
                Daily at 6 AM
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(true);
                  setNewSchedule("50 23,5,11,17 * * *");
                }}
              >
                4x Daily (Current)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(true);
                  setNewSchedule("0 */6 * * *");
                }}
              >
                Every 6 Hours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(true);
                  setNewSchedule("0 0 * * *");
                }}
              >
                Daily at Midnight
              </Button>
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
