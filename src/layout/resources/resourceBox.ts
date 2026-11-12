import { Resource }from "./resource"
import { LayoutOperation } from "../layoutOperation";
import type { CanvasLike } from "./resourceImage";

export class ResourceBox extends Resource
{    
    clone(deep = false) : ResourceBox { return new ResourceBox(); }

    toCanvas(canv:CanvasLike = null, op:LayoutOperation = new LayoutOperation())
    {
        op.resource = this;
        return op.applyToCanvas(canv);
    }

    async toHTML(op = new LayoutOperation())
    {
        return document.createElement("div");
    }
}