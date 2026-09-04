# Local/dev image — optimized for a reliable one-command `docker compose up`,
# not for minimal image size. Revisit with a multi-stage + Next.js
# `output: "standalone"` build before shipping this to production.

FROM node:20-alpine

# Needed by some native deps (e.g. sharp/msgpackr-extract) on alpine.
RUN apk add --no-cache libc6-compat

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
