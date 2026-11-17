<template>
  <div class="editor-action-card">
    <div class="settings-notice whitespace-pre-line">
      {{ $t("subscriptionEditor.duplicateFieldsHint") }}
    </div>
    <ResourceField>
      <template #label>
        {{ $t("subscriptionEditor.duplicateFields") }}
      </template>
      <div class="tag-wrapper">
        <draggable
          item-key="id"
          v-model="dragData"
          :force-fallback="true"
          :scroll="true"
          v-bind="{
            chosenClass: 'chosentag',
          }"
        >
          <template #item="{ element, index }">
            <TagChip
              @click="onClickTag"
              class="tag-item"
              closeable
              @close="deleteItem(index)"
            >
              <span>{{ element.value }}</span>
            </TagChip>
          </template>
        </draggable>
      </div>
      <div class="input-wrapper gap-2">
        <FieldInput
          class="custom-input min-w-0 flex-1 w-auto"
          label=""
          :placeholder="
            $t(`editorPage.subConfig.nodeActions['${type}'].field.placeholder`)
          "
          v-model="input"
        />
        <UButton
          class="shrink-0 whitespace-nowrap"
          @click="addItem"
          :disabled="!input"
          icon="i-lucide-plus"
          size="sm"
          color="neutral"
          variant="outline"
        >
          {{ $t("subscriptionEditor.addField") }}
        </UButton>
      </div>
    </ResourceField>
    <ResourceField>
      <template #label>
        {{ $t(`editorPage.subConfig.nodeActions['${type}'].action.des`) }}
      </template>
      <ChoiceGroup direction="horizontal" v-model="value.action">
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
    <template v-if="value.action === 'rename'">
      <ResourceField>
        <template #label>
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].position.des`) }}
        </template>
        <ChoiceGroup direction="horizontal" v-model="value.position">
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
            v-model="value.template"
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
            v-model="value.link"
          />
        </div>
      </ResourceField>
    </template>
  </div>
</template>
<script lang="ts" setup>
  import { useI18n } from 'vue-i18n';
  import { Dialog } from '@/services/feedback';
  import { inject, onMounted, watch, reactive, toRaw, ref, computed } from 'vue';
  import draggable from "vuedraggable";
  const { t } = useI18n();
  const input = ref('');
  const { type, id } = defineProps<{
    type: string;
    id: string;
  }>();

  const form = inject<Sub | Collection>('form');

  const actionList = ['rename', 'delete'];
  const positionList = ['front', 'back'];

  const value = reactive({
    action: '',
    position: '',
    template: '',
    link: '',
    field: [],
  });
  const dragData = computed({
    get() {
      return Array.isArray(value.field) ? value.field.map((item, index) => ({
        id: index + JSON.stringify(item),
        value: item,
      })) : []
    },
    set(val) {
      val.map((item, index) => {
        value.field[index] = item.value
      })
    }
  })
const onClickTag = el => {
    const index = [...el.currentTarget.parentElement.children].indexOf(
      el.currentTarget
    );
    if (input.value ) {
      Dialog({
        title: t('editorPage.subConfig.pop.clickTag.title'),
        content: t('editorPage.subConfig.pop.clickTag.content'),
        popClass: 'auto-dialog',
        okText: t(`editorPage.subConfig.pop.clickTag.confirm`),
        cancelText: t(`editorPage.subConfig.pop.clickTag.cancel`),
        onOk: () => editTag(index),
        // onCancel: () => resolve(false),
        // @ts-ignore
        closeOnClickOverlay: true,
      });
    } else {
      editTag(index);
    }
  };

  const editTag = index => {
    const oldValue = value.field[index];

    value.field.splice(index, 1);

    input.value = oldValue;
  };

  const deleteItem = index => {
    value.field.splice(index, 1);
  };

  const addItem = () => {
    if (!input.value) return;

      value.field.push(input.value);

    input.value = ''
  };
  // 挂载时将 value 值指针指向 form 对应的数据
  onMounted(() => {
    const item = form.process.find(item => item.id === id);
    if (item) {
      value.action = item.args.action;
      value.position = item.args.position;
      value.template = item.args.template;
      value.link = item.args.link;
      value.field = item.args.field || ['name'];
    }
  });

  watch(value, () => {
    const item = form.process.find(item => item.id === id);
    if (item) item.args = toRaw(value);
  });
  defineExpose({ commitPending: () => { if (input.value) addItem(); }, getDraftState: () => input.value });
</script>

<style lang="scss" scoped>
  .des-label {
    font-size: 12px;
    margin-bottom: 8px;
    color: var(--ui-text-muted);

    &:not(:first-child) {
      margin-top: 16px;
    }
  }

  .input-wrapper {
    display: flex;
    align-items: center;
  }

  .tag-wrapper {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    margin-bottom: 12px;
    max-width: 100%;
    cursor: pointer;

    &:active {
      cursor: grabbing;
      cursor: -moz-grabbing;
      cursor: -webkit-grabbing;
    }

    .tag-item {
      max-width: 100%;
      margin-right: 8px;
      margin-bottom: 8px;

      span {
        max-width: 95%;
        min-width: 20px;
        display: -webkit-box;
        white-space: normal !important;
        overflow: hidden;
        text-overflow: ellipsis;
        word-wrap: break-word;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      }
    }
  }

  .chosentag {
    box-shadow: 0 0 5px var(--ui-primary);
    overflow: hidden;
  }

  .input-wrapper {
    display: flex;
    align-items: center;

    > svg {
      width: 20px;
      height: 20px;
      color: var(--ui-primary);
      flex: 1;
      padding-right: 12px;
    }
  }
</style>
