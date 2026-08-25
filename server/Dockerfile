FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# We use ts-node for dev, but for simplicity in this microservice:
EXPOSE 4002

CMD ["npx", "ts-node", "src/index.ts"]
