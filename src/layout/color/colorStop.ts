import { Color } from "./color";

interface ColorStopParams
{
    pos?:number, // between 0 and 1
    color?:string|Color
}

export class ColorStop
{
    pos: number;
    color: Color;

    constructor(params:ColorStopParams = {})
    {
        this.pos = params.pos ?? 0;
        this.color = new Color(params.color ?? "#000000");
    }

    clone(deep = false)
    {
        const col = deep ? this.color.clone() : this.color;
        return new ColorStop({ pos: this.pos, color: col });
    }

    toCSS(asAngle = false) : string
    {
        const posAsAngle = ((this.pos*2*Math.PI) + "rad");
        const posAsPercentage = ((this.pos*100) + "%")

        let pos = asAngle ? posAsAngle : posAsPercentage;
        return this.color.toString() + " " + pos;
    }
}