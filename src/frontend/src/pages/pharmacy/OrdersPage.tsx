import { OrderStatus } from "@/backend";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrderMutation, usePharmacyOrders } from "@/hooks/useBackend";
import {
  CheckCircle,
  Clock,
  Plus,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type StatusFilter = "All" | keyof typeof OrderStatus;

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  [OrderStatus.Pending]: {
    label: "Pending",
    cls: "badge-warning",
    icon: <Clock className="w-3 h-3" />,
  },
  [OrderStatus.Shipped]: {
    label: "Shipped",
    cls: "badge-info",
    icon: <Truck className="w-3 h-3" />,
  },
  [OrderStatus.Delivered]: {
    label: "Delivered",
    cls: "badge-success",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  [OrderStatus.Cancelled]: {
    label: "Cancelled",
    cls: "badge-danger",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "Pending",
  "Shipped",
  "Delivered",
  "Cancelled",
];

interface CreateForm {
  patientId: string;
  medicineName: string;
  quantity: string;
}
const EMPTY_FORM: CreateForm = {
  patientId: "",
  medicineName: "",
  quantity: "",
};

export default function OrdersPage() {
  const { data: orders = [], isLoading } = usePharmacyOrders();
  const { create, updateStatus } = useOrderMutation();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);

  const filtered = orders.filter(
    (o) => statusFilter === "All" || o.status === statusFilter,
  );

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === OrderStatus.Pending).length,
    delivered: orders.filter((o) => o.status === OrderStatus.Delivered).length,
  };

  function closeModal() {
    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      patientId: form.patientId,
      pharmacyId: "self",
      medicineName: form.medicineName,
      quantity: BigInt(form.quantity),
    });
    toast.success("Order created");
    closeModal();
  }

  async function handleStatusChange(id: string, status: string) {
    await updateStatus.mutateAsync({ id, status: status as OrderStatus });
    toast.success("Order status updated");
  }

  const TIMELINE_STEPS = [
    { key: OrderStatus.Pending, label: "Pending", icon: Clock },
    { key: OrderStatus.Shipped, label: "Shipped", icon: Truck },
    { key: OrderStatus.Delivered, label: "Delivered", icon: CheckCircle },
  ];

  function getTimelinePos(status: OrderStatus) {
    if (status === OrderStatus.Cancelled) return -1;
    return TIMELINE_STEPS.findIndex((s) => s.key === status);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold gradient-text">
            Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage patient medicine orders
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="btn-gradient-glow text-white"
          data-ocid="orders.add_button"
        >
          <Plus className="w-4 h-4 mr-2" /> New Order
        </Button>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total",
            value: stats.total,
            cls: "text-foreground",
            accentColor: "border-t-primary/60",
          },
          {
            label: "Pending",
            value: stats.pending,
            cls: "text-amber-600 dark:text-yellow-400",
            accentColor: "border-t-yellow-500/60",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            cls: "text-emerald-600 dark:text-emerald-400",
            accentColor: "border-t-emerald-500/60",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card rounded-2xl p-4 text-center border-t-2 ${s.accentColor} hover:shadow-lg transition-shadow`}
          >
            <p className={`text-2xl font-display font-bold ${s.cls}`}>
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            data-ocid={`orders.filter.${f.toLowerCase()}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              statusFilter === f
                ? "gradient-brand text-white shadow-md"
                : "bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-7 h-7" />}
          title="No orders found"
          description="Create an order or change the status filter."
          action={{ label: "New Order", onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="space-y-3" data-ocid="orders.list">
          {filtered.map((order, idx) => {
            const sc = STATUS_CONFIG[order.status];
            const timelinePos = getTimelinePos(order.status);
            const isCancelled = order.status === OrderStatus.Cancelled;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="glass-card rounded-2xl p-4 hover:shadow-lg transition-all duration-200"
                data-ocid={`orders.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">
                        {order.medicineName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sc.cls}`}
                      >
                        {sc.icon}
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">#{order.id.slice(0, 8)}</span>
                      {" · "}
                      Patient: {order.patientId.slice(0, 12)}…{" · "}
                      Qty: {String(order.quantity)}
                      {" · "}
                      {new Date(Number(order.orderDate)).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                      aria-label="Update order status"
                      data-ocid={`orders.status_select.${idx + 1}`}
                      className="bg-input border border-input rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                    >
                      {Object.values(OrderStatus).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Timeline */}
                {!isCancelled && (
                  <div className="mt-3 flex items-center gap-0">
                    {TIMELINE_STEPS.map((step, stepIdx) => {
                      const StepIcon = step.icon;
                      const isActive = stepIdx <= timelinePos;
                      const isConnectorActive = stepIdx < timelinePos;
                      return (
                        <div
                          key={step.key}
                          className="flex items-center flex-1 last:flex-none"
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                              isActive
                                ? "gradient-brand border-transparent shadow-md"
                                : "bg-muted border-border"
                            }`}
                          >
                            <StepIcon
                              className={`w-3 h-3 ${
                                isActive
                                  ? "text-white"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          {stepIdx < TIMELINE_STEPS.length - 1 && (
                            <div
                              className={`flex-1 h-px mx-1 transition-all duration-500 ${
                                isConnectorActive
                                  ? "bg-gradient-to-r from-primary to-accent"
                                  : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {TIMELINE_STEPS[Math.max(0, timelinePos)]?.label}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Order Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
          role="presentation"
          onKeyDown={(e) => e.key === "Escape" && closeModal()}
          data-ocid="orders.dialog"
        >
          <motion.div
            className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h2 className="text-lg font-display font-bold gradient-text mb-5">
              Create New Order
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="order-patient"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Patient ID
                </label>
                <Input
                  id="order-patient"
                  value={form.patientId}
                  onChange={(e) =>
                    setForm({ ...form, patientId: e.target.value })
                  }
                  required
                  placeholder="Patient principal or ID"
                  className="bg-input border-input"
                  data-ocid="orders.patient_input"
                />
              </div>
              <div>
                <label
                  htmlFor="order-medicine"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Medicine Name
                </label>
                <Input
                  id="order-medicine"
                  value={form.medicineName}
                  onChange={(e) =>
                    setForm({ ...form, medicineName: e.target.value })
                  }
                  required
                  placeholder="e.g. Paracetamol 500mg"
                  className="bg-input border-input"
                  data-ocid="orders.medicine_input"
                />
              </div>
              <div>
                <label
                  htmlFor="order-qty"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Quantity
                </label>
                <Input
                  id="order-qty"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                  className="bg-input border-input"
                  data-ocid="orders.qty_input"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 btn-gradient-glow text-white"
                  disabled={create.isPending}
                  data-ocid="orders.submit_button"
                >
                  Create Order
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="border-border hover:bg-muted"
                  data-ocid="orders.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
