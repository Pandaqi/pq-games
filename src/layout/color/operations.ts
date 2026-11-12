import { Bounds, BoundsLike } from "../../tools/numbers/bounds";
import { Color } from "./color";

export const colorLighten = (c:Color, dl = 0) : Color =>
{
    const newLightness = Math.max(Math.min(c.l + dl, 100), 0);
    return new Color(c.h, c.s, newLightness);
}

export const colorDarken = (c:Color, dl = 0) : Color =>
{
    return colorLighten(c, -dl);
}

export const colorSaturate = (c:Color, ds = 0) : Color =>
{
    const newSaturation = Math.max(Math.min(c.s + ds, 100), 0);
    return new Color(c.h, newSaturation, c.l);
}

export const colorRotate = (c:Color, dh = 0) : Color =>
{
    const newHue = (c.h + dh + 360) % 360;
    return new Color(newHue, c.s, c.l);
}

export const colorInvert = (c:Color) : Color =>
{
    return new Color((c.h + 180) % 360, 100 - c.s, 100 - c.l);
}

export const colorRandomize = (c:Color, b:BoundsLike = { min: -10, max: 10 }) : Color =>
{
    const bounds = new Bounds(b);
    return colorRotate(colorSaturate(colorLighten(c, bounds.random()), bounds.random()), bounds.random());
}