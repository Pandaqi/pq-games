import { roundPath } from "../paths/corners"
import { Vector2 } from "../vector2"
import { Rectangle } from "./rectangle"

export interface RectangleRoundedParams
{
    center?:Vector2
    extents?:Vector2
    radius?:number,
}

export class RectangleRounded extends Rectangle
{
    radius:number

    constructor(r:RectangleRoundedParams = {})
    {
        super(r);
        this.radius = r.radius ?? 1.0;
    }

    clone(deep = false)
    {
        const c = deep ? this.center.clone() : this.center;
        const e = deep ? this.extents.clone() : this.extents;
        return new RectangleRounded({ center: c, extents: e, radius: this.radius });
    }

    createPixiObject(graphicsConstructor)
    {
        const tl = this.getTopLeft();
        const size = this.getSize();
        return new graphicsConstructor({}).roundRect(tl.x, tl.y, size.x, size.y, this.radius);
    }

    toPathArray()
    {
        return roundPath(super.toPathArray(), this.radius, true);
    }

    toPath2D() 
    {
        const p = new Path2D();
        const dims = this.getDimensions();
        p.roundRect(dims.position.x, dims.position.y, dims.size.x, dims.size.y, this.radius);
        return p;
    }
}