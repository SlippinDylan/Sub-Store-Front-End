import { shallowReactive, type VNode } from "vue";

export interface DialogOptions {
  title?: string;
  content?: string | VNode;
  okText?: string;
  cancelText?: string;
  onOk?: () => unknown;
  onCancel?: () => unknown;
  onOpened?: () => unknown;
  onClosed?: () => unknown;
  beforeClose?: () => boolean | Promise<boolean>;
  noOkBtn?: boolean;
  noCancelBtn?: boolean;
  okBtnDisabled?: boolean;
  closeable?: boolean;
  closeOnClickOverlay?: boolean;
  closeOnPopstate?: boolean;
  popClass?: string;
  textAlign?: string;
  lockScroll?: boolean;
  closeIcon?: string;
}
export interface DialogEntry {
  id: number;
  options: DialogOptions;
}
export const dialogs = shallowReactive<DialogEntry[]>([]);
let sequence = 0;
export const Dialog = (options: DialogOptions) => {
  dialogs.push({ id: ++sequence, options });
};
export const dismissDialog = async (entry: DialogEntry) => {
  if (entry.options.beforeClose && !(await entry.options.beforeClose())) return;
  const index = dialogs.indexOf(entry);
  if (index !== -1) {
    dialogs.splice(index, 1);
    entry.options.onClosed?.();
  }
};
export const performDialogAction = async (
  entry: DialogEntry,
  action: "ok" | "cancel",
) => {
  await (action === "ok" ? entry.options.onOk?.() : entry.options.onCancel?.());
  await dismissDialog(entry);
};

type NotificationColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "neutral";
export interface Notification {
  id: string;
  title: string;
  description?: string;
  color: NotificationColor;
  duration: number;
  loading?: boolean;
}
interface ToastOptions {
  id?: string;
  duration?: number;
  cover?: boolean;
  title?: string;
}
export const notifications = shallowReactive(new Map<string, Notification>());
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const hide = (id?: string) => {
  for (const key of id ? [id] : notifications.keys()) {
    clearTimeout(timers.get(key));
    timers.delete(key);
    notifications.delete(key);
  }
};
export const notify = (
  notification: Omit<Notification, "id"> & { id?: string },
) => {
  const id = notification.id || `notice-${++sequence}`;
  hide(id);
  notifications.set(id, { ...notification, id });
  if (notification.duration > 0)
    timers.set(
      id,
      setTimeout(() => hide(id), notification.duration),
    );
};
const message =
  (color: NotificationColor, loading = false) =>
  (title: string, options: ToastOptions = {}) =>
    notify({
      id: options.id,
      title,
      color,
      loading,
      duration: options.duration ?? (loading ? 0 : 3000),
    });
export const Toast = {
  text: message("neutral"),
  warn: message("warning"),
  fail: message("error"),
  success: message("success"),
  loading: message("primary", true),
  hide,
};
