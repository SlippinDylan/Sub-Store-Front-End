FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@11.0.9
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run test:ui
RUN pnpm run check:locales
RUN pnpm build

FROM nginx:stable-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
