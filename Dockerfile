FROM node:11.1.0-alpine

RUN mkdir -p /opt/app
RUN apk add --no-cache libc6-compat tzdata

ENV TZ Asia/Bangkok
ENV NODE_ENV production
ENV PORT 3000

RUN date

EXPOSE 3000

WORKDIR /opt/app
COPY . /opt/app
RUN npm i react react-dom ajv
RUN npm i
RUN npm run build
RUN npm update caniuse-lite browserslist

CMD ["npm", "run", "start"]