<template>
  <WorkspaceModal
    :visible="visible"
    :title="$t('subPage.tag.addTagTitle')"
    @update:visible="dismiss"
  >
    <div class="resource-editor-fields">
      <ResourceField :label="$t('resourcePicker.tagSearch')">
        <FieldInput
          v-model="keyword"
          :placeholder="$t('subPage.tag.tagPlaceholder')"
          left-icon="i-lucide-search"
          clearable
        />
      </ResourceField>
      <ResourceField :label="$t('resourcePicker.tagSelection')">
        <SelectionGroup
          v-if="filteredTags.length"
          v-model="selectedTags"
          class="flex flex-wrap gap-x-5 gap-y-3 py-1"
        >
          <SelectionOption v-for="tag in filteredTags" :key="tag" :label="tag">
            {{ tag }}
          </SelectionOption>
        </SelectionGroup>
        <p v-else class="text-sm text-muted">
          {{ $t("resourcePicker.noTags") }}
        </p>
      </ResourceField>
      <ResourceField :label="$t('resourcePicker.newTag')">
        <div class="flex min-w-0 items-center gap-2">
          <FieldInput
            v-model="newTag"
            class="min-w-0 flex-1"
            :placeholder="$t('subPage.tag.tagPlaceholder')"
            :max-length="30"
            @keydown.enter.prevent="addTag"
          />
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="!newTag.trim()"
            @click="addTag"
          >
            {{ $t("workspace.add") }}
          </UButton>
        </div>
      </ResourceField>
    </div>
    <template #footer>
      <UButton color="neutral" variant="outline" size="sm" @click="dismiss">
        {{ $t("specificWord.cancel") }}
      </UButton>
      <UButton icon="i-lucide-check" size="sm" @click="confirm">
        {{ $t("specificWord.confirm") }}
      </UButton>
    </template>
  </WorkspaceModal>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import WorkspaceModal from "@/components/WorkspaceModal.vue";
import { useSubsStore } from "@/store/subs";
import { useArtifactsStore } from "@/store/artifacts";
import { normalizeTagArray } from "@/utils/shareTags";
const props = withDefaults(
  defineProps<{ visible?: boolean; currentTag?: string; type?: string }>(),
  {
    visible: false,
    currentTag: "",
    type: "subCol",
  },
);
const emit = defineEmits<{
  (event: "update:visible", value: boolean): void;
  (event: "setTag", value: string): void;
}>();
const subsStore = useSubsStore();
const artifactsStore = useArtifactsStore();
const keyword = ref("");
const newTag = ref("");
const selectedTags = ref<string[]>([]);
const addedTags = ref<string[]>([]);
const availableTags = computed(() => {
  const resources =
    props.type === "file"
      ? subsStore.files
      : props.type === "artifact"
        ? artifactsStore.artifacts
        : props.type === "share"
          ? subsStore.shares
          : [...subsStore.subs, ...subsStore.collections];
  return [
    ...new Set([
      ...resources.flatMap((item) => normalizeTagArray(item.tag)),
      ...normalizeTagArray(props.currentTag),
      ...addedTags.value,
    ]),
  ];
});
const filteredTags = computed(() =>
  availableTags.value.filter((tag) =>
    tag.toLowerCase().includes(keyword.value.trim().toLowerCase()),
  ),
);
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    selectedTags.value = normalizeTagArray(props.currentTag);
    keyword.value = "";
    newTag.value = "";
    addedTags.value = [];
  },
  { immediate: true },
);
const addTag = () => {
  const tag = newTag.value.trim();
  if (!tag) return;
  if (!availableTags.value.includes(tag)) addedTags.value.push(tag);
  if (!selectedTags.value.includes(tag)) selectedTags.value.push(tag);
  newTag.value = "";
  keyword.value = "";
};
const dismiss = () => emit("update:visible", false);
const confirm = () => {
  addTag();
  emit("setTag", selectedTags.value.join(","));
  dismiss();
};
defineExpose({ show: () => emit("update:visible", true), close: dismiss });
</script>
