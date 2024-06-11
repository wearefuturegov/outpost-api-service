ARG NODE_ENV=development

# ----------------------------------------------------------------
FROM node:iron-alpine as build_frontend
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

RUN apk update
RUN apk add curl

COPY ./package.json ./tmp/package.json
COPY ./package-lock.json ./tmp/package-lock.json

WORKDIR /tmp

RUN if [ "${NODE_ENV}" = "development" ] || [ -z "${NODE_ENV}" ]; then \
  npm install; fi
RUN if [ "${NODE_ENV}" = "production" ]; then \
  npm ci && npm cache clean --force; fi

WORKDIR /app

# ----------------------------------------------------------------
FROM build_frontend
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY --from=build_frontend /tmp/package.json ./package.json
COPY --from=build_frontend /tmp/package-lock.json ./package-lock.json
COPY --from=build_frontend /tmp/node_modules ./node_modules


EXPOSE 3000
ENTRYPOINT ["npm", "run"]
CMD ["dev"]
