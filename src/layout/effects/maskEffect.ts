import { createContext } from "../canvas/creators";
import { LayoutOperation } from "../layoutOperation";
import { ResourceImage } from "../resources/resourceImage";
import { EffectsOperation } from "./effectsOperation";
import { LayoutEffect } from "./layoutEffect";

interface MaskEffectParams
{
    resource?: ResourceImage,
    operation?: LayoutOperation,
}

export type { MaskEffectParams };
export class MaskEffect extends LayoutEffect
{
    resource: ResourceImage
    operation: LayoutOperation

    constructor(params:MaskEffectParams = {})
    {
        super(params);
        this.resource = params.resource;
        this.operation = params.operation ?? new LayoutOperation();
    }

    clone(deep = false)
    {
        return new MaskEffect({ resource: this.resource, operation: this.operation });
    }

    // this is a mask _on the image directly_, nothing else, before it is drawn
    // use the `.mask` property of LayoutOperation for a mask in global/absolute coordinates on the final canvas
    applyToImage(drawable:ResourceImage)
    {
        if(!this.resource) { return drawable; }

        // place the mask as desired
        const ctx = createContext({ size: drawable.getSize() });
        this.resource.toCanvas(ctx, this.operation);

        // then stamp the original image on top, keeping only places where the MASK also exists
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(drawable.getImage(), 0, 0);

        return new ResourceImage(ctx.canvas);
    }

    applyToHTML(div:HTMLElement, effOp = new EffectsOperation())
    {
        div.style.maskImage = this.resource.getCSSUrl();
    }

    // @TODO: fix this shit in a clean way; maybe have effects handled by Renderer individually too? Or is that overkill?
    applyToPixi(filtersConstructor, effOp = new EffectsOperation(), obj)
    {
        console.error("[Not Implemented] Mask Operations not implemented on RendererPixi yet!", this);

        const maskSprite = this.resource.getPixiObject();
        this.operation.resource = this.resource;
        this.operation.renderer.applyToPixiObjectProperties(maskSprite);
        obj.mask = maskSprite;
    }
}