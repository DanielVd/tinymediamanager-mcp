FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts --omit=dev

COPY dist/ ./dist/

EXPOSE 8000

ENV TMM_TRANSPORT=http
ENV TMM_HTTP_PORT=8000

CMD ["node", "dist/index.js"]
