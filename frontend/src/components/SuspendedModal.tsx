import { useEffect, useState } from "react";
import { ShieldX, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dispatched from api.ts or AuthContext.tsx (non-React contexts) to trigger
 * the suspended-account modal without requiring a React prop chain.
 *
 * Uses a module-level flag so it can only fire ONCE per page load.
 * The flag resets when the user navigates (full page reload).
 */
export const SUSPENDED_EVENT = "app:account-suspended";

let _suspendedDispatched = false;

export function dispatchSuspended() {
  // Guard: only fire once — prevents loop from multiple 403 responses
  if (_suspendedDispatched) return;
  _suspendedDispatched = true;

  // Clear the auth token immediately so no more authenticated requests fire
  localStorage.removeItem("auth_token");

  window.dispatchEvent(new CustomEvent(SUSPENDED_EVENT));
}

export function SuspendedModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(SUSPENDED_EVENT, handler);
    return () => window.removeEventListener(SUSPENDED_EVENT, handler);
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    // Full navigation — resets the module flag on the next page load
    window.location.href = "/login";
  };

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600" />

        <div className="flex flex-col items-center gap-4 px-8 py-8 text-center">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-4 ring-red-500/20">
            <ShieldX className="h-8 w-8 text-red-500" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              บัญชีถูกระงับการใช้งาน
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              บัญชีร้านค้าของคุณถูก<span className="font-semibold text-red-500">ระงับชั่วคราว</span>{" "}
              โดยผู้ดูแลระบบ
            </p>
          </div>

          {/* Contact hint */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground w-full">
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            <span>กรุณาติดต่อ <span className="font-semibold text-foreground">Admin</span> เพื่อปลดล็อกระบบ</span>
          </div>

          {/* Action */}
          <Button
            id="suspended-modal-confirm"
            onClick={handleConfirm}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-5 rounded-xl shadow-lg"
          >
            รับทราบและออกจากระบบ
          </Button>
        </div>
      </div>
    </div>
  );
}
