import { Vector2 } from "../vector2";

export interface ArcDataParams
{
    radius?:Vector2,
    rotation?:number,
    takeLongerRoute?:boolean, // large-arc-flag
    goClockwise?:boolean // sweep-flag
}

export class ArcData
{
    radius: Vector2;
    rotation: number;
    takeLongerRoute: boolean;
    goClockwise: boolean;

    constructor(params:ArcDataParams = {})
    {
        this.radius = params.radius ?? new Vector2(10);
        this.rotation = params.rotation ?? 0;
        this.takeLongerRoute = params.takeLongerRoute ?? false;
        this.goClockwise = params.goClockwise ?? false;
    }

    clone(deep = false)
    {
        const r = deep ? this.radius.clone() : this.radius;
        return new ArcData({
            radius: r, rotation: this.rotation,
            takeLongerRoute: this.takeLongerRoute,
            goClockwise: this.goClockwise
        });
    }

    getBooleanString(val:boolean)
    {
        return val ? "1" : "0";
    }

    toPathString()
    {
        const arr = [
            this.radius.toSVGString(),
            this.rotation.toString(),
            this.getBooleanString(this.takeLongerRoute),
            this.getBooleanString(this.goClockwise)
        ]
        return arr.join(" "); 
    }
}

export interface ArcParams
{
    from:Vector2
    to:Vector2
    resolution?:number
    arcData?:ArcData
}

// Formulas taken from SVG Implementation Notes: https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
// SVG takes its arc input as "endpoint parametrization"
// I convert it to "center parametrization"
// So I can just draw it like points on a circle/ellipse and return that
// @NOTE: This is basically untested and unused
export const arc = (params:ArcParams) =>
{
    const d = params.arcData ?? new ArcData();
    const phi = d.rotation;
    const from = params.from;
    const resolution = params.resolution ?? 32;
    const to = params.to;
    let rad = d.radius;

    // SAFEGUARD: no zero or negative radius
    if(rad.x == 0 || rad.y == 0) { return [from, to]; }
    rad = rad.clone().abs();

    // move translation/rotation to 0 for easy calculations
    const offset = from.clone().sub(to).scaleFactor(0.5);
    const pos1 = new Vector2(
        Math.cos(phi) * offset.x + Math.sin(phi) * offset.y,
        -Math.sin(phi) * offset.x + Math.cos(phi) * offset.y
    );

    let sign = (d.goClockwise != d.takeLongerRoute) ? 1 : -1;

    // SAFEGUARD: ensure radii have a solution
    const lambda = Math.pow(pos1.x,2) / Math.pow(rad.x,2) + Math.pow(pos1.y,2) / Math.pow(rad.y,2);
    if(lambda > 1)
    {
        rad.x = Math.sqrt(lambda) * rad.x;
        rad.y = Math.sqrt(lambda) * rad.y;
    }

    // calculate ellipse center
    const factor1 = Math.pow(rad.x, 2) * Math.pow(rad.y, 2) - Math.pow(rad.x,2) * Math.pow(pos1.y, 2) - Math.pow(rad.y,2) * Math.pow(pos1.x, 2);
    const factor2 = Math.pow(rad.x, 2) * Math.pow(pos1.y, 2) + Math.pow(rad.y, 2) * Math.pow(pos1.x, 2);

    const factor = sign * Math.sqrt(factor1 / factor2);
    const cpos1 = new Vector2(
        factor * (rad.x * pos1.y) / rad.y,
        -factor * rad.y * pos1.x / rad.x
    );

    // undo the offset to get the real ellipse center
    const mid = from.halfwayTo(to);
    const cpos = new Vector2(
        Math.cos(phi) * cpos1.x - Math.sin(phi) * cpos1.y + mid.x,
        Math.sin(phi) * cpos1.x + Math.cos(phi) * cpos1.y + mid.y
    )

    // from this, calculate where to start and how long the angle should be
    const angleVector = new Vector2(
        (pos1.x-cpos1.x)/rad.x,
        (pos1.y-cpos1.y)/rad.y
    );

    const angleVectorDelta = new Vector2(
        (-pos1.x-cpos1.x)/rad.x,
        (-pos1.y-cpos1.y)/rad.y
    )

    const startAngle = new Vector2(1,0).angleSignedTo(angleVector);
    let deltaAngle = angleVector.angleSignedTo(angleVectorDelta);

    // if sweep = 0 and delta > 0, subtract 360 degrees
    // if sweep = 1 and delta < 0, add 360 degrees
    if(!d.goClockwise && deltaAngle > 0) { deltaAngle -= 2*Math.PI; }
    if(d.goClockwise && deltaAngle < 0) { deltaAngle += 2*Math.PI; }

    // now we have our center position, start, and offset
    // so just draw through that ellipse
    const incrementAngle = Math.abs(deltaAngle) / (resolution - 1);
    const arr = [];
    for(let i = 0; i < resolution; i++)
    {
        const ang = startAngle + i*incrementAngle
        const p = new Vector2(
            cpos.x + Math.cos(ang)*rad.x,
            cpos.y + Math.sin(ang)*rad.y
        )
        arr.push(p);
    }
    return arr;
}