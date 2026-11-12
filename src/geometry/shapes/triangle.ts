import { isApprox } from "../../tools/numbers/checks";
import { Path } from "../path";
import { Vector2 } from "../vector2";

export interface TriangleParams
{
    points?:Vector2[],
    pointyDir?:number,
    center?:Vector2,
    radius?:number,
    angles?:number[],
    base?:number,

}

export class Triangle extends Path
{
    points: Vector2[]
    pointyDir: number
    center: Vector2
    radius: number
    angles: number[]

    constructor(t:TriangleParams = {}) 
    {
        super()
        
        this.points = t.points ?? [];

        this.pointyDir = t.pointyDir ?? 0;
        this.center = t.center ?? new Vector2();
        this.radius = t.radius ?? 0.5;
        this.angles = t.angles ?? new Array(3).fill((2/3)*Math.PI);

        if(t.center && t.radius) { this.fromCenterAndRadius(this.center, this.radius); }
        if(t.angles && t.radius) { this.fromAnglesAndRadius(this.angles, this.radius); }
    }

    fromPoints(points:Vector2[])
    {
        this.points = points;
        this.refreshProperties();
    }

    refreshProperties()
    {
        const numPoints = this.points.length;
        const angles = [];
        const center = new Vector2();
        for(let i = 0; i < numPoints; i++)
        {
            const p1 = this.points[i];
            const p2 = this.points[(i+1) % numPoints];
            angles.push(p1.angleTo(p2));
            center.add(p1);
        }
        this.angles = angles;
        this.center = center.div(numPoints);
        this.radius = this.points[0].distTo(this.center);
    }

    fromCenterAndRadius(c:Vector2, r:number)
    {
        const arr = [];
        let angle = this.pointyDir;
        const angleOffset = (2 * Math.PI) / 3;
        for(let i = 0; i < 3; i++)
        {
            const ang = angle + i*angleOffset;
            const point = new Vector2().fromAngle(ang).scale(r).add(c);
            arr.push(point);
        }

        this.fromPoints(arr);
    }

    fromAnglesAndRadius(a:number[], r:number)
    {
        let sum = 0;
        for(const angle of a)
        {
            sum += angle;
        }
        const aTriangle = isApprox(sum, Math.PI);
        if(!aTriangle) { return; }

        const p1 = new Vector2();
        const p2 = new Vector2().fromAngle(a[0]).scale(r);
        const p3 = p2.clone().add(new Vector2().fromAngle(a[1])).scale(r);

        this.fromPoints([p1, p2, p3]);
    }

    clone(deep = false)
    {
        const p = deep ? this.points.map((x) => x.clone()) : this.points;
        return new Triangle({ points: p });
    }

    createPixiObject(graphicsConstructor)
    {
        return new graphicsConstructor({}).poly(this.points, false);
    }

    toPathArray()
    {
        return this.points.slice();
    }

    toPath2D() 
    {
        const p = new Path2D();
        p.moveTo(this.points[0].x, this.points[0].y);
        p.lineTo(this.points[1].x, this.points[1].y);
        p.lineTo(this.points[2].x, this.points[2].y);
        return p;
    }
}