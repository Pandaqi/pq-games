import { Dims } from "./dims";
import { pointListToPath2D, pointListToPathString } from "./paths/tools";
import type { Vector2 } from "./vector2";

export type PathLike = Vector2[]|Path;

export interface PathParams
{
    points?: Vector2[]
    close?: boolean
}

export class Path
{
    points: Vector2[]

    constructor(p:PathLike = null, close = false)
    {
        if(!p) { return; }
        this.points = (p instanceof Path) ? p.toPathArray() : p.slice();
        if(close) { this.points.push(this.points[0]); }
    }

    clone(deep = false) : Path
    {
        const points = deep ? this.points.map((x) => x.clone()) : this.points.slice();
        return new Path(points);
    }

    toPathArray() : Vector2[] { return this.points.slice(); } // this copies for safety and ease of use; if you want no copy for efficiency, just grab `.points` directly
    toPath2D() : Path2D { return pointListToPath2D(this.toPathArray()); }
    toPathString() : string { return pointListToPathString(this.toPathArray()); }
    toCSSPath() : string { return 'path("' + this.toPathString() + '")'; }
    getDimensions() : Dims { return new Dims().fromPoints(this.toPathArray()); }
    createPixiObject(graphicsConstructor)
    {
        return new graphicsConstructor({}).poly(this.points); // second argument = "close", which I removed from this class later
    }
}