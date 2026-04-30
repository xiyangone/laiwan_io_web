FROM docker.m.daocloud.io/library/node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    BUN_INSTALL=/root/.bun \
    PATH=/root/.bun/bin:$PATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        ca-certificates \
        curl \
        git \
        unzip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
RUN bunx playwright@1.59.1 install --with-deps chromium

WORKDIR /workspace/react_laiwan_com

COPY docker/visual/entrypoint.sh /usr/local/bin/visual-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/visual-entrypoint \
    && chmod +x /usr/local/bin/visual-entrypoint

ENTRYPOINT ["visual-entrypoint"]
CMD ["bun", "run", "test:visual"]
