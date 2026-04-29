FROM docker.m.daocloud.io/library/node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        ca-certificates \
        git \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare yarn@1.22.22 --activate
RUN npx -y playwright@1.59.1 install --with-deps chromium

WORKDIR /workspace/react_laiwan_com

COPY docker/visual/entrypoint.sh /usr/local/bin/visual-entrypoint
RUN chmod +x /usr/local/bin/visual-entrypoint

ENTRYPOINT ["visual-entrypoint"]
CMD ["yarn", "test:visual"]
