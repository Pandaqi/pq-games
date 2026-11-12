import { Path } from "../path";
import { Vector2 } from "../vector2";

export interface StarParams
{
    center?:Vector2
    radiusOutside?:number
    radiusInside?:number
    corners?:number
    rotation?:number
}

export class Star extends Path
{
    center:Vector2
    radiusInside:number
    radiusOutside:number
    corners:number
    rotation:number

    constructor(h:StarParams = {})
    {
        super()
        this.center = h.center ?? new Vector2();
        this.radiusInside = h.radiusInside ?? 0.25;
        this.radiusOutside = h.radiusOutside ?? 0.5;
        this.corners = h.corners ?? 5;
        this.rotation = h.rotation ?? 0;
    }

    toPathArray()
    {
        const path = [];
        const num = this.corners*2;
        for(let i = 0; i < num; i++)
        {
            const outerCorner = (i % 2 == 0);
            const radius = outerCorner ? this.radiusOutside : this.radiusInside;

            const ang = this.rotation + i * (2*Math.PI) / num;
            const point = new Vector2(
                this.center.x + Math.cos(ang) * radius,
                this.center.y + Math.sin(ang) * radius
            )
            path.push(point);
        }
        return path;
    }
}