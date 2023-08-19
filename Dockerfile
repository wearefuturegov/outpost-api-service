# using docker image layers to save waiting for things to rebuild all the time

# base_image > build_frontend > (development | production)

FROM node:16-alpine3.17 as base_image
WORKDIR /usr/build/app
COPY ./package.json /usr/build/app/package.json
COPY ./package-lock.json /usr/build/app/package-lock.json
EXPOSE 3001

FROM base_image as development_base
RUN npm ci

FROM base_image as production_base
RUN npm ci --omit=dev


#  build and install all  the things for the development env
FROM development_base as development
ENV NODE_ENV development
WORKDIR /usr/src/app
COPY --chown=node:node --from=development_base /usr/build/app/node_modules ./node_modules
USER node
CMD ["npm", "run", "dev" ]



FROM production_base as production
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --chown=node:node --from=production_base /usr/build/app/node_modules ./node_modules
COPY --chown=node:node . /usr/src/app
USER node
CMD ["npm", "run", "start" ]
