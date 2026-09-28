/** Reference viewport in logical pixels, with bounds for readable touch controls. */
export function getControlScale(width, height) {
    if (!(width > 0 && height > 0)) return 1;
    return Math.max(1, Math.min(2.5, width / 1280, height / 720));
}

export function scaleStyles(styles, scale) {
    const dimensions = /^(fontSize|lineHeight|letterSpacing|gap|rowGap|columnGap|padding.*|margin.*|border.*Radius|height|minHeight|maxHeight|width|minWidth|maxWidth)$/;
    return Object.fromEntries(Object.entries(styles).map(([name, style]) => [name,
        Object.fromEntries(Object.entries(style).map(([key, value]) => [key,
            dimensions.test(key) && typeof value === 'number' ? value * scale : value])),
    ]));
}
