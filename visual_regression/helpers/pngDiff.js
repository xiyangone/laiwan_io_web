const pixelmatchModule = require('pixelmatch');
const { PNG } = require('pngjs');

const pixelmatch = pixelmatchModule.default || pixelmatchModule;

function padPngToSize(source, width, height) {
    const output = new PNG({ width, height });

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const index = (width * y + x) << 2;

            output.data[index] = 255;
            output.data[index + 1] = 255;
            output.data[index + 2] = 255;
            output.data[index + 3] = 255;
        }
    }

    for (let y = 0; y < source.height; y += 1) {
        for (let x = 0; x < source.width; x += 1) {
            const sourceIndex = (source.width * y + x) << 2;
            const targetIndex = (width * y + x) << 2;

            output.data[targetIndex] = source.data[sourceIndex];
            output.data[targetIndex + 1] = source.data[sourceIndex + 1];
            output.data[targetIndex + 2] = source.data[sourceIndex + 2];
            output.data[targetIndex + 3] = source.data[sourceIndex + 3];
        }
    }

    return output;
}

function getPngDiffBounds(png) {
    let left = png.width;
    let top = png.height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < png.height; y += 1) {
        for (let x = 0; x < png.width; x += 1) {
            const index = (png.width * y + x) << 2;
            const hasDiff = png.data[index] !== 0
                || png.data[index + 1] !== 0
                || png.data[index + 2] !== 0
                || png.data[index + 3] !== 0;

            if (!hasDiff) {
                continue;
            }

            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
        }
    }

    if (right < 0 || bottom < 0) {
        return null;
    }

    return {
        left,
        top,
        right,
        bottom,
        width: right - left + 1,
        height: bottom - top + 1,
    };
}

function expandBounds(bounds, maxWidth, maxHeight, padding = 0) {
    if (!bounds) {
        return null;
    }

    const nextLeft = Math.max(0, bounds.left - padding);
    const nextTop = Math.max(0, bounds.top - padding);
    const nextRight = Math.min(maxWidth - 1, bounds.right + padding);
    const nextBottom = Math.min(maxHeight - 1, bounds.bottom + padding);

    return {
        left: nextLeft,
        top: nextTop,
        right: nextRight,
        bottom: nextBottom,
        width: nextRight - nextLeft + 1,
        height: nextBottom - nextTop + 1,
    };
}

function cropPngToBounds(source, bounds) {
    const output = new PNG({ width: bounds.width, height: bounds.height });

    for (let y = 0; y < bounds.height; y += 1) {
        for (let x = 0; x < bounds.width; x += 1) {
            const sourceIndex = (source.width * (bounds.top + y) + (bounds.left + x)) << 2;
            const targetIndex = (bounds.width * y + x) << 2;

            output.data[targetIndex] = source.data[sourceIndex];
            output.data[targetIndex + 1] = source.data[sourceIndex + 1];
            output.data[targetIndex + 2] = source.data[sourceIndex + 2];
            output.data[targetIndex + 3] = source.data[sourceIndex + 3];
        }
    }

    return output;
}

function clampColor(value) {
    return Math.max(0, Math.min(255, value));
}

function createContextDiffPng(after, diffMask) {
    const output = new PNG({ width: after.width, height: after.height });
    const highlight = {
        red: 255,
        green: 92,
        blue: 138,
    };

    for (let y = 0; y < after.height; y += 1) {
        for (let x = 0; x < after.width; x += 1) {
            const index = (after.width * y + x) << 2;
            const red = after.data[index];
            const green = after.data[index + 1];
            const blue = after.data[index + 2];
            const alpha = after.data[index + 3];
            const luminance = Math.round((red * 0.299) + (green * 0.587) + (blue * 0.114));
            const backgroundTone = clampColor(Math.round((luminance * 0.48) + 18));
            const hasDiff = diffMask.data[index] !== 0
                || diffMask.data[index + 1] !== 0
                || diffMask.data[index + 2] !== 0
                || diffMask.data[index + 3] !== 0;

            if (hasDiff) {
                output.data[index] = clampColor(Math.round((red * 0.25) + (highlight.red * 0.75)));
                output.data[index + 1] = clampColor(Math.round((green * 0.25) + (highlight.green * 0.75)));
                output.data[index + 2] = clampColor(Math.round((blue * 0.25) + (highlight.blue * 0.75)));
            } else {
                output.data[index] = backgroundTone;
                output.data[index + 1] = backgroundTone;
                output.data[index + 2] = backgroundTone;
            }

            output.data[index + 3] = alpha === 0 ? 255 : alpha;
        }
    }

    return output;
}

function createDiffImageBuffer(beforeBuffer, afterBuffer, options = {}) {
    const {
        cropToDiff = false,
        diffPadding = 24,
    } = options;
    const beforeRaw = PNG.sync.read(beforeBuffer);
    const afterRaw = PNG.sync.read(afterBuffer);

    const width = Math.max(beforeRaw.width, afterRaw.width);
    const height = Math.max(beforeRaw.height, afterRaw.height);

    const before = padPngToSize(beforeRaw, width, height);
    const after = padPngToSize(afterRaw, width, height);
    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch(before.data, after.data, diff.data, width, height, {
        threshold: 0.1,
        includeAA: false,
        diffMask: true,
    });

    const bounds = cropToDiff && diffPixels > 0
        ? expandBounds(getPngDiffBounds(diff), width, height, diffPadding)
        : null;

    const contextDiff = createContextDiffPng(after, diff);

    return {
        diffPixels,
        diffBuffer: PNG.sync.write(
            bounds
                ? cropPngToBounds(contextDiff, bounds)
                : contextDiff
        ),
        bounds,
    };
}

module.exports = {
    createDiffImageBuffer,
};
