import type { Vector2 } from "../vector2";
import type { PathLike } from "../path";
import { bezierCurve } from "./curves";

export const bevelCorners = (path:PathLike, bevelSize:number) =>
{
    if(!Array.isArray(path)) { path = path.toPathArray(); }

    const pathBeveled = [];
    for(let i = 0; i < path.length; i++)
    {
        const curPos = path[i];
        const nextPos = path[(i + 1) % path.length];
        const prevPos = path[(i - 1 + path.length) % path.length];
        const vecNext = curPos.vecTo(nextPos).normalize();
        const vecPrev = curPos.vecTo(prevPos).normalize();
        
        // first the one coming TO us (from previous point), then the one LEAVING us
        // otherwise order is messed up
        const pos1 = curPos.clone().move(vecPrev.scaleFactor(bevelSize));
        const pos2 = curPos.clone().move(vecNext.scaleFactor(bevelSize));

        pathBeveled.push(pos1);
        pathBeveled.push(pos2);
    }
    return pathBeveled;
}

// @SOURCE: https://www.gorillasun.de/blog/an-algorithm-for-polygons-with-rounded-corners/
export const roundPath = (points:PathLike, radius:number|number[] = 10, close = false) : Vector2[] =>
{
    if(!Array.isArray(points)) { points = points.toPathArray(); }
    if(!Array.isArray(radius)) { radius = [radius]; }
    
    const arr = [];
    for (let i = 0; i < points.length; i++) {
        const a = points[i]
        const b = points[(i+1) % points.length]
        const c = points[(i+2) % points.length]
        const curPointRadius = radius[(i + 1) % radius.length];

        const ba : Vector2 = a.clone().sub(b).normalize()
        const bc : Vector2 = c.clone().sub(b).normalize()
        
        // points in the direction the corner is accelerating towards
        const normal = ba.clone().add(bc).normalize()
        
        // shortest angle between the two edges
        const theta = ba.angleTo(bc)
        
        // find the circle radius that would cause us to round off half
        // of the shortest edge. We leave the other half for neighbouring corners to potentially cut.
        const minDist = Math.min(a.distTo(b), c.distTo(b));
        const maxR = 0.5 * minDist * Math.abs(Math.sin(0.5 * theta))
        const cornerR = Math.min(curPointRadius, maxR)
        
        // find the distance away from the corner that has a distance of
        // 2*cornerR between the edges
        const distance = Math.abs(cornerR / Math.sin(0.5*theta))
        
        // approximate an arc using a cubic bezier
        const c1 = b.clone().add(ba.clone().mult(distance))
        const c2 = b.clone().add(bc.clone().mult(distance))
        
        const bezierDist = 0.5523 // https://stackoverflow.com/a/27863181
        const p1 = c1.clone().sub(ba.clone().mult(2*cornerR*bezierDist))
        const p2 = c2.clone().sub(bc.clone().mult(2*cornerR*bezierDist))

        const corner = bezierCurve({ from: c1, to: c2, controlPoint1: p1, controlPoint2: p2 });
        arr.push(corner);
    }

    const result = arr.flat();
    if(close) { result.push(result[0]); }
    return result;
}