import { calculateCenter } from "./paths/measurements";
import { pathToLineSegments } from "./paths/tesselation";
import { Vector2 } from "./vector2";
import type { PathLike } from "./path";

export const movePath = (path:PathLike, offset:Vector2) : Vector2[] =>
{
    if(!Array.isArray(path)) { path = path.toPathArray(); }
    if(offset.isZero()) { return path.slice(); }

    const arr = [];
    for(const point of path)
    {
        const newPoint = point.clone().move(offset);
        arr.push(newPoint);
    }
    return arr;
}

export const rotatePath = (path:PathLike, rot:number, pivot = new Vector2()) =>
{
    if(!Array.isArray(path)) { path = path.toPathArray(); }
    if(rot == 0) { return path.slice(); }

    const center = pivot ?? calculateCenter(path);
    const newPath = [];
    for(const point of path)
    {
        const newPoint = point.clone().sub(center);
        newPoint.rotate(rot);
        newPoint.add(center);
        newPath.push(newPoint); 
    }
    return newPath;
}

export const scalePath = (path:PathLike, scale:number|Vector2) : Vector2[] =>
{
    if(!Array.isArray(path)) { path = path.toPathArray(); }

    const center = calculateCenter(path);
    const arr = [];
    for(const point of path)
    {
        const newPoint = point.clone().sub(center).scale(scale).add(center);
        arr.push(newPoint);
    }
    return arr;
}


export const scalePathAbsolute = (path:PathLike, offset:number) : Vector2[] =>
{
    const arr = [];
    const lines = pathToLineSegments(path);

    for(let i = 0; i < lines.length; i++)
    {
        const line1 = lines[i];
        const line2 = lines[(i+1) % lines.length];

        const vec1 = line1.vector();
        const vec2 = line2.vector();
        vec1.rotate(Math.PI);

        const insetVec = vec1.normalize().add(vec2.normalize()).normalize();
        const newPoint = line1.end.clone().move(insetVec.scaleFactor(offset));
        arr.push(newPoint)
    }

    // because of the structure above, the array is shifted, (first point registered is line1.END)
    // so we need to move the last element back to front
    const lastElem = arr.pop();
    arr.unshift(lastElem);

    return arr;
}