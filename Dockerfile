FROM node:18-alpine as deps

WORKDIR /app

# Copy dependency-defining files
COPY package.json yarn.lock .yarnrc.yml /app/
COPY .yarn /app/.yarn
COPY packages/opendesign-env/package.json packages/opendesign-env/
COPY packages/opendesign-universal/package.json packages/opendesign-universal/
COPY packages/opendesign-react/package.json packages/opendesign-react/
COPY packages/docs/package.json packages/docs/
COPY packages/opendesign/package.json packages/opendesign/

# Install NPM packages
RUN corepack enable yarn \
    && yarn config set enableGlobalCache false \
    && yarn

RUN apk add --no-cache git

# Build the app
COPY . /app
RUN node build.js

FROM nginx
COPY --from=deps /app/dist /usr/share/nginx/html

# dokku apps:create odf
# dokku letsencrypt:enable odf
# dokku proxy:ports-add odf https:443:80
# dokku proxy:ports-remove odf https:443:5000
