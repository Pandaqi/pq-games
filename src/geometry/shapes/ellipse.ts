import { Dims } from "../dims";
import { Path } from "../path";
import { Vector2 } from "../vector2";

export interface EllipseParams
{
    center?:Vector2
    radius?:Vector2
}

export class Ellipse extends Path
{
    center:Vector2
    radius:Vector2

    constructor(c:EllipseParams = {})
    {
        super();
        this.center = c.center ?? new Vector2();
        this.radius = c.radius ?? new Vector2(10);
    }

    clone(deep = false)
    {
        const c = deep ? this.center.clone() : this.center;
        const r = deep ? this.radius.clone() : this.radius;
        return new Ellipse({ center: c, radius: r });
    }

    getDimensions()
    {
        return new Dims(
            this.center.clone().sub(this.radius),
            this.radius.clone().scaleFactor(2.0)
        );
    }

    createPixiObject(graphicsConstructor)
    {
        return new graphicsConstructor({}).ellipse(this.center.x, this.center.y, this.radius.x, this.radius.y);
    }

    toPath(resolution = 32)
    {
        const path : Vector2[] = [];
        for(let i = 0; i < resolution; i++)
        {
            const angle = i * (2*Math.PI) / resolution;
            const pos = new Vector2(
                this.center.x + Math.cos(angle)*this.radius.x,
                this.center.y + Math.sin(angle)*this.radius.y
            )
        }
        return path;
    }
}