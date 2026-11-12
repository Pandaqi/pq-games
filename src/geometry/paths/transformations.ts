import { Dims } from "../dims";
import { getClosestPointOnLine } from "../distances";
import { lineIntersectsLine } from "../intersection/pathIntersectsPath";
import { Vector2 } from "../vector2";
import type { PathLike } from "../path";
import { Line } from "../shapes/line";
import { movePath, scalePath } from "../transforms";
import { calculateBoundingBox, calculateCenter } from "./measurements";

export interface ThickenPathParams
{
    path: PathLike,
    thickness?: number
}

export const thickenPath = (params:ThickenPathParams) =>
{
    let points = params.path;
    if(!Array.isArray(points)) { points = points.toPathArray(); }

    const thickness = params.thickness ?? 10;

    let lastVec : Vector2 = new Vector2();
    let lastLines = [new Line(), new Line()];
    const extrudes = [[], []];
    const signs = [1,-1];
    for(let i = 0; i < points.length; i++)
    {
        const lastPoint = i >= (points.length - 1);
        let vec = lastVec.clone();

        const p1 = points[i];
        if(!lastPoint)
        {
            const p2 = points[i+1];
            vec = p1.vecTo(p2).normalize();
        }
        
        lastVec = vec.clone();

        const isDuplicatePoint = vec.isZero();
        if(isDuplicatePoint) { continue; }

        for(let a = 0; a < 2; a++)
        {
            const vecOffset = vec.clone().rotate(0.5*Math.PI* signs[a]).scaleFactor(0.5*thickness);
            const pOffset = p1.clone().move(vecOffset);
            const line = new Line(p1, pOffset); 

            // if the new line intersects the previous one,
            // it means we try to place a point BEFORE the previous one (this happens in the shorter side of (tight) corners)
            // this is bad and ugly, so just set this point to the previous one
            // (why not remove it? Left and Right side should have an identical number of points, so you can easily match them.)
            if(lineIntersectsLine(line, lastLines[a]))
            {
                pOffset.set(lastLines[a].end);
            }

            lastLines[a] = line;
            extrudes[a].push(pOffset);
        }
    }

    return [extrudes[0], extrudes[1].reverse()].flat();
}

export enum MirrorAxis
{
    HORIZONTAL,
    VERTICAL,
    DIAGONAL_DOWN,
    DIAGONAL_UP
}

const MIRROR_AXIS_TO_VECTOR2 = 
{
    [MirrorAxis.HORIZONTAL]: Vector2.RIGHT,
    [MirrorAxis.VERTICAL]: Vector2.DOWN,
    [MirrorAxis.DIAGONAL_DOWN]: Vector2.ONE,
    [MirrorAxis.DIAGONAL_UP]: new Vector2(1,-1)
}

export const mirrorPath = (path:PathLike, axis: MirrorAxis|Vector2, pivot = Vector2.CENTER) =>
{
    if(!Array.isArray(path)) { path = path.toPathArray(); }

    const boundingBox = calculateBoundingBox(path);

    // find the exact LINE slicing the shape for mirroring
    if(!(axis instanceof Vector2))
    {
        axis = MIRROR_AXIS_TO_VECTOR2[axis ?? MirrorAxis.HORIZONTAL];
    }

    const maxExtension = boundingBox.size.largestSide();
    const axisLeft = axis.clone().scale(new Vector2(-pivot.x * maxExtension, -pivot.y * maxExtension));
    const axisRight = axis.clone().scale(new Vector2((1.0 - pivot.x) * maxExtension, (1.0 - pivot.y) * maxExtension));

    const anchor = boundingBox.getPosition();
    const mirrorLine = new Line(anchor.clone().add(axisLeft), anchor.clone().add(axisRight));

    // for each point, find the perpendicular vector to line,
    // then simply extend it by that distance on the other side.
    // (reverse array to keep same winding order as before)
    const arr = [];
    for(const point of path)
    {
        const perpPoint = getClosestPointOnLine(mirrorLine, point);
        const vec = point.vecTo(perpPoint);
        const mirroredPoint = perpPoint.clone().move(vec);
        arr.push(mirroredPoint);
    }

    return arr.reverse();
}

export const fitPath = (path:PathLike, dimsNew:Dims, keepRatio = true) =>
{
    if(!Array.isArray(path)) { path = path.toPathArray(); }

    const dimsOriginal = new Dims().fromPoints(path);
    let scaleFactor = dimsNew.getSize().div(dimsOriginal.getSize());
    if(keepRatio)
    {
        scaleFactor = new Vector2(Math.min(scaleFactor.x, scaleFactor.y));
    }

    const pathScaled = scalePath(path, scaleFactor);
    const neededOffset = dimsNew.getPosition().sub(calculateCenter(pathScaled));
    const pathMoved = movePath(pathScaled, neededOffset);
    return pathMoved;
}