import type { Vector2 } from "../vector2"
import { removeDuplicatesFromPath } from "./tools";

function prepareFullPath(path:Vector2[])
{
    const firstPoint = path[0];
    const extraPointBeforeVec = path[1].vecTo(firstPoint);
    const extraPointBefore = firstPoint.clone().move(extraPointBeforeVec);
    path.unshift(extraPointBefore);

    const lastPoint = path[path.length-1];
    const extraPointAfterVec = path[path.length-2].vecTo(lastPoint);
    const extraPointAfter = lastPoint.clone().move(extraPointAfterVec);
    path.push(extraPointAfter);
}

function createSegments(params:SmoothPathParams) : CatmullRomSegment[]
{
    const segments = [];
    const path = params.path;
    for(let i = 1; i < (path.length-2); i++)
    {
        const curPoints:CatmullRomParams = {
            p0: path[i-1],
            p1: path[i],
            p2: path[i+1],
            p3: path[i+2],
            alpha: params.alpha,
            tension: params.tension
        }
        const s = new CatmullRomSegment(curPoints);
        segments.push(s);
    }

    return segments;
}

function getPointsFromSegments(params:SmoothPathParams, segments:CatmullRomSegment[]) : Vector2[]
{
    const res = params.resolution;
    const list = [];
    for(let i = 0; i < segments.length; i++)
    {
        const lastSegment = i == segments.length - 1;
        list.push(segments[i].getPoints(res, lastSegment));
    }
    return list.flat();
}

interface CatmullRomParams
{
    p0:Vector2,
    p1:Vector2,
    p2:Vector2,
    p3:Vector2,
    alpha?: number,
    tension?: number
}

class CatmullRomSegment
{
    a:Vector2
    b:Vector2
    c:Vector2
    d:Vector2

    constructor(params:CatmullRomParams)
    { 
        this.prepareConstants(params); 
    }

    prepareConstants(params:CatmullRomParams)
    {
        const p0 = params.p0;
        const p1 = params.p1;
        const p2 = params.p2;
        const p3 = params.p3;
        const alpha = params.alpha ?? 0.5;
        const tau = (1.0 - params.tension) ?? 0.5;

        /*
            @SOURCE: https://qroph.github.io/2018/07/30/smooth-paths-using-catmull-rom-splines.html
            float t01 = pow(distance(p0, p1), alpha);
            float t12 = pow(distance(p1, p2), alpha);
            float t23 = pow(distance(p2, p3), alpha);
        */
        const t01 = Math.pow(p0.distTo(p1), alpha);
        const t12 = Math.pow(p1.distTo(p2), alpha);
        const t23 = Math.pow(p2.distTo(p3), alpha);

        /*
            vec2 m1 = (1.0f - tension) *
                (p2 - p1 + t12 * ((p1 - p0) / t01 - (p2 - p0) / (t01 + t12)));
            vec2 m2 = (1.0f - tension) *
                (p2 - p1 + t12 * ((p3 - p2) / t23 - (p3 - p1) / (t12 + t23)));
        */
        const m1a = p2.clone().sub(p0).scaleFactor(1.0/(t01 + t12));
        const m1b = p1.clone().sub(p0).scaleFactor(1.0/t01);
        const m1ab = m1b.sub(m1a).scaleFactor(t12);
        const m1 = p2.clone().sub(p1).add(m1ab).scaleFactor(tau);

        const m2a = p3.clone().sub(p1).scaleFactor(1.0/(t12 + t23));
        const m2b = p3.clone().sub(p2).scaleFactor(1.0/t23);
        const m2ab = m2b.sub(m2a).scaleFactor(t12);
        const m2 = p2.clone().sub(p1).add(m2ab).scaleFactor(tau);

        /*
            Segment segment;
            segment.a = 2.0f * (p1 - p2) + m1 + m2;
            segment.b = -3.0f * (p1 - p2) - m1 - m1 - m2;
            segment.c = m1;
            segment.d = p1;
        */
        this.a = p1.clone().sub(p2).scaleFactor(2.0).add(m1).add(m2)
        this.b = p1.clone().sub(p2).scaleFactor(-3.0).sub(m1).sub(m1).sub(m2)
        this.c = m1;
        this.d = p1;
    }

    getPoint(t:number)
    {
        const c1 = this.a.clone().scaleFactor(t*t*t);
        const c2 = this.b.clone().scaleFactor(t*t);
        const c3 = this.c.clone().scaleFactor(t);
        const c4 = this.d.clone();
        return c1.add(c2).add(c3).add(c4);
    }

    getPoints(resolution:number, lastSegment = false)
    {
        const numSteps = lastSegment ? resolution - 1 : resolution;
        const step = 1.0 / numSteps;
        const list = [];
        for(let i = 0; i < resolution; i++)
        {
            const t = i*step;
            list.push(this.getPoint(t));
        }
        return list;
    }
}


export interface SmoothPathParams
{
    path: Vector2[]
    tension?: number
    resolution?: number
    variant?: string
    alpha?: number
}

export const smoothPath = (params:SmoothPathParams) =>
{
    let path = params.path ?? [];
    if(path.length <= 2) { return path; }

    params.tension = params.tension ?? 0;
    if(params.tension >= 0.99) { return path; }

    params.resolution = params.resolution ?? 10;
    if(params.resolution <= 1) { return path; }

    const variant = params.variant ?? "centripetal";
    let alpha = 0.5;
    if(variant == "uniform") { alpha = 0.0; }
    else if(variant == "chordal") { alpha = 1.0; } 
    params.alpha = alpha;

    prepareFullPath(path);
    params.path = path;
    
    const segments = createSegments(params);
    const points = getPointsFromSegments(params, segments);
    return removeDuplicatesFromPath(points);
}