import { lerp, slerp } from "../../tools/numbers/lerp";
import { isZero } from "../../tools/numbers/checks";
import { Color } from "./color";

export const colorGetBestContrast = (c:Color) =>
{
    if(colorGetLuminosity(c) >= 165) { return Color.BLACK; }
    return Color.WHITE;
}

// @SOURCE: https://stackoverflow.com/questions/9733288/how-to-programmatically-calculate-the-contrast-ratio-between-two-colors
export const colorGetLuminosity = (c:Color) =>
{
    const rgba = c.toRGBARaw();
    const gamma = 2.4; // linearize it for sRGB
    var a = rgba.map((v) => {
        v /= 255;
        return v <= 0.04045
          ? v / 12.92
          : Math.pow((v + 0.055) / 1.055, gamma);
    });
    // mix in correct proportions
    return (0.2126 * a[0]) + (0.7152 * a[1]) + (0.0722 * a[2]); // SMPTE C, Rec. 709 weightings
}

export const getColorContrastWith = (c1:Color, c2:Color) =>
{
    const lum1 = colorGetLuminosity(c1);
    const lum2 = colorGetLuminosity(c2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

export const getColorContrastHighest = (c:Color, colors:Color[]) =>
{
    let bestRatio = 0;
    let bestColor = null;
    for(const color of colors)
    {
        const ratio = getColorContrastWith(c, color);
        if(ratio <= bestRatio) { continue; }
        bestRatio = ratio;
        bestColor = color;
    }
    return bestColor;
}

export const isColorTransparent = (c:Color) =>
{
    return isZero(c.a);
}

export const colorMix = (c1:Color, c2:Color, factor = 0.5) =>
{
    const hue = slerp(c1.h, c2.h, factor, 360);
    const l = lerp(c1.l, c2.l, factor);
    const s = lerp(c1.s, c2.s, factor);
    return new Color(hue, s, l);
}
