import { EffectsOperation } from "./effectsOperation";
import { LayoutEffect } from "./layoutEffect";

export class GrayScaleEffect extends LayoutEffect
{
    intensity: number;

    constructor(intensity:number = 1.0)
    {
        super();

        this.intensity = intensity ?? 1.0;
    }

    clone()
    {
        return new GrayScaleEffect(this.intensity);
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
        effOp.addFilterPixi(new filtersConstructor.GrayscaleFilter());
    }

    createFilterString()
    {
        return "grayscale(" + this.intensity + ")";
    }
    
}