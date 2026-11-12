import { Vector2 } from "../../geometry/vector2";
import { range, rangeInteger } from "../random/ranges";
import { lerp } from "./lerp";

export type BoundsObject = { min: number, max: number };
export type BoundsLike = Bounds|BoundsObject|Vector2

export const fitSizeAndKeepRatio = (originalSize:Vector2, maxSize:Vector2) =>
{
    const ratio = originalSize.x / originalSize.y;
    const sizeYIfMaxX = maxSize.x / ratio;
    const sizeXIfMaxY = maxSize.y * ratio;
    if(sizeYIfMaxX > maxSize.y) { return new Vector2(sizeXIfMaxY, maxSize.y) }
    return new Vector2(maxSize.x, sizeYIfMaxX);
}

export const clamp = (val:number, min:number|BoundsObject|Vector2 = -Infinity, max:number = Infinity) =>
{
    return new Bounds(min, max).clamp(val);
}

export class Bounds
{
    min: number;
    max: number;
    
    constructor(min:number|BoundsLike, max:number = 0)
    {
        if(min instanceof Vector2) { max = min.y; min = min.x; }
        else if(typeof min == "object") { max = min.max; min = min.min; }

        this.min = min ?? 0;
        this.max = max ?? 0;
    }

    clone()
    {
        return new Bounds(this.min, this.max);
    }

    average() { return 0.5 * (this.min + this.max); }
    interval() { return this.max - this.min; }
    scale(f:number)
    {
        this.scaleMin(f);
        this.scaleMax(f);
        return this;
    }

    scaleMin(f:number) { this.min *= f; return this; }
    scaleMax(f:number) { this.max *= f; return this; }

    lerp(f:number)
    {
        return lerp(this.min, this.max, f);
    }

    contains(val:number)
    {
        return this.min <= val && this.max >= val;
    }

    clamp(val:number)
    {
        return Math.min(this.max, Math.max(val, this.min));
    }

    random() { return range(this); }
    randomInteger() {  return rangeInteger(this); }

    swap()
    {
        const temp = this.min;
        this.min = this.max;
        this.max = temp;
        return this;
    }

    sortAsc()
    {
        if(this.min <= this.max) { return; }
        return this.swap();
    }

    sortDesc()
    {
        if(this.min >= this.max) { return; }
        return this.swap();
    }

    asList()
    {
        const arr = [];
        for(let i = this.min; i <= this.max; i++)
        {
            arr.push(i);
        }
        return arr;
    }
}