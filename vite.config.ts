/**
 * Module: vite.config
 * Description: Configures Vite's React plugin for development and production builds.
 * Inputs: Vite configuration loading.
 * Outputs: React-enabled Vite configuration.
 * External source: Vite and @vitejs/plugin-react project dependencies.
 * OpenAI Copilot assisted with documentation updates.
 * Updated: 2026-10-10
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
