import { Vector2, Dims } from "..";
import { PathLike } from "../path";

export const calculateCenter = (points:PathLike) =>
{
    if(!Array.isArray(points)) { points = points.toPathArray(); }

    const center = new Vector2();
    let numPoints = points.length;
    const closesItself = points[0] == points[points.length-1];
    if(closesItself) { numPoints--; }

    for(let i = 0; i < points.length; i++)
    {
        if(i == points.length-1 && closesItself) { continue; }
        center.add(points[i]);
    }
    center.scaleFactor(1.0 / numPoints);
    return center;
}

// @SOURCE: https://stackoverflow.com/questions/9692448/how-can-you-find-the-centroid-of-a-concave-irregular-polygon-in-javascript
export const calculateCentroid = (points:PathLike) =>
{
    if(!Array.isArray(points)) { points = points.toPathArray(); }

    if(points.length <= 0) { return new Vector2(); }
    if(points.length <= 1) { return points[0].clone(); }
    if(points.length <= 2) { return points[0].halfwayTo(points[1]).clone(); }

    points = points.slice();
    
    const numPoints = points.length;
    const first = points[0].clone();
    const last = points[numPoints-1].clone();

    // make sure we return to end
    if(first.x != last.x || first.y != last.y) { points.push(first); }

    let twiceArea = 0;
    let f = 0;
    
    const center = new Vector2();
    for(let i = 0; i < numPoints; i++)
    {
        const p1 = points[i];
        const p2 = points[(i+1) % numPoints];
        f = (p1.y - first.y) * (p2.x - first.x) - (p2.y - first.y) * (p1.x - first.x);
        twiceArea += f;

        center.add(new Vector2(
            (p1.x + p2.x - 2 * first.x) * f,
            (p1.y + p2.y - 2 * first.y) * f
        ));
    }

    f = twiceArea*3;
    return center.scaleFactor(1.0 / f).add(first);
}

export const calculatePathLength = (path:PathLike) =>
{
    if(!Array.isArray(path)) { path = path.toPathArray(); }

    let sum = 0;
    for(let i = 0; i < (path.length-1); i++)
    {
        sum += path[i].distTo(path[i+1]);
    }
    return sum;
}

export const calculateBoundingBox = (path:PathLike) : Dims =>
{
    if(!Array.isArray(path)) { path = path.toPathArray(); }

    const dims = new Dims();
    for(const point of path)
    {
        dims.takePointIntoAccount(point);
    }
    return dims;
}