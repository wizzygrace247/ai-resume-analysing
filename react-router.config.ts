import type { Config } from "@react-router/dev/config";

export default {
  // Enable SSR so resource routes can handle POST requests via route actions.
  ssr: true,
  future: {
    v8_middleware: true,
    v8_passThroughRequests: true,
    v8_splitRouteModules: true,
    v8_trailingSlashAwareDataRequests: true,
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
