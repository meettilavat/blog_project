# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ARG APP=admin
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ "$APP" = "public" ]; then npm run build:public; else npm run build; fi

FROM node:20-alpine AS runner
WORKDIR /app
ARG APP=admin
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV APP=$APP

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/styles ./styles

RUN npm prune --omit=dev

EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/next start apps/$APP -p 3000"]

