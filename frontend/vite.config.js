import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, Vite forwards /api calls to the Next.js backend on
// port 3001, so the frontend and backend feel like one site.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:3001" } },
});
