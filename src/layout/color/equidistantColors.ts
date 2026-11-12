import { Color } from "./color";

export const equidistantColors = (num:number = 1, s:number = 100, l:number = 100, a:number = 1) : Color[] =>
{
    const start = Math.random()*360;
    const offset = 360 / num;
    const arr = [];
    for(let i = 0; i < num; i++)
    {
        const hue = (start + i*offset);
        const hueClamped = (hue/360.0 - Math.floor(hue / 360.0)) * 360.0;
        arr.push(new Color(hueClamped, s, l, a));
    }
    return arr;
}