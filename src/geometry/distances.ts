import { Line, PathLike, Vector2 } from ".";
import { pathToLineSegments } from "./paths/tesselation";

export const distToLineSegmentSquared = (p:Vector2, v:Vector2, w: Vector2) => 
{
    const l2 = v.distSquaredTo(w);
    if(Math.abs(l2) < 0.0001) { return p.distSquaredTo(v); }

    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const closestPointOnLine = new Vector2({ 
        x: v.x + t * (w.x - v.x), 
        y: v.y + t * (w.y - v.y) 
    });

    return p.distSquaredTo(closestPointOnLine);
}

export const distToLineSegment = (p:Vector2, v:Vector2, w:Vector2) => { return Math.sqrt(distToLineSegmentSquared(p, v, w)); }
export const distToLine = (p:Vector2, l:Line) => { return distToLineSegment(p, l.start, l.end); }
export const distToLineSegments = (p:Vector2, arr:Vector2[], closeLines = true) =>
{
    let smallestDist = Infinity;
    let numPoints = arr.length;
    if(!closeLines) { numPoints--; }
    for(let i = 0; i < numPoints; i++)
    {
        const p1 = arr[i];
        const p2 = arr[(i + 1) % arr.length];
        smallestDist = Math.min(smallestDist, distToLineSegment(p, p1, p2));
    }
    return smallestDist;
}

export const distToPath = (point:Vector2, path:PathLike) =>
{
    let smallestDist = Infinity;
    let lines = pathToLineSegments(path);
    for(const line of lines)
    {
        smallestDist = Math.min(smallestDist, distToLine(point, line));
    }
    return smallestDist;
}

export const getClosestPoint = (p:Vector2, list:PathLike) =>
{
    if(!Array.isArray(list)) { list = list.toPathArray(); }

    let closestDist = Infinity;
    let closestPoint = null;
    for(const point of list)
    {
        const distSquared = p.distSquaredTo(point);
        if(distSquared > closestDist) { continue; }
        closestDist = distSquared;
        closestPoint = point; 
    }
    return closestPoint;
}

// @SOURCE: https://stackoverflow.com/questions/32281168/find-a-point-on-a-line-closest-to-a-third-point-javascript
export const getClosestPointOnLine = (line:Line, point:Vector2) =>
{
    const vec = line.vector(); // atob
    const lineStartToPoint = line.start.vecTo(point); // atop
    const lineLength = line.length(); // len
    
    let dot = lineStartToPoint.dot(vec);
    const t = Math.min(1, Math.max(0, dot / lineLength));

    dot = (vec.x * lineStartToPoint.y) - (vec.y * lineStartToPoint.x); // cross product, right?
    return new Vector2(
        line.start.x + t * vec.x,
        line.start.y + t * vec.y
    )
}

export const getPointsInRange = (p:Vector2, list:PathLike, dist:number) =>
{
    if(!Array.isArray(list)) { list = list.toPathArray(); }

    const arr = [];
    const maxDistSquared = Math.pow(dist, 2);
    for(const point of list)
    {
        const distSquared = p.distSquaredTo(point);
        if(distSquared > maxDistSquared) { continue; }
        arr.push(point);
    }
    return arr;
}