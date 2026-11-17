import type { InjectionKey, Ref } from "vue";
export type ChoiceValue = string | number | boolean;
export const choiceKey: InjectionKey<{
  value: Ref<ChoiceValue | undefined>;
  select: (value: ChoiceValue) => void;
}> = Symbol("choice");
export const selectionKey: InjectionKey<{
  value: Ref<ChoiceValue[]>;
  select: (value: ChoiceValue, selected: boolean) => void;
}> = Symbol("selection");
