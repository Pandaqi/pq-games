import { LayoutOperation } from "../layoutOperation";
import type { CanvasLike } from "./resourceImage";

export class Resource
{
    constructor() { }
    clone(deep = false) : any
    {
        return new Resource();
    }

    toCanvas(canv:CanvasLike = null, op:LayoutOperation = null) : HTMLCanvasElement 
    { 
        return document.createElement("canvas"); 
    }

    async toHTML(op:LayoutOperation = null) : Promise<HTMLElement> 
    { 
        return document.createElement("div"); 
    }

    async createPixiObject() {}
    getPixiObject(param = null) {}
    async toPixi(app, parent, op:LayoutOperation = new LayoutOperation()) {}
    
}