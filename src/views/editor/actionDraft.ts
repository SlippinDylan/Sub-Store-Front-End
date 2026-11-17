import type { InjectionKey, Ref } from "vue";

// The page owns navigation protection, including any unconfirmed operation draft.
export const actionDraftDirtyKey: InjectionKey<Ref<boolean>> =
  Symbol("action-draft-dirty");

export const actionDialogKey: InjectionKey<boolean> = Symbol("action-dialog");
