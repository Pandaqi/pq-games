import type { ResourceImage, CanvasLike } from "../../layout/resources/resourceImage";
import { LayoutOperation } from "../layoutOperation";
import { Vector2 } from "../../geometry/vector2";
import { EffectsOperation } from "./effectsOperation";

export class LayoutEffect
{
    temporaryCanvas = false

    constructor(params:Record<string,any> = {}) { }

    applyToImage(image:ResourceImage = null, effOp:EffectsOperation) : ResourceImage { return null; }

    async applyToImageOverwrite(image:ResourceImage)
    {
        const op = new LayoutOperation();
        op.addEffect(this);
        const imgRes = await image.toResourceImage(op);
        image.fromResourceImage(imgRes);
    }

    applyToCanvas(canv:CanvasLike, effOp:EffectsOperation) { }
    applyToCanvasPost(source:CanvasLike) : CanvasRenderingContext2D { return null; }
    applyToHTML(div:HTMLElement, effOp:EffectsOperation) { }
    applyToPixi(filtersConstructor, effOp = new EffectsOperation(), obj:any = null) {}
    applyShadow(canv:CanvasLike) { }
    clone(deep = false) : LayoutEffect { return new LayoutEffect(); }
    getExtraSizeAdded() : Vector2 { return new Vector2(); }
    needsTemporaryCanvas() { return this.temporaryCanvas; }
}