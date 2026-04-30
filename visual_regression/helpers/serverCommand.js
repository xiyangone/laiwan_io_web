const DEFAULT_WINDOWS_VISUAL_SERVER_COMMAND = 'set NODE_OPTIONS=--openssl-legacy-provider&& npx webpack-dev-server --mode development --host 127.0.0.1 --disable-host-check --port 8080';
const DEFAULT_UNIX_VISUAL_SERVER_COMMAND = 'NODE_OPTIONS=--openssl-legacy-provider npx webpack-dev-server --mode development --host 127.0.0.1 --disable-host-check --port 8080';
const DEFAULT_DOCKER_VISUAL_SERVER_COMMAND = 'NODE_OPTIONS=--openssl-legacy-provider bun run webpack-dev-server --mode development --host 0.0.0.0 --disable-host-check --port 8080';

function resolveVisualServerCommand(env = process.env, platform = process.platform) {
    if (env.VISUAL_SERVER_COMMAND) {
        return env.VISUAL_SERVER_COMMAND;
    }

    if (env.VISUAL_DOCKER === '1') {
        return DEFAULT_DOCKER_VISUAL_SERVER_COMMAND;
    }

    return platform === 'win32'
        ? DEFAULT_WINDOWS_VISUAL_SERVER_COMMAND
        : DEFAULT_UNIX_VISUAL_SERVER_COMMAND;
}

module.exports = {
    DEFAULT_DOCKER_VISUAL_SERVER_COMMAND,
    resolveVisualServerCommand,
};
