import { Resource }from "./resource"
import { LayoutOperation } from "../layoutOperation";
import type { CanvasLike } from "./resourceImage";
import { createCanvas } from "../../layout/canvas/creators";
import { Path } from "../../geometry/path";

interface ResourceShapeParams
{
    shape?:Path
}

export class ResourceShape extends Resource
{
    shape: Path
    pixiObject: any

    constructor(params:ResourceShapeParams|Path = {})
    {
        super()
        this.shape = (params instanceof Path) ? params : (params.shape ?? new Path());
    }
    
    clone(deep = false) : ResourceShape
    {
        const shape = deep ? this.shape.clone() : this.shape;
        return new ResourceShape({ shape: shape });
    }

    toCanvas(canv:CanvasLike = null, op:LayoutOperation = new LayoutOperation())
    {
        const dims = this.shape.getDimensions();
        if(!canv) { canv = createCanvas({ width: dims.size.x, height: dims.size.y }); }
        op.resource = this;
        return op.applyToCanvas(canv);
    }

    async toPixi(app, parent, op = new LayoutOperation())
    {
        op.resource = this;
        return op.applyToPixi(app, parent);
    }

    getPixiObject(graphicsConstructor) 
    { 
        if(!this.pixiObject) { this.pixiObject = this.shape.createPixiObject(graphicsConstructor); }
        return this.pixiObject;
    }
}