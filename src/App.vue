<script setup lang="ts">
import { MainUiProvider, WorkbenchShell } from "main-ui/vue";
import "main-ui/styles.css";
import { createGalleryRuntime } from "./runtime/createGalleryRuntime";

const runtime = createGalleryRuntime();
</script>

<template>
  <MainUiProvider :runtime="runtime">
    <WorkbenchShell />
  </MainUiProvider>
</template>