FROM node:18

WORKDIR /app

# copy only manifests first for better caching
COPY package*.json ./

# keep express@5 and bypass legacy peer-deps conflicts (zod-express-middleware wants express@4)
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

# use lockfile if present; fall back to install if not
# (ci will honor the env above as well)
RUN npm ci || npm install --legacy-peer-deps

# now bring in the source
COPY . .

# dev command (change if you have a different script)
CMD ["npm", "run", "dev"]
