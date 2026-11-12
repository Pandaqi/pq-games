import { Vector2 } from "../vector2";
import { Line } from "../shapes/line";
import { isZero, isBetween } from "../../tools/numbers/checks";
import { pathToLineSegments } from "../paths/tesselation";
import type { Path, PathLike } from "../path";

// @SOURCE: https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
export const lineIntersectsLineRaw = (a:number, b:number, c:number, d:number, p:number, q:number, r:number, s:number) => 
{
    const eps = 0.00001; // epsilon always needed with these kinds of operations
    var det:number, gamma:number, lambda:number;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) { return false; } // parallel or anti-parallel
    
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return ((0-eps) < lambda && lambda < (1+eps)) && ((0-eps) < gamma && gamma < (1+eps));
}

export const lineIntersectsLineFromPoints = (a:Vector2, b:Vector2, p:Vector2, q:Vector2) =>
{
    return lineIntersectsLineRaw(a.x, a.y, b.x, b.y, p.x, p.y, q.x, q.y);
}

export const lineIntersectsLine = (a:Line, b:Line) =>
{
    return lineIntersectsLineFromPoints(a.start, a.end, b.start, b.end);
}

export const lineIntersectsShape = (line:Line, shape:Path) =>
{
    const segments = pathToLineSegments(shape.toPathArray());
    for(const segment of segments)
    {
        if(lineIntersectsLine(line, segment)) { return true; }
    }
    return false;
}

export const pathIntersectsPath = (path1:PathLike, path2:PathLike) =>
{
    const lines1 = pathToLineSegments(path1);
    const lines2 = pathToLineSegments(path2);
    for(const line1 of lines1)
    {
        for(const line2 of lines2)
        {
            if(lineIntersectsLine(line1, line2)) { return true; }
        }
    }
    return false;
}

export const getLineIntersectionFromPoints = (a:Vector2, b:Vector2, x:Vector2, y:Vector2) =>
{
    return getLineIntersection(new Line(a,b), new Line(x,y));
}

export const getLineIntersectionFromVectors = (a:Vector2, b:Vector2) =>
{
    return getLineIntersection(new Line(new Vector2(), a), new Line(new Vector2(), b));
}

export const getLineIntersection = (a:Line, b:Line) =>
{
    const vec1 = a.vector();
    const vec2 = b.vector();
    var rxs = vec1.cross(vec2);
    var qminp = a.start.clone().sub(b.start);
    var qpxr = qminp.cross(vec1);

    if(isZero(rxs)) { return null; }

    const t = qminp.cross(vec2) / rxs;
    const u = qminp.cross(vec1) / rxs;

    if(!isZero(rxs) && isBetween(t, 0, 1) && isBetween(u, 0, 1))
    {
        return a.start.clone().add( vec1.scaleFactor(t) );
    }

    return null;
}