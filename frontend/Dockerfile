FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install --legacy-peer-deps
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]




















# # ---------- Dev (hot reload) ----------
# FROM node:18 AS dev
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci || npm install
# COPY . .
# EXPOSE 5173
# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# # ---------- Build (server/client to ./build) ----------
# FROM node:18 AS build
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci || npm install
# COPY . .
# # This runs: "react-router build" -> outputs to ./build
# RUN npm run build

# # ---------- Production (Node server via react-router-serve) ----------
# FROM node:18 AS prod
# WORKDIR /app
# ENV NODE_ENV=production
# COPY package*.json ./
# RUN npm ci --omit=dev || npm install --omit=dev
# # bring the compiled build
# COPY --from=build /app/build /app/build
# # bring anything else your server-side code may import at runtime
# COPY . .
# EXPOSE 3000
# # This matches your "start" script:
# # "start": "react-router-serve ./build/server/index.js"
# CMD ["npm", "run", "start"]






























# FROM node:20-alpine AS development-dependencies-env
# COPY . /app
# WORKDIR /app
# RUN npm ci

# FROM node:20-alpine AS production-dependencies-env
# COPY ./package.json package-lock.json /app/
# WORKDIR /app
# RUN npm ci --omit=dev

# FROM node:20-alpine AS build-env
# COPY . /app/
# COPY --from=development-dependencies-env /app/node_modules /app/node_modules
# WORKDIR /app
# RUN npm run build

# FROM node:20-alpine
# COPY ./package.json package-lock.json /app/
# COPY --from=production-dependencies-env /app/node_modules /app/node_modules
# COPY --from=build-env /app/build /app/build
# WORKDIR /app
# CMD ["npm", "run", "start"]