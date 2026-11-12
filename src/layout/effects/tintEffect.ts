import { ResourceImage } from "../resources/resourceImage"
import { createContext } from "../canvas/creators"
import { LayoutEffect } from "./layoutEffect";
import { Color }from "../color/color";
import { getTintCSSFilters } from "./tintEffectSolver";
import { EffectsOperation } from "./effectsOperation";

interface TintEffectParams
{
    color?: Color|string,
    from?: Color|string
}

export type { TintEffectParams }
export class TintEffect extends LayoutEffect
{
    color: Color
    from: Color

    constructor(params:TintEffectParams|string|Color = {})
    {
        if(params instanceof Color) { params = { color: params}; }
        if(typeof params !== "object") { params = { color: params }; }
        super(params);
        this.color = new Color(params.color ?? "#FFFFFF");
        this.from = new Color(params.from ?? "#FFFFFF");
    }

    clone(deep = false)
    {
        const col = deep ? this.color.clone() : this.color;
        return new TintEffect({ color: col });
    }

    applyToImage(drawable:ResourceImage)
    {
        // first, we get a mask just with the tint color
        const contextParams = { size: drawable.getSize(), alpha: true }
        const ctx = createContext(contextParams);
        ctx.drawImage(drawable.getImage(), 0, 0);
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = this.color.toString();
        ctx.fillRect(0, 0, contextParams.size.x, contextParams.size.y);

        // then we multiply that mask with the original image to do an actual, proper tinting
        const ctx2 = createContext(contextParams);
        ctx2.drawImage(drawable.getImage(), 0, 0);
        ctx2.globalCompositeOperation = "multiply";
        ctx2.drawImage(ctx.canvas, 0, 0);

        return new ResourceImage(ctx2.canvas);
    }

    applyToHTML(div:HTMLElement, effOp = new EffectsOperation())
    {
        const filters = getTintCSSFilters(this.color, this.from);
        effOp.addFilters(filters);
    }

    applyToPixi(filtersConstructor, effOp = new EffectsOperation(), obj)
    {
        obj.tint = this.color.toHEXNumber();
    }
}