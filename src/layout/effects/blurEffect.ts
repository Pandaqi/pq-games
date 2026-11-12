import { Vector2 } from "../../geometry/vector2";
import { LayoutEffect } from "./layoutEffect";
import { EffectsOperation } from "./effectsOperation";

export class BlurEffect extends LayoutEffect
{
    blur:number;
    
    constructor(blur:number)
    {
        super({});
        this.blur = blur;
    }

    clone()
    {
        return new BlurEffect(this.blur);
    }

    applyToCanvas(ctx:CanvasRenderingContext2D, effOp = new EffectsOperation())
    {
        effOp.addFilter(this.createFilterString());
    }

    applyToHTML(div:HTMLDivElement, effOp = new EffectsOperation())
    {
        effOp.addFilter(this.createFilterString());
    }

    applyToPixi(filtersConstructor, effOp = new EffectsOperation(), obj)
    {
        effOp.addFilterPixi(new filtersConstructor.KawaseBlurFilter({
            strength: this.blur
        }));
    }

    createFilterString()
    {
        return "blur(" + this.blur + "px)";
    }

    getExtraSizeAdded()
    {
        return new Vector2(0.5*this.blur);
    }
    
}