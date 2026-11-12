import { fromArray } from "../../tools/random/pickers";
import { Dims } from "../dims";
import { Vector2 } from "../vector2";
import { ArcData } from "./arcs";
import { PathCommand, PointPath } from "./pointPath";
import { pointListToPathPoints } from "./tools";

export class PathAdvanced
{
    points: PointPath[]
    close: boolean = false

    constructor(p:PointPath[]|Vector2[] = null, close = false)
    {
        this.points = pointListToPathPoints(p);
        this.close = close ?? false;
    }

    clone(deep = false)
    {
        const points = deep ? this.points.map((x) => x.clone(deep)) : this.points.slice();
        return new PathAdvanced(points);
    }

    getDimensions() : Dims { return new Dims().fromPoints(this.toPathArray()); }

    startAt(p:Vector2)
    {
        this.points.push(new PointPath({ point: p, command: PathCommand.START }));
    }

    lineTo(p:Vector2)
    {
        this.points.push(new PointPath({ point: p, command: PathCommand.LINE }));
    }

    curveTo(p:Vector2, c1:Vector2, c2:Vector2)
    {
        let cmd = c2 ? PathCommand.CUBIC : PathCommand.QUAD;
        this.points.push(new PointPath({ point: p, command: cmd, controlPoint1: c1, controlPoint2: c2 }));
    }

    arcTo(p:Vector2, d:ArcData)
    {
        this.points.push(new PointPath({ point: p, command: PathCommand.ARC, arcData: d }));
    }

    toPathArray() : Vector2[]
    {
        const points = [];
        let prevPoint = null;
        for(const pointPath of this.points)
        {
            points.push(pointPath.toPath(prevPoint));
            prevPoint = pointPath.getPointAbsolute(prevPoint);
        }
        if(this.close && this.points.length > 0) { points.push(this.points[0].point); }
        return points.flat();
    }

    createPixiObject(graphicsConstructor)
    {
        return new graphicsConstructor({}).poly(this.toPathArray(), this.close ?? false);
    }

    getFirst() { return this.points[0].point; }
    getLast() { return this.points[this.points.length-1].point; }
    hasPoint(p) 
    { 
        for(const point of this.points)
        {
            if(point.point == p || point.point.matches(p)) { return true; }
        }
        return false;
    }

    getRandomPoint()
    {
        return fromArray(this.points).point;
    }

    endPointsMatch(p1:Vector2, p2:Vector2)
    {
        const first = this.getFirst();
        const last = this.getLast();
        if(first.matches(p1) && last.matches(p2)) { return true; }
        if(first.matches(p2) && last.matches(p1)) { return true; }
        return false;
    }
}