const DEFAULT_WINDOWS_VISUAL_SERVER_COMMAND = 'set NODE_OPTIONS=--openssl-legacy-provider&& npx webpack-dev-server --mode development --host 127.0.0.1 --disable-host-check --port 8080';
const DEFAULT_UNIX_VISUAL_SERVER_COMMAND = 'NODE_OPTIONS=--openssl-legacy-provider npx webpack-dev-server --mode development --host 127.0.0.1 --disable-host-check --port 8080';

function resolveVisualServerCommand(env = process.env, platform = process.platform) {
    // 自定义 dev server 只保留这一处入口，避免本地/CI/Docker 分叉维护。
    if (env.VISUAL_SERVER_COMMAND) {
        return env.VISUAL_SERVER_COMMAND;
    }

    return platform === 'win32'
        ? DEFAULT_WINDOWS_VISUAL_SERVER_COMMAND
        : DEFAULT_UNIX_VISUAL_SERVER_COMMAND;
}

module.exports = {
    resolveVisualServerCommand,
};
