# AI Pathshala — production container
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
# Persist the JSON database to a mounted volume in production
ENV DATA_DIR=/app/data
EXPOSE 3000
CMD ["node", "server.js"]
