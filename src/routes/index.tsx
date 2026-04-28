import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { formatTHB } from "@/lib/format";
import {
  Users, Wallet, Calendar as CalIcon, AlertTriangle, TrendingUp, DollarSign, Activity,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

export const Route = createFileRoute("/")({
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </ProtectedRoute>
  ),
});

interface Summary {
  customers: number;
  activeLoans: number;
  dueToday: number;
  overdue: number;
  outstanding: number;
  todayCollections: number;
  monthlyProfit: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: "hsl(220 80% 60%)",
  completed: "hsl(150 60% 50%)",
  overdue: "hsl(15 75% 55%)",
  cancelled: "hsl(220 10% 60%)",
};

function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<{ month: string; collected: number }[]>([]);
  const [trend, setTrend] = useState<{ day: string; amount: number }[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date(); monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split("T")[0];

      const [{ count: cust }, loansRes, paymentsRes, expRes] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("loans").select("id, status, total_payable, due_date"),
        supabase.from("payments").select("amount, payment_date"),
        supabase.from("expenses").select("amount, expense_date").gte("expense_date", monthStartStr),
      ]);

      const loans = loansRes.data ?? [];
      const payments = paymentsRes.data ?? [];

      // Build per-loan paid map
      const paidByLoan = new Map<string, number>();
      payments.forEach(() => { /* placeholder, we need loan_id per payment */ });

      // Refetch with loan_id for outstanding calc
      const { data: pay2 } = await supabase.from("payments").select("loan_id, amount");
      (pay2 ?? []).forEach((p: any) => {
        paidByLoan.set(p.loan_id, (paidByLoan.get(p.loan_id) ?? 0) + Number(p.amount));
      });

      let outstanding = 0;
      let activeLoans = 0;
      let dueToday = 0;
      let overdue = 0;
      const statusCounts: Record<string, number> = {};

      loans.forEach((l: any) => {
        statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;
        const paid = paidByLoan.get(l.id) ?? 0;
        const remaining = Number(l.total_payable) - paid;
        if (l.status === "active" || l.status === "overdue") {
          outstanding += Math.max(remaining, 0);
        }
        if (l.status === "active") activeLoans++;
        if (l.status === "overdue") overdue++;
        if (l.due_date === today && l.status !== "completed") dueToday++;
      });

      const todayCollections = payments
        .filter((p: any) => p.payment_date === today)
        .reduce((a: number, p: any) => a + Number(p.amount), 0);

      // Monthly profit estimate: this month payments - expenses
      const monthlyPayments = payments
        .filter((p: any) => p.payment_date >= monthStartStr)
        .reduce((a: number, p: any) => a + Number(p.amount), 0);
      const monthlyExpenses = (expRes.data ?? []).reduce((a: number, e: any) => a + Number(e.amount), 0);

      setSummary({
        customers: cust ?? 0,
        activeLoans,
        dueToday,
        overdue,
        outstanding,
        todayCollections,
        monthlyProfit: monthlyPayments - monthlyExpenses,
      });

      // 6-month collections
      const months: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
        months[d.toISOString().slice(0, 7)] = 0;
      }
      payments.forEach((p: any) => {
        const k = p.payment_date.slice(0, 7);
        if (k in months) months[k] += Number(p.amount);
      });
      setMonthly(
        Object.entries(months).map(([k, v]) => ({
          month: new Date(k + "-01").toLocaleDateString("en", { month: "short" }),
          collected: v,
        }))
      );

      // Last 14 days trend
      const days: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days[d.toISOString().split("T")[0]] = 0;
      }
      payments.forEach((p: any) => {
        if (p.payment_date in days) days[p.payment_date] += Number(p.amount);
      });
      setTrend(
        Object.entries(days).map(([k, v]) => ({
          day: new Date(k).toLocaleDateString("en", { day: "2-digit", month: "short" }),
          amount: v,
        }))
      );

      setStatusBreakdown(
        Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
      );
    })();
  }, []);

  if (!summary) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading dashboard…</div>;
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your lending business" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers" value={summary.customers} icon={Users} tone="primary" />
        <StatCard label="Active loans" value={summary.activeLoans} icon={Wallet} tone="primary" />
        <StatCard label="Due today" value={summary.dueToday} icon={CalIcon} tone="warning" />
        <StatCard label="Overdue" value={summary.overdue} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Outstanding" value={formatTHB(summary.outstanding)} icon={DollarSign} />
        <StatCard label="Today's collections" value={formatTHB(summary.todayCollections)} icon={TrendingUp} tone="success" />
        <StatCard label="Monthly profit" value={formatTHB(summary.monthlyProfit)} icon={Activity} tone={summary.monthlyProfit >= 0 ? "success" : "destructive"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Monthly collections
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number) => formatTHB(v)}
              />
              <Bar dataKey="collected" fill="hsl(220 80% 60%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Loan status
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                {statusBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#999"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-3">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Payment trend (last 14 days)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(220 80% 60%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(220 80% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number) => formatTHB(v)}
              />
              <Area type="monotone" dataKey="amount" stroke="hsl(220 80% 60%)" strokeWidth={2} fill="url(#areaFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
