import { Vector2 } from "..";
import { calculatePathLength } from "./measurements";
import { subdividePath } from "./tesselation";

export interface CurveParams
{
    from:Vector2,
    to:Vector2,
    controlPoint1?:Vector2,
    controlPoint2?:Vector2,
    resolution?:number
}

function getPointAt(t:number, params:CurveParams)
{
    const from = params.from ?? new Vector2();
    const to = params.to ?? new Vector2();
    const cp1 = params.controlPoint1;
    const cp2 = params.controlPoint2;
    const quadratic = !cp2;
    if(quadratic) {
        return from.clone().scaleFactor(Math.pow(1-t, 2))
            .add(cp1.clone().scaleFactor(2*(1-t)*t))
            .add(to.clone().scaleFactor(Math.pow(t, 2)));
    } else {
        return from.clone().scaleFactor(Math.pow(1-t,3))
            .add(cp1.clone().scaleFactor(3*Math.pow(1-t,2)*t))
            .add(cp2.clone().scaleFactor(3*(1-t)*Math.pow(t,2)))
            .add(to.clone().scaleFactor(Math.pow(t,3)));
    }
}

export const bezierCurve = (params:CurveParams) => 
{
    const resolution = params.resolution ?? 32;
    const points = [];
    const factor = 1.0 / (resolution - 1);
    for(let i = 0; i < resolution; i++)
    {
        const t = i * factor;
        points.push(getPointAt(t, params));
    }
    return points;
}

// approximates the bezier curve needed so that the curve itself matches some target length
export const bezierCurveWithLength = (params) => 
{
    const line = params.line;
    const controlPointRotation = params.controlPointRotation ?? 0.5*Math.PI;
    const targetLength = params.targetLength ?? 0.0;
    const stepSize = params.stepSize ?? 1.0;

    let offset = 0;
    let rightLength = false;

    const midPoint : Vector2 = line.start.halfwayTo(line.end);
    const orthoVec : Vector2 = line.start.vecTo(line.end)
    orthoVec.normalize().rotate(controlPointRotation);

    const paramsCurve = {
        resolution: params.resolution,
        from: line.start,
        to: line.end,
        controlPoint1: midPoint
    }

    const alreadyFine = line.length() >= targetLength;
    if(alreadyFine) 
    { 
        //also fine, just worse performance usually
        //return bezierCurve(paramsCurve);

        const pathStraight = [line.start, line.end];
        return subdividePath({ path: pathStraight, numChunks: params.resolution }); 
    }

    // every iteration, we move the control point even further away
    // then we approximate path length to see if it matches our target
    let path;
    while(!rightLength)
    {
        offset += stepSize;
        
        const cp = midPoint.clone().add(orthoVec.clone().scaleFactor(offset));
        paramsCurve.controlPoint1 = cp;

        path = bezierCurve(paramsCurve);
        const length = calculatePathLength(path);

        rightLength = length >= targetLength;
    }

    return path;
}