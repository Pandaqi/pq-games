import type { Vector2 } from "../../geometry/vector2"

interface NewCanvasParams
{
    width?:number
    height?:number
    size?:Vector2
    alpha?:boolean
    resize?:boolean
}

export const createCanvas = (params:NewCanvasParams = {}) : HTMLCanvasElement =>
{
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    if(params.size) 
    { 
        canvas.width = params.size.x;
        canvas.height = params.size.y;
    }

    if(params.resize)
    {
        canvas.style.width = "100%";
        canvas.style.height = "100%";
    }

    Object.assign(canvas, params);
    return canvas;
}

interface NewContextParams
{
    alpha?:boolean
    willReadFrequently?:boolean
    antialias?: boolean
    width?:number
    height?:number
    size?:Vector2
}

export const createContext = (params:NewContextParams = {}) : CanvasRenderingContext2D =>
{
    const contextParams = { 
        willReadFrequently: true,
        alpha: true,
        antialias: true
    };
    Object.assign(contextParams, params);
    const ctx = createCanvas(params).getContext("2d", contextParams) as CanvasRenderingContext2D;
    ctx.imageSmoothingQuality = "low";
    ctx.imageSmoothingEnabled = false;
    return ctx;
}
