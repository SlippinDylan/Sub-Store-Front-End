import "@/assets/styles/fonts.scss";
import "@/assets/styles/ui.css";

import i18n from "@/locales";

import ui from "@nuxt/ui/vue-plugin";
import registerUI from "@/plugin/ui";
import router from "@/router";


import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";

export function initializeApp() {
  const pinia = createPinia();
  const app = createApp(App);

  registerUI(app);
  app.use(pinia);
  app.use(router);
  app.use(ui);
  app.use(i18n);
  app.mount("#app");
}
