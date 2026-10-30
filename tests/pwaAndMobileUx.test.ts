import { describe, test, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

vi.mock("next/font/google", () => ({
  Outfit: () => ({ variable: "--font-outfit" }),
  Plus_Jakarta_Sans: () => ({ variable: "--font-plus-jakarta" }),
}));

import { viewport, metadata } from "../src/app/layout";

describe("PWA and Mobile UX Technical Readiness", () => {
  const rootDir = path.resolve(__dirname, "..");
  const manifestPath = path.join(rootDir, "public", "manifest.json");
  const swPath = path.join(rootDir, "public", "sw.js");
  const offlinePath = path.join(rootDir, "public", "offline.html");

  describe("Web App Manifest Validation", () => {
    test("manifest.json exists and is valid JSON", () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const content = fs.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(content);
      expect(manifest.name).toBe("HabiVenture");
      expect(manifest.short_name).toBe("HabiVenture");
      expect(manifest.display).toBe("standalone");
      expect(manifest.start_url).toContain("/?source=pwa");
      expect(manifest.theme_color).toBe("#070B09");
      expect(manifest.background_color).toBe("#070B09");
      expect(manifest.lang).toBe("en");
      expect(Array.isArray(manifest.categories)).toBe(true);
    });

    test("manifest icons are defined and exist in public/icons", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

      const has192 = manifest.icons.some((i: any) => i.sizes === "192x192");
      const has512 = manifest.icons.some((i: any) => i.sizes === "512x512" && i.purpose !== "maskable");
      const hasMaskable = manifest.icons.some((i: any) => i.purpose === "maskable");

      expect(has192).toBe(true);
      expect(has512).toBe(true);
      expect(hasMaskable).toBe(true);

      manifest.icons.forEach((icon: any) => {
        const iconPath = path.join(rootDir, "public", icon.src.replace(/^\//, ""));
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });

    test("manifest includes mobile home-screen quick shortcuts", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
      expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);

      const shortcutUrls = manifest.shortcuts.map((s: any) => s.url);
      expect(shortcutUrls).toContain("/?tab=today");
      expect(shortcutUrls).toContain("/?tab=wheel");
      expect(shortcutUrls).toContain("/?tab=standings");
    });
  });

  describe("Service Worker & Offline Fallback", () => {
    test("sw.js exists with cache versioning and fetch routing", () => {
      expect(fs.existsSync(swPath)).toBe(true);
      const sw = fs.readFileSync(swPath, "utf-8");
      expect(sw).toContain("CACHE_VERSION");
      expect(sw).toContain("offline.html");
      expect(sw).toContain("SKIP_WAITING");
      expect(sw).toContain("Promise.allSettled");
    });

    test("offline.html exists with styled fallback UI", () => {
      expect(fs.existsSync(offlinePath)).toBe(true);
      const offline = fs.readFileSync(offlinePath, "utf-8");
      expect(offline).toContain("Offline");
      expect(offline).toContain("HabiVenture");
    });
  });

  describe("Viewport and Accessibility Compliance", () => {
    test("viewport allows user scaling for low vision accessibility (WCAG 1.4.4)", () => {
      expect(viewport.width).toBe("device-width");
      expect(viewport.initialScale).toBe(1);
      expect(viewport.viewportFit).toBe("cover");
      // maximumScale: 1 must NOT be set to allow user pinch-to-zoom
      expect((viewport as any).maximumScale).toBeUndefined();
    });

    test("layout metadata supports iOS Web App standalone mode", () => {
      expect(metadata.applicationName).toBe("HabiVenture");
      expect(metadata.manifest).toBe("/manifest.json");
      expect((metadata.appleWebApp as any)?.capable).toBe(true);
    });
  });
});
