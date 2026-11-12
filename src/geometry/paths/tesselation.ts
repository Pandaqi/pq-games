import { rangeInteger } from "../../tools/random/ranges";
import type { Vector2 } from "../vector2";
import type { PathLike } from "../path";
import { Line } from "../shapes/line";
import { scalePathAbsolute } from "../transforms";
import { calculatePathLength } from "./measurements";
import { Path } from "../path";

export interface SimplifyPathParams
{
    path: PathLike,
    stepSize?: number
    numSteps?: number
}

// reduces #points by sampling at regular intervals
export const simplifyPath = (params:SimplifyPathParams) : Vector2[] =>
{
    let path = params.path;
    if(!Array.isArray(path)) { path = path.toPathArray(); }

    const numPoints = path.length;
    let numSteps = params.numSteps;
    if(params.stepSize)
    {
        numSteps = Math.floor(numPoints / params.stepSize);
    }

    numSteps = Math.max(numSteps, 1);

    const stepSize = Math.floor(numPoints / numSteps);
    const arr = [];
    for(let i = 0; i < numSteps; i++)
    {
        arr.push(path[i*stepSize]);
    }
    arr.push(path[path.length-1]);
    return arr;
}

export interface SubDividePathParams
{
    path: PathLike,
    chunkSize?: number
    numChunks?: number
}

export const subdividePath = (params:SubDividePathParams) =>
{
    // chop the path into lots of (regularly sized) chunks
    let path = params.path;
    if(!Array.isArray(path)) { path = path.toPathArray(); }
    if(path.length <= 1) { return []; }

    const pathChopped : Vector2[] = [];
    let chunkSize = params.chunkSize;
    if(params.numChunks)
    {
        const length = calculatePathLength(path);
        chunkSize = length / params.numChunks;
    }

    const first = path[0];
    const last = path[path.length-1];
    const selfClosing = first.matches(last);
    const pathLengthToConsider = selfClosing ? path.length : path.length - 1;

    for(let i = 0; i < pathLengthToConsider; i++)
    {
        const curPoint = path[i];
        const nextPoint = path[(i + 1) % path.length];

        const vec = curPoint.vecTo(nextPoint);
        const dist = vec.clone().length();
        const vecNorm = vec.clone().normalize();
        const numSteps = Math.floor(dist / chunkSize);

        const offset = vecNorm.clone().scaleFactor(chunkSize);
        let p = curPoint.clone();
        pathChopped.push(p);
        for(let a = 0; a < numSteps; a++)
        {
            p = p.clone().move(offset);
            pathChopped.push(p);
        }
    }

    // if the chunks don't fit perfectly, we forget to add the final point 
    // so do that now
    if(!pathChopped[pathChopped.length - 1].matches(last))
    {
        pathChopped.push(last.clone());
    }

    return pathChopped;
}

export interface BevelPathParams
{
    path: PathLike,
    offset?: number
}

// How does it work?
// It creates a second version of the polygon/path, but scaled inward (towards center)
// Then it creates "rectangles" between the original line (outerPath) and the inner line (innerPath)
// Those are your bevels, color/use them as you wish
export const bevelPath = (params:BevelPathParams) =>
{
    let outerPath = params.path;
    if(!Array.isArray(outerPath)) { outerPath = outerPath.toPathArray(); }

    const offset = params.offset ?? 10;
    const innerPath = scalePathAbsolute(outerPath, offset);
    
    let shapes : Path[] = [];
    for(let i = 0; i < outerPath.length; i++)
    {
        const nextIndex = (i + 1) % outerPath.length;
        const p1 = outerPath[i];
        const p2 = outerPath[nextIndex];

        const q1 = innerPath[i];
        const q2 = innerPath[nextIndex];

        const points = [
            p1.clone(),
            p2.clone(),
            q2.clone(),
            q1.clone()
        ]

        const shape = new Path(points);
        shapes.push(shape);
    }

    return shapes;
}

export const pathToLineSegments = (points:PathLike) =>
{
    if(!Array.isArray(points)) { points = points.toPathArray(); }

    const arr = [];
    for(let i = 0; i < points.length; i++)
    {
        const p1 = points[i];
        const p2 = points[(i+1) % points.length];
        const l = new Line(p1, p2);
        arr.push(l);
    }
    return arr;
}


export interface BitePathParams
{
    path?: PathLike,
    chunkSize?: number,
    biteBounds?: { min: number, max: number },
    chunksInterval?: { min: number, max: number }
}

function takeBite(idx:number, path:Vector2[], dist:number)
{
    const curPoint = path[idx];
    const nextPoint = path[(idx + 1) % path.length];
    const middlePoint = curPoint.halfwayTo(nextPoint);
    const vec = curPoint.vecTo(nextPoint).normalize();
    const vecOrtho = vec.ortho();

    const bitePoint = middlePoint.add(vecOrtho.scaleFactor(dist));
    path.splice(idx + 1, 0, bitePoint);
}

export const takeBitesOutOfPath = (params:BitePathParams) : Vector2[] => 
{
    let path = params.path;
    if(!path) { return []; }

    // chop the path into lots of (regularly sized) chunks
    const chunkSize = params.chunkSize ?? 10.0;
    const pathChopped : Vector2[] = subdividePath({ path: path, chunkSize: chunkSize });

    // then randomly move some of them inward
    const chunksInterval = params.chunksInterval ?? { min: 3, max: 10 };
    const biteBounds = params.biteBounds ?? { min: 15, max: 20 };
    const maxNumChunks = pathChopped.length;
    let index = rangeInteger(0, maxNumChunks - 1);
    let chunksConsidered = 0;
    while(chunksConsidered < maxNumChunks)
    {
        const randDist = rangeInteger(biteBounds.min, biteBounds.max);
        takeBite(index, pathChopped, randDist);

        const offset = rangeInteger(chunksInterval.min, chunksInterval.max);
        chunksConsidered += offset
        index = (index + offset) % maxNumChunks;        
    }

    return pathChopped;
}