FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

# Install with devDependencies available so the Vite/Remix build can run.
# --legacy-peer-deps matches the local .npmrc (the prisma-storage v6 peer wants @prisma/client v6).
RUN npm install --include=dev --legacy-peer-deps && npm cache clean --force

COPY . .

RUN npm run build

# Remove the Shopify CLI packages — not needed at runtime.
RUN npm remove @shopify/cli @shopify/app || true

# docker-start runs: prisma generate && prisma migrate deploy && remix-serve
CMD ["npm", "run", "docker-start"]
