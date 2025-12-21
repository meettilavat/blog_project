# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ARG APP=admin
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ "$APP" = "public" ]; then npm run build:public; else npm run build; fi
RUN mkdir -p /app/apps/${APP}/public

FROM node:20-alpine AS runner
WORKDIR /app
ARG APP=admin
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV APP=$APP

COPY --from=builder /app/apps/${APP}/.next/standalone ./
COPY --from=builder /app/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=builder /app/apps/${APP}/public ./apps/${APP}/public

EXPOSE 3000
CMD ["sh", "-c", "node apps/$APP/server.js"]
