<template>
  <div class="editor-action-card">
    <div class="settings-notice whitespace-pre-line">
      {{ $t("subscriptionEditor.duplicateFieldsHint") }}
    </div>
    <Draggable
      v-model="fields"
      item-key="id"
      handle=".duplicate-field-handle"
      :disabled="fields.length < 2"
      :force-fallback="true"
      class="divide-y divide-default"
    >
      <template #item="{ element, index }">
        <ResourceField
          :prop="`duplicate-field-${id}-${element.id}`"
          :label="$t('subscriptionEditor.duplicateFields')"
          :rules="[{
            validator: () => !isClearedField(element),
            message: $t('actionValidation.fillOrRemove'),
          }]"
        >
          <div class="flex min-w-0 items-center gap-2">
            <FieldInput
              v-model="element.path"
              :aria-label="$t('subscriptionEditor.duplicateFields')"
              :placeholder="$t(`editorPage.subConfig.nodeActions['${type}'].field.placeholder`)"
              :spellcheck="false"
              class="min-w-0 flex-1"
            />
            <div class="flex shrink-0 items-center">
              <UButton
                type="button"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="sm"
                :aria-label="$t('subscriptionEditor.deleteField')"
                @click="fields.splice(index, 1)"
              />
              <span
                v-if="fields.length > 1"
                :title="$t('subscriptionEditor.dragAction')"
                class="duplicate-field-handle inline-flex cursor-grab p-2 text-muted"
              >
                <UIcon name="i-lucide-grip-vertical" class="size-4" />
              </span>
            </div>
          </div>
        </ResourceField>
      </template>
    </Draggable>
    <div class="flex justify-end py-3">
      <UButton
        type="button"
        icon="i-lucide-plus"
        size="sm"
        color="neutral"
        variant="outline"
        @click="fields.push(createField())"
      >
        {{ $t("subscriptionEditor.addField") }}
      </UButton>
    </div>
    <ResourceField>
      <template #label>
        {{ $t(`editorPage.subConfig.nodeActions['${type}'].action.des`) }}
      </template>
      <ChoiceGroup direction="horizontal" v-model="args.action">
        <ChoiceOption
          v-for="(key, index) in actionList"
          :label="key"
          :key="index"
        >
          {{
            $t(
              `editorPage.subConfig.nodeActions['${type}'].action.options[${index}]`,
            )
          }}
        </ChoiceOption>
      </ChoiceGroup>
    </ResourceField>
    <template v-if="args.action === 'rename'">
      <ResourceField>
        <template #label>
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].position.des`) }}
        </template>
        <ChoiceGroup direction="horizontal" v-model="args.position">
          <ChoiceOption
            v-for="(key, index) in positionList"
            :label="key"
            :key="index"
          >
            {{
              $t(
                `editorPage.subConfig.nodeActions['${type}'].position.options[${index}]`,
              )
            }}
          </ChoiceOption>
        </ChoiceGroup>
      </ResourceField>
      <ResourceField>
        <template #label>
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].template.des`) }}
        </template>
        <div class="input-wrapper">
          <FieldTextarea
            :rows="3"
            :placeholder="
              $t(
                `editorPage.subConfig.nodeActions['${type}'].template.placeholder`,
              )
            "
            v-model="args.template"
          />
        </div>
      </ResourceField>
      <ResourceField>
        <template #label>
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].link.des`) }}
        </template>
        <div class="input-wrapper">
          <FieldInput
            label=""
            :placeholder="
              $t(`editorPage.subConfig.nodeActions['${type}'].link.placeholder`)
            "
            v-model="args.link"
          />
        </div>
      </ResourceField>
    </template>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, watch } from "vue";
import Draggable from "vuedraggable";

const { type, id } = defineProps<{ type: string; id: string }>();
const form = inject<Sub | Collection>("form");
const { args } = form.process.find((item) => item.id === id);
const actionList = ["rename", "delete"];
const positionList = ["front", "back"];

let nextFieldId = 0;
const createField = (originalPath?: string) => ({
  id: nextFieldId++,
  path: originalPath ?? "",
  originalPath,
});
const savedFields: string[] = args.field ??= ["name"];
const fields = ref(savedFields.map(createField));

const isClearedField = ({ path, originalPath }: ReturnType<typeof createField>) =>
  path === "" && !!originalPath;
const getDraftState = () => fields.value
  .filter(({ path, originalPath }) => path || originalPath !== undefined)
  .map(({ path }) => path);

watch(
  getDraftState,
  (paths) => {
    if (!fields.value.some(isClearedField)) args.field = paths;
  },
);
defineExpose({ getDraftState });
</script>

<style scoped>
.input-wrapper {
  display: flex;
  align-items: center;
}
</style>
