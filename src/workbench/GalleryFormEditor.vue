<script setup lang="ts">
import { ref } from "vue";
import type { EditorRenderContext } from "main-ui/core";
import { FormView } from "@main-ui/view-form";
import type { FormSchema, FormValues, FormChangePayload, FormSubmitPayload } from "@main-ui/view-form";

defineOptions({
  name: "GalleryFormEditor",
});

defineProps<{
  context: EditorRenderContext;
}>();

/**
 * 画廊参数配置 schema。
 *
 * 用于配置复杂系统可视化的全局参数，宿主裁决后生效。
 */
const SCHEMA: FormSchema = {
  fields: [
  {
    key: "particleCount",
    kind: "number",
    label: "粒子数量",
    defaultValue: 60,
    min: 10,
    max: 500,
  },
  {
    key: "connectionDistance",
    kind: "number",
    label: "连线距离阈值",
    defaultValue: 120,
    min: 20,
    max: 300,
  },
  {
    key: "animationSpeed",
    kind: "number",
    label: "动画速度",
    defaultValue: 0.6,
    min: 0.1,
    max: 3.0,
  },
  {
    key: "colorScheme",
    kind: "select",
    label: "配色方案",
    defaultValue: "blue",
    options: [
      { value: "blue", label: "蓝色系" },
      { value: "warm", label: "暖色系" },
      { value: "green", label: "绿色系" },
      { value: "mono", label: "单色系" },
    ],
  },
  {
    key: "showLabels",
    kind: "boolean",
    label: "显示标签",
    defaultValue: true,
  },
  {
    key: "description",
    kind: "textarea",
    label: "备注说明",
    defaultValue: "",
  },
  ],
};

const formValues = ref<FormValues>({
  particleCount: 60,
  connectionDistance: 120,
  animationSpeed: 0.6,
  colorScheme: "blue",
  showLabels: true,
  description: "",
});

function handleChange(payload: FormChangePayload): void {
  formValues.value = {
    ...formValues.value,
    [payload.key]: payload.value,
  };
}

function handleSubmit(payload: FormSubmitPayload): void {
  if (payload.valid) {
    window.dispatchEvent(
      new CustomEvent("gallery:apply-settings", { detail: payload.values }),
    );
  }
}
</script>

<template>
  <div class="gallery-form-editor">
    <FormView
      :schema="SCHEMA"
      :values="formValues"
      submit-label="应用参数"
      @change="handleChange"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.gallery-form-editor {
  width: 100%;
  height: 100%;
}
</style>
