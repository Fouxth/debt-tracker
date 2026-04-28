import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/customers")({
  component: () => (
    <ProtectedRoute><AppLayout><Customers /></AppLayout></ProtectedRoute>
  ),
});

type Customer = { id: string; full_name: string; phone: string | null; id_card: string | null; address: string | null; notes: string | null; risk_level: string; created_at: string };

function Customers() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const load = async () => {
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Customer[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.full_name.toLowerCase().includes(q) || r.phone?.toLowerCase().includes(q) || r.id_card?.toLowerCase().includes(q);
  });

  const remove = async (id: string) => {
    if (!confirm("Delete this customer? All linked loans will be removed too.")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logActivity("delete_customer", "customer", id);
    toast.success("Customer deleted");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${rows.length} total`}
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="mr-1 h-4 w-4" />New customer</Button>
            </DialogTrigger>
            <CustomerForm editing={editing} onDone={() => { setOpen(false); load(); }} />
          </Dialog>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, ID card…" className="pl-9" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>ID card</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link to="/customers/$id" params={{ id: c.id }} className="font-medium hover:underline">
                    {c.full_name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{c.id_card || "—"}</TableCell>
                <TableCell>
                  <StatusBadge tone={c.risk_level === "high" ? "destructive" : c.risk_level === "medium" ? "warning" : "success"}>
                    {c.risk_level}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No customers found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CustomerForm({ editing, onDone }: { editing: Customer | null; onDone: () => void }) {
  const [form, setForm] = useState({
    full_name: editing?.full_name ?? "",
    phone: editing?.phone ?? "",
    id_card: editing?.id_card ?? "",
    address: editing?.address ?? "",
    notes: editing?.notes ?? "",
    risk_level: editing?.risk_level ?? "low",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...form, created_by: user?.id };
    const { error } = editing
      ? await supabase.from("customers").update(form as any).eq("id", editing.id)
      : await supabase.from("customers").insert(payload as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    await logActivity(editing ? "update_customer" : "create_customer", "customer", editing?.id, { name: form.full_name });
    toast.success(editing ? "Customer updated" : "Customer added");
    onDone();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? "Edit customer" : "New customer"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5"><Label>Full name</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>ID card</Label><Input value={form.id_card} onChange={(e) => setForm({ ...form, id_card: e.target.value })} /></div>
        </div>
        <div className="space-y-1.5"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>Risk level</Label>
          <Select value={form.risk_level} onValueChange={(v) => setForm({ ...form, risk_level: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <DialogFooter><Button type="submit" disabled={busy}>{editing ? "Save" : "Add"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
