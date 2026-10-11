FROM node:22-bookworm-slim
# Prisma needs openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 4000
# Apply migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
