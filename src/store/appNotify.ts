import { defineStore } from 'pinia';
import { notify } from '@/services/feedback';

const formatNotifyText = (value: unknown) => {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};
export const useAppNotifyStore = defineStore('appNotify', {
  state: (): AppNotifyStoreState => ({ isVisible: false, title: '', content: '', type: 'primary', duration: 800, navBartop: 0 }),
  actions: {
    showNotify({ title, content, type = 'primary', duration = 2500 }: NotifySettings) {
      const colors = { primary: 'primary', success: 'success', danger: 'error', warning: 'warning' } as const;
      notify({ title: formatNotifyText(title) || (type === 'danger' ? '操作失败' : '通知'), description: formatNotifyText(content), color: colors[type], duration });
    },
    setVisible(visible: boolean) { this.isVisible = visible; },
  },
});
