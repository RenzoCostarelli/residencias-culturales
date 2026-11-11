FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Dummy, solo para que prisma.config.ts valide env("DATABASE_URL") durante el build;
# no se usa ninguna conexión real en este paso.
ARG DATABASE_URL=postgresql://user:pass@localhost:5432/db
ENV DATABASE_URL=$DATABASE_URL
RUN pnpm exec prisma generate

RUN pnpm run build
RUN pnpm prune --prod

FROM node:22-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY package.json ./
COPY scripts ./scripts
RUN chmod +x ./scripts/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
