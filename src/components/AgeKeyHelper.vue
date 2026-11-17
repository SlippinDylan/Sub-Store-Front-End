<template>
  <div class="age-key-helper">
    <UButton
      type="button"
      class="age-key-trigger"
      :aria-label="$t('ageKey.helper.open')"
      @click="openDialog"
     color="neutral" variant="outline">
      <AppIcon name="refresh" />
    </UButton>

    <WorkspaceModal
      v-model:visible="visible"
      :title="$t('ageKey.helper.title')"
      close-on-click-overlay
    >
      <div class="age-key-helper-body">
        <div class="age-key-type-block">
          <div class="age-key-section-title">
            {{ $t("ageKey.helper.type") }}
          </div>
          <div class="radio-wrapper age-key-type-wrapper">
            <ChoiceGroup direction="horizontal" v-model="keyType">
              <ChoiceOption shape="button" :label="AGE_KEY_TYPES.X25519">
                X25519
              </ChoiceOption>
              <ChoiceOption shape="button" :label="AGE_KEY_TYPES.HYBRID">
                MLKEM768-X25519
              </ChoiceOption>
            </ChoiceGroup>
          </div>
        </div>

        <section class="age-key-section">
          <div class="age-key-section-header">
            <div class="age-key-section-title">
              {{ $t("ageKey.secretKey.label") }}
            </div>
            <div class="age-key-section-actions">
              <UButton
                size="sm"
                color="primary"
                class="age-key-action-button"
                :loading="isBusy"
                @click="handleGenerate"
              >
                {{ $t("ageKey.helper.generate") }}
              </UButton>
              <UButton
                size="sm" variant="outline"
                class="age-key-action-button"
                :disabled="!secretKey"
                @click="copyValue(secretKey)"
              >
                {{ $t("ageKey.helper.copySecret") }}
              </UButton>
              <UButton
                v-if="props.applyMode === 'secret'"
                size="sm"
                color="primary"
                class="age-key-action-button"
                :disabled="!secretKey"
                @click="fillSecretKey"
              >
                {{ $t("ageKey.helper.applyPublic") }}
              </UButton>
            </div>
          </div>
          <div class="age-key-textarea-wrapper">
            <FieldTextarea
              v-model="secretKey"
              class="age-key-textarea"
              rows="3"
              :autosize="{ minHeight: 70, maxHeight: 140 }"
              :placeholder="$t('ageKey.secretKey.placeholder')"
            />
            <UButton
              v-if="secretKey"
              type="button"
              class="age-key-clear"
              :aria-label="$t('ageKey.helper.clearSecret')"
              @click="secretKey = ''"
             color="neutral" variant="outline">
              <AppIcon name="mask-close" />
            </UButton>
          </div>
        </section>

        <section v-if="props.applyMode !== 'secret'" class="age-key-section">
          <div class="age-key-section-header">
            <div class="age-key-section-title">
              {{ $t("ageKey.publicKey.label") }}
            </div>
            <div class="age-key-section-actions">
              <UButton
                size="sm" variant="outline"
                class="age-key-action-button"
                :disabled="!secretKey"
                :loading="isBusy"
                @click="handleDerive"
              >
                {{ $t("ageKey.helper.derive") }}
              </UButton>
              <UButton
                size="sm" variant="outline"
                class="age-key-action-button"
                :disabled="!publicKey"
                @click="copyValue(publicKey)"
              >
                {{ $t("ageKey.helper.copyPublic") }}
              </UButton>
              <UButton
                v-if="props.applyMode === 'pair'"
                size="sm"
                color="primary"
                class="age-key-action-button"
                :disabled="!secretKey || !publicKey"
                @click="fillKeyPair"
              >
                {{ $t("ageKey.helper.applyPair") }}
              </UButton>
              <UButton
                v-else
                size="sm"
                color="primary"
                class="age-key-action-button"
                :disabled="!publicKey"
                @click="fillPublicKey"
              >
                {{ $t("ageKey.helper.applyPublic") }}
              </UButton>
            </div>
          </div>
          <div class="age-key-textarea-wrapper">
            <FieldTextarea
              v-model="publicKey"
              class="age-key-textarea"
              rows="2"
              :autosize="{ minHeight: 48, maxHeight: 100 }"
              :placeholder="$t('ageKey.publicKey.placeholder')"
            />
            <UButton
              v-if="publicKey"
              type="button"
              class="age-key-clear"
              :aria-label="$t('ageKey.helper.clearPublic')"
              @click="publicKey = ''"
             color="neutral" variant="outline">
              <AppIcon name="mask-close" />
            </UButton>
          </div>
        </section>

        <p class="age-helper-tips">
          {{
            $t(
              props.applyMode === "secret"
                ? "ageKey.helper.secretTips"
                : "ageKey.helper.tips",
            )
          }}
        </p>
      </div>
      <template #footer>
        <UButton
          size="sm"
          color="primary"
          class="age-key-close"
          @click="visible = false"
        >
          {{ $t("ageKey.helper.close") }}
        </UButton>
      </template>
    </WorkspaceModal>
  </div>
</template>

<script setup lang="ts">
import WorkspaceModal from "@/components/WorkspaceModal.vue";
import { Toast } from '@/services/feedback';
import { copyText } from "@/utils/clipboard";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import {
  AGE_KEY_TYPES,
  AGE_PUBLIC_KEY,
  AGE_SECRET_KEY,
  type AgeKeyType,
  derivePublicKey,
  generateKeyPair,
} from "@/utils/age";

const props = withDefaults(defineProps<{
  modelValue?: string;
  applyMode?: "public" | "pair" | "secret";
}>(), {
  applyMode: "public",
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "apply", value: string): void;
  (event: "apply-pair", value: { [AGE_SECRET_KEY]: string; [AGE_PUBLIC_KEY]: string }): void;
}>();

const { t } = useI18n();
const visible = ref(false);
const isBusy = ref(false);
const keyType = ref<AgeKeyType>(AGE_KEY_TYPES.X25519);
const publicKey = ref("");
const secretKey = ref("");

const openDialog = () => {
  secretKey.value = "";
  publicKey.value = "";
  visible.value = true;
};

const getErrorMessage = (error: any) => {
  return error?.response?.data?.error?.message || error?.message || String(error);
};

const handleError = (error: unknown) => {
  Toast.fail(`${t("ageKey.helper.error")}: ${getErrorMessage(error)}`);
};

const handleGenerate = async () => {
  isBusy.value = true;
  try {
    const pair = await generateKeyPair(keyType.value);
    secretKey.value = pair[AGE_SECRET_KEY];
    publicKey.value = pair[AGE_PUBLIC_KEY];
  } catch (error) {
    handleError(error);
  } finally {
    isBusy.value = false;
  }
};

const handleDerive = async () => {
  isBusy.value = true;
  try {
    publicKey.value = await derivePublicKey(secretKey.value);
  } catch (error) {
    handleError(error);
  } finally {
    isBusy.value = false;
  }
};

const fillPublicKey = () => {
  const value = publicKey.value.trim();
  emit("update:modelValue", value);
  emit("apply", value);
  Toast.text(t("ageKey.helper.filled"));
};

const fillSecretKey = () => {
  const value = secretKey.value.trim();
  emit("update:modelValue", value);
  emit("apply", value);
  Toast.text(t("ageKey.helper.filled"));
};

const fillKeyPair = () => {
  const identity = secretKey.value.trim();
  const recipient = publicKey.value.trim();
  emit("update:modelValue", recipient);
  emit("apply", recipient);
  emit("apply-pair", {
    [AGE_SECRET_KEY]: identity,
    [AGE_PUBLIC_KEY]: recipient,
  });
  Toast.text(t("ageKey.helper.filledPair"));
};

const copyValue = async (value: string) => {
  try {
    await copyText(value);
    Toast.text(t("ageKey.helper.copied"));
  } catch (error) {
    handleError(error);
  }
};
</script>

<style scoped lang="scss">
.age-key-helper {
  display: flex;
  justify-content: flex-end;
}

.age-key-trigger {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ui-primary);
  cursor: pointer;
  opacity: 0.9;

  &:hover {
    opacity: 1;
  }
}

.age-key-helper-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;
}

.age-key-type-block,
.age-key-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.age-key-type-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.age-key-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.age-key-section-title {
  flex: 0 0 auto;
  color: var(--ui-text-muted);
  font-size: 14px;
  line-height: 1.4;
}

.age-key-section-actions {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.age-key-action-button {
  height: 26px !important;
  min-height: 26px !important;
  min-width: 0;
  padding: 0 !important;
}

.age-key-textarea-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: 4px;
  background: var(--ui-bg);
}

.age-key-textarea {
  width: 100%;
  background: transparent !important;
  padding: 0 !important;
  font-size: 11px;
  line-height: 1.4;
  color: var(--ui-text);
}

.age-key-clear {
  position: absolute;
  top: 50%;
  right: 8px;
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ui-text-muted);
  cursor: pointer;
  transform: translateY(-50%);
}

.age-helper-tips {
  margin: 0;
  color: var(--ui-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.age-key-close {
  height: 28px !important;
  min-width: 96px;
  padding: 0 !important;
}

@media (min-width: 768px) {
  .age-key-action-button {
    height: 28px !important;
    min-height: 28px !important;
    padding: 4px 8px !important;
  }
  .age-key-close {
    padding: 4px 8px !important;
  }
}

</style>
