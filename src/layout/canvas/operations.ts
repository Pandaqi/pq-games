import { Rectangle } from "../../geometry/shapes/rectangle";
import { LayoutOperation } from "../layoutOperation";
import type { ResourceGroup } from "../resources/resourceGroup";
import { ResourceShape } from "../resources/resourceShape";
import { Vector2 } from "../../geometry/vector2";

export const strokeCanvas = (ctx:CanvasRenderingContext2D|HTMLCanvasElement, color:string, width:number) =>
{
    if(ctx instanceof HTMLCanvasElement) { ctx = ctx.getContext("2d"); }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export const applyPaths = (ctx:CanvasRenderingContext2D, params:Record<string,any>) =>
{
    if(params.color) 
    { 
        ctx.fillStyle = params.color;
        ctx.fill();
    }

    if(params.stroke)
    {
        ctx.strokeStyle = params.stroke;
        ctx.lineWidth = params.strokeWidth ?? 1;
        ctx.stroke();
    }
}

export const fillCanvas = (ctx:CanvasRenderingContext2D|HTMLCanvasElement, color:string) =>
{
    if(ctx instanceof HTMLCanvasElement) { ctx = ctx.getContext("2d"); }
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export const fillResourceGroup = (size:Vector2, group:ResourceGroup, color:string) =>
{
    const rect = new Rectangle().fromTopLeft(new Vector2(), size);
    const res = new ResourceShape({ shape: rect });
    const op = new LayoutOperation({ fill: color });
    group.add(res, op);
}

const RESET_STATE =
{
    alpha: 1.0,
    filter: "none",
    composite: "source-over" as GlobalCompositeOperation,
    transform: new DOMMatrix()
}

export interface CanvasContextState
{
    transform?: DOMMatrix,
    filter?: string,
    composite?: GlobalCompositeOperation,
    alpha?: number
}

export const resetCanvasContextState = (ctx:CanvasRenderingContext2D, state:CanvasContextState = RESET_STATE) =>
{
    ctx.globalAlpha = state.alpha;
    ctx.filter = state.filter;
    ctx.globalCompositeOperation = state.composite;
    ctx.setTransform(state.transform);
}

export const getCanvasContextState = (ctx:CanvasRenderingContext2D) : CanvasContextState =>
{
    return {
        transform: ctx.getTransform(),
        filter: ctx.filter,
        composite: ctx.globalCompositeOperation,
        alpha: ctx.globalAlpha
    }
}