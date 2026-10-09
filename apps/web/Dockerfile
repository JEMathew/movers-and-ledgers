FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web .
ARG NEXT_PUBLIC_IDENTITY_MODE=firebase
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
RUN npm run build

FROM build AS development
ENV NODE_ENV=development NEXT_PUBLIC_IDENTITY_MODE=demo NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "8080"]

FROM cgr.dev/chainguard/wolfi-base:latest@sha256:05d24163df148be377275af8374c16523a1dc7e19bf4f1c689784791553c5e45 AS runtime
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
# Keep Node 22, use the vendor-patched shared zlib, and never install runtime npm.
# Both stages are glibc-based so standalone native dependencies use the same ABI family.
RUN apk add --no-cache nodejs-22-minimal=22.23.2-r1
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER 65532:65532
EXPOSE 8080
CMD ["node", "server.js"]
