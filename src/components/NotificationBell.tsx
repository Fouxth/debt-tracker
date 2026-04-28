import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { formatTHB } from "@/lib/format";

type Alert = {
  id: string;
  loan_number: string;
  customer: string;
  due_date: string;
  amount: number;
  kind: "due" | "overdue";
};

export function NotificationBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("loans")
        .select("id, loan_number, due_date, total_payable, status, customers(full_name)")
        .in("status", ["active", "overdue"])
        .lte("due_date", today)
        .limit(15);
      const list: Alert[] = (data ?? []).map((l: any) => ({
        id: l.id,
        loan_number: l.loan_number,
        customer: l.customers?.full_name ?? "—",
        due_date: l.due_date,
        amount: Number(l.total_payable),
        kind: l.status === "overdue" ? "overdue" : "due",
      }));
      setAlerts(list);
    };
    load();
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {alerts.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {alerts.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">Due & overdue accounts</p>
        </div>
        <div className="max-h-80 overflow-auto">
          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">All clear ✨</div>
          ) : (
            alerts.map((a) => (
              <Link
                key={a.id}
                to="/loans/$loanId"
                params={{ loanId: a.id }}
                className="block border-b px-4 py-3 last:border-b-0 hover:bg-accent/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.customer}</p>
                    <p className="text-xs text-muted-foreground">{a.loan_number}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      a.kind === "overdue"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-warning/15 text-warning-foreground"
                    }`}
                  >
                    {a.kind}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatTHB(a.amount)}</p>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}