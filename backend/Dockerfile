FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=topwalker-backend-npm,target=/root/.npm npm ci --fetch-timeout=60000 --fetch-retries=2
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
