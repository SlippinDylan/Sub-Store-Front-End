<template>
  <UModal
    :open="visible"
    :title="title"
    :dismissible="!busy && dismissible"
    :close="!busy && closeable"
    :ui="{
      content:
        'workspace-modal w-[760px] max-w-[calc(100vw-2rem)] max-h-[70dvh] sm:max-h-[70dvh]',
      header: 'shrink-0 min-h-14 px-5 py-3',
      body: 'workspace-modal-content overflow-y-auto min-h-0 p-5 sm:p-5',
      footer:
        'workspace-modal-footer shrink-0 justify-end flex-wrap gap-2 px-5 py-3',
    }"
    @update:open="updateVisible"
    @after:enter="$emit('opened')"
    @after:leave="$emit('closed')"
  >
    <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    <template #body><slot v-if="contentReady" /></template>
    <template v-if="$slots.footer || footerTarget" #footer>
      <div
        v-if="footerTarget"
        :id="footerTarget"
        ref="footer"
        class="contents"
      />
      <slot name="footer" />
    </template>
  </UModal>
</template>
<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
const props = withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    busy?: boolean;
    footerTarget?: string;
    dismissible?: boolean;
    closeable?: boolean;
  }>(),
  { busy: false, dismissible: true, closeable: true },
);
const emit = defineEmits<{
  (event: "update:visible", value: boolean): void;
  (event: "opened"): void;
  (event: "closed"): void;
}>();
const footer = ref<HTMLElement | null>(null);
const contentReady = ref(!props.footerTarget);
// Editor actions teleport into the footer, which must exist before editor setup.
watch(footer, async (element) => {
  if (element) {
    await nextTick();
    contentReady.value = true;
  } else if (props.footerTarget) contentReady.value = false;
});
const updateVisible = (visible: boolean) => {
  if (!props.busy) emit("update:visible", visible);
};
</script>
