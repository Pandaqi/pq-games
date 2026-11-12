import { Path } from "../path";
import { Vector2 } from "../vector2";

export interface PolygonParams
{
    center?:Vector2
    radius?:number
    corners?:number
    rotation?:number
}

export class Polygon extends Path
{
    center:Vector2
    radius:number
    corners:number
    rotation: number

    constructor(h:PolygonParams = {})
    {
        super()
        this.center = h.center ?? new Vector2();
        this.radius = h.radius ?? 0.5;
        this.corners = h.corners ?? 6;
        this.rotation = h.rotation ?? 0;
    }

    createPixiObject(graphicsConstructor)
    {
        return new graphicsConstructor({}).regularPoly(this.center.x, this.center.y, this.radius, this.corners, this.rotation);
    }

    toPathArray()
    {
        const path = [];
        const num = this.corners;
        for(let i = 0; i < num; i++)
        {
            const ang = i * (2*Math.PI) / num + this.rotation;
            const point = new Vector2(
                this.center.x + Math.cos(ang) * this.radius,
                this.center.y + Math.sin(ang) * this.radius
            )
            path.push(point);
        }
        return path;
    }
}