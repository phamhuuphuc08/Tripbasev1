import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, too small for an avatar photo upload
      // (src/features/profile/actions.ts). Kept a bit above the 4MB
      // application-level check in src/server/storage/avatar.ts to leave
      // room for multipart/form-data overhead.
      bodySizeLimit: "10mb",
    },
  },
};

export default withNextIntl(nextConfig);
