"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.info(
                    "[HabiVenture PWA] A new version is available. Refresh to update."
                  );
                  window.dispatchEvent(
                    new CustomEvent("habiventure-sw-update", {
                      detail: { worker: installingWorker },
                    })
                  );
                }
              });
            }
          });

          if (process.env.NODE_ENV === "development") {
            console.log(
              "[HabiVenture PWA] Service Worker registered successfully:",
              registration.scope
            );
          }
        } catch (error) {
          console.error(
            "[HabiVenture PWA] Service Worker registration failed:",
            error
          );
        }
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    }
  }, []);

  return null;
}
