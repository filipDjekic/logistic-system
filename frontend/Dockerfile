FROM node:22.13-bookworm-slim

WORKDIR /app

RUN npm install -g npm@11.19.0

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]