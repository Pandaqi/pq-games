import { LayoutOperation, ResourceLike } from "../layoutOperation";
import { Resource } from "./resource";
import type { CanvasLike } from "./resourceImage";

class LayoutCombo
{
    resource: ResourceLike;
    operation: LayoutOperation;

    constructor(res:ResourceLike, op = new LayoutOperation())
    {
        this.resource = res;
        this.operation = op;
    }

    toCanvas(ctx:CanvasLike, parentOperation = new LayoutOperation())
    {
        this.operation.parentOperation = parentOperation;
        this.operation.renderer = parentOperation.renderer;
        this.resource.toCanvas(ctx, this.operation);
    }

    toPixi(app, parent, parentOperation = new LayoutOperation())
    {
        this.operation.parentOperation = parentOperation;
        this.operation.renderer = parentOperation.renderer;
        return this.resource.toPixi(app, parent, this.operation);
    }
}

export { LayoutCombo };
export class ResourceGroup extends Resource
{
    combos: LayoutCombo[]

    constructor()
    {
        super()
        this.combos = [];
    }

    clear() { this.combos = []; }
    add(res:ResourceLike, op:LayoutOperation = undefined)
    {
        const combo = new LayoutCombo(res, op);
        this.combos.push(combo);
        return combo;
    }

    remove(combo:LayoutCombo)
    {
        const idx = this.combos.indexOf(combo);
        if(idx < 0) { return; }
        this.combos.splice(idx, 1);
    }

    toCanvas(ctx:CanvasLike, op = new LayoutOperation())
    {
        op.resource = this;
        return op.applyToCanvas(ctx);
    }

    toPixi(app, parent, op = new LayoutOperation())
    {
        op.resource = this;
        return op.applyToPixi(app, parent);
    }
}