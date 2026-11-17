import HelpTip from "@/components/ui/HelpTip.vue";
import FieldTextarea from "@/components/ui/FieldTextarea.vue";
import ResourceAvatar from "@/components/ui/ResourceAvatar.vue";
import TagChip from "@/components/ui/TagChip.vue";
import type { App } from "vue";
import ResourceForm from "@/components/ui/ResourceForm.vue";
import ResourceField from "@/components/ui/ResourceField.vue";
import FieldInput from "@/components/ui/FieldInput.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import SettingsRow from "@/components/ui/SettingsRow.vue";
import SettingsSection from "@/components/ui/SettingsSection.vue";
import ChoiceGroup from "@/components/ui/ChoiceGroup.vue";
import ChoiceOption from "@/components/ui/ChoiceOption.vue";
import SelectionGroup from "@/components/ui/SelectionGroup.vue";
import SelectionOption from "@/components/ui/SelectionOption.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import ResourceImage from "@/components/ui/ResourceImage.vue";
export default (app: App) => {
  for (const [name, component] of Object.entries({
    HelpTip,
    FieldTextarea,
    ResourceAvatar,
    TagChip,
    ResourceForm,
    ResourceField,
    FieldInput,
    AppIcon,
    SettingsRow,
    SettingsSection,
    ChoiceGroup,
    ChoiceOption,
    SelectionGroup,
    SelectionOption,
    EmptyState,
    ResourceImage,
  }))
    app.component(name, component);
};
