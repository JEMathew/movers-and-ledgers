FROM node:22-alpine AS build
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

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
# The standalone server invokes Node directly; package installation stays in build.
# Remove npm's unused dependency tree rather than waive its image findings.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 8080
CMD ["node", "server.js"]
