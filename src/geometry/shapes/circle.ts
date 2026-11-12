import { Dims } from "../dims";
import { Path } from "../path";
import { Vector2 } from "../vector2";

export interface CircleParams
{
    center?:Vector2
    radius?:number
}

export class Circle extends Path
{
    center:Vector2
    radius:number

    constructor(c:CircleParams = {})
    {
        super();
        this.center = c.center ?? new Vector2();
        this.radius = c.radius ?? 0.5;
    }

    clone(deep = false)
    {
        const c = deep ? this.center.clone() : this.center;
        return new Circle({ center: c, radius: this.radius });
    }

    getDimensions()
    {
        return new Dims(
            this.center.clone().sub(new Vector2(this.radius)),
            new Vector2(this.radius*2)
        );
    }

    createPixiObject(graphicsConstructor)
    {
        return new graphicsConstructor({}).circle(this.center.x, this.center.y, this.radius);
    }

    toPath2D() 
    {
        const p = new Path2D();
        p.arc(this.center.x, this.center.y, this.radius, 0, 2*Math.PI);
        return p;
    }

    toPath(resolution = 32)
    {
        const path : Vector2[] = [];
        for(let i = 0; i < resolution; i++)
        {
            const angle = i * (2*Math.PI) / resolution;
            const pos = new Vector2(
                this.center.x + Math.cos(angle)*this.radius,
                this.center.y + Math.sin(angle)*this.radius
            )
            path.push(pos);
        }
        return path;
    }
}