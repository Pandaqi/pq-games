import { RepeatValue, RepeatValueTwoAxis } from "../values";
import { Resource }from "./resource"
import { ImageLike } from "./resourceImage";

export interface ResourcePatternParams
{
    callback?:Function
    image?: ImageLike
    repeat?: RepeatValueTwoAxis  
}

// Implementation = when executing, run loops to tile the image, and within those call the callback each time (with current iteration/position)
export class ResourcePattern extends Resource
{
    image:ImageLike
    callback:Function
    repeat:RepeatValueTwoAxis

    constructor(params:ResourcePatternParams = {})
    {
        super()

        this.image = params.image;
        this.callback = params.callback;
        this.repeat = params.repeat ?? { x: RepeatValue.NONE, y: RepeatValue.NONE };
    }
    
    clone() : ResourcePattern
    {
        return new ResourcePattern();
    }

    isTransparent() { return false; }

    toCSS()
    {
        return "";
    }

    toCanvasStyle(ctx:CanvasRenderingContext2D) { }
    
}