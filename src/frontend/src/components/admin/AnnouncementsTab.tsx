import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import type { AnnouncementPublic } from "../../backend.d";
import { AnnouncementTarget, AnnouncementUrgency } from "../../backend.d";

const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  [AnnouncementTarget.all]: "All Users",
  [AnnouncementTarget.adminsOnly]: "Admins Only",
  [AnnouncementTarget.newUsers]: "New Users",
  [AnnouncementTarget.inactiveUsers]: "Inactive Users",
};

const URGENCY_BADGE: Record<
  AnnouncementUrgency,
  { label: string; cls: string }
> = {
  [AnnouncementUrgency.info]: {
    label: "Info",
    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  [AnnouncementUrgency.warning]: {
    label: "Warning",
    cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  [AnnouncementUrgency.urgent]: {
    label: "Urgent",
    cls: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

type FormState = {
  title: string;
  message: string;
  urgency: AnnouncementUrgency;
  target: AnnouncementTarget;
  scheduledAt: string;
  expiresAt: string;
  editingId: bigint | null;
  editingIsActive: boolean;
};

const DEFAULT_FORM: FormState = {
  title: "",
  message: "",
  urgency: AnnouncementUrgency.info,
  target: AnnouncementTarget.all,
  scheduledAt: "",
  expiresAt: "",
  editingId: null,
  editingIsActive: true,
};

export function AnnouncementsTab() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const { data: announcements, isLoading } = useQuery<AnnouncementPublic[]>({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminListAnnouncements();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const scheduled = form.scheduledAt
        ? BigInt(new Date(form.scheduledAt).getTime() * 1_000_000)
        : null;
      const expires = form.expiresAt
        ? BigInt(new Date(form.expiresAt).getTime() * 1_000_000)
        : null;
      await actor.adminCreateAnnouncement(
        form.title,
        form.message,
        form.urgency,
        form.target,
        scheduled,
        expires,
      );
    },
    onSuccess: () => {
      toast.success("Announcement created ✓");
      setForm(DEFAULT_FORM);
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: () => toast.error("Failed to create announcement"),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !form.editingId) throw new Error("No actor");
      const scheduled = form.scheduledAt
        ? BigInt(new Date(form.scheduledAt).getTime() * 1_000_000)
        : null;
      const expires = form.expiresAt
        ? BigInt(new Date(form.expiresAt).getTime() * 1_000_000)
        : null;
      const result = await actor.adminUpdateAnnouncement(
        form.editingId,
        form.title,
        form.message,
        form.urgency,
        form.target,
        scheduled,
        expires,
        form.editingIsActive,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("Announcement updated ✓");
      setForm(DEFAULT_FORM);
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: (e) =>
      toast.error(`Failed: ${e instanceof Error ? e.message : "Error"}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.adminDeleteAnnouncement(id);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("Announcement deleted");
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: (e) =>
      toast.error(`Failed: ${e instanceof Error ? e.message : "Error"}`),
  });

  const now = Date.now() * 1_000_000;

  const getStatus = (a: AnnouncementPublic): { label: string; cls: string } => {
    if (!a.isActive)
      return {
        label: "Inactive",
        cls: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      };
    if (a.scheduledAt && Number(a.scheduledAt) > now)
      return {
        label: "Scheduled",
        cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      };
    if (a.expiresAt && Number(a.expiresAt) <= now)
      return {
        label: "Expired",
        cls: "bg-red-500/20 text-red-400 border-red-500/30",
      };
    return {
      label: "Active",
      cls: "bg-green-500/20 text-green-400 border-green-500/30",
    };
  };

  const startEdit = (ann: AnnouncementPublic) => {
    setForm({
      title: ann.title,
      message: ann.message,
      urgency: ann.urgency,
      target: ann.target,
      scheduledAt: ann.scheduledAt
        ? new Date(Number(ann.scheduledAt) / 1_000_000)
            .toISOString()
            .slice(0, 16)
        : "",
      expiresAt: ann.expiresAt
        ? new Date(Number(ann.expiresAt) / 1_000_000).toISOString().slice(0, 16)
        : "",
      editingId: ann.id,
      editingIsActive: ann.isActive,
    });
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isEditing = form.editingId !== null;
  const activeCount = (announcements ?? []).filter(
    (a) => a.isActive && (!a.expiresAt || Number(a.expiresAt) > now),
  ).length;

  return (
    <div className="space-y-6" data-ocid="announcements-tab">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-orange-400" />
        <span className="text-sm text-gray-300">
          {activeCount} active announcement{activeCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create/Edit Form */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-4">
          <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            {isEditing ? (
              <Pencil className="w-4 h-4 text-orange-400" />
            ) : (
              <Plus className="w-4 h-4 text-orange-400" />
            )}
            {isEditing ? "Edit Announcement" : "Create Announcement"}
          </h3>

          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Title (required)</Label>
            <Input
              data-ocid="announcement-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Announcement title..."
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Message (required)</Label>
            <Textarea
              data-ocid="announcement-message"
              value={form.message}
              onChange={(e) => setField("message", e.target.value)}
              placeholder="Your announcement message..."
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">Urgency</Label>
              <div className="flex gap-1.5">
                {(
                  Object.values(AnnouncementUrgency) as AnnouncementUrgency[]
                ).map((u) => {
                  const b = URGENCY_BADGE[u];
                  return (
                    <button
                      key={u}
                      type="button"
                      data-ocid={`urgency-${u}`}
                      onClick={() => setField("urgency", u)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.urgency === u
                          ? `${b.cls} border-current`
                          : "bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">Target Audience</Label>
              <select
                data-ocid="announcement-target"
                value={form.target}
                onChange={(e) =>
                  setField("target", e.target.value as AnnouncementTarget)
                }
                className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md px-3 py-2 text-sm"
              >
                {Object.values(AnnouncementTarget).map((t) => (
                  <option key={t} value={t}>
                    {TARGET_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">
                Schedule At (optional)
              </Label>
              <Input
                data-ocid="announcement-schedule"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setField("scheduledAt", e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-200 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">
                Expires At (optional)
              </Label>
              <Input
                data-ocid="announcement-expires"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setField("expiresAt", e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-200 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing && (
              <Button
                variant="outline"
                onClick={() => setForm(DEFAULT_FORM)}
                className="border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                Cancel
              </Button>
            )}
            <Button
              data-ocid={
                isEditing ? "update-announcement" : "create-announcement"
              }
              onClick={() =>
                isEditing ? updateMutation.mutate() : createMutation.mutate()
              }
              disabled={
                !form.title.trim() ||
                !form.message.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold"
            >
              <Send className="w-4 h-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending
                ? "Saving…"
                : isEditing
                  ? "Update Announcement"
                  : "Create Announcement"}
            </Button>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-200">
            All Announcements ({announcements?.length ?? 0})
          </h3>
          {isLoading ? (
            [1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-20 rounded-xl bg-gray-800" />
            ))
          ) : (announcements ?? []).length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
              <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p
                className="text-gray-500 text-sm"
                data-ocid="announcements-empty"
              >
                No announcements yet
              </p>
            </div>
          ) : (
            (announcements ?? [])
              .sort((a, b) => Number(b.createdAt - a.createdAt))
              .map((ann) => {
                const status = getStatus(ann);
                const urgency = URGENCY_BADGE[ann.urgency];
                return (
                  <div
                    key={ann.id.toString()}
                    data-ocid={`announcement-row-${ann.id}`}
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-200 text-sm truncate">
                          {ann.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {ann.message}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          data-ocid={`edit-announcement-${ann.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(ann)}
                          className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 h-7 w-7 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`delete-announcement-${ann.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(ann.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium border ${status.cls}`}
                      >
                        {status.label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium border ${urgency.cls}`}
                      >
                        {urgency.label}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-700 text-gray-400 border border-gray-600">
                        {TARGET_LABELS[ann.target]}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(
                          Number(ann.createdAt) / 1_000_000,
                        ).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
