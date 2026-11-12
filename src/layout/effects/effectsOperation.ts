import type { ResourceImage } from "../resources/resourceImage";
import type { LayoutEffect } from "./layoutEffect";

export class EffectsOperation
{
    effects:LayoutEffect[];
    filters: string[];
    filtersPixi: any[];

    constructor(eff = [])
    {
        this.effects = eff;
        this.resetData();
    }

    isEmpty() { return this.effects.length <= 0; }
    resetData()
    {
        this.filters = [];
        this.filtersPixi = [];
    }

    applyToCanvasPre(ctx:CanvasRenderingContext2D)
    {
        if(this.isEmpty()) { return; }        
        for(const effect of this.effects)
        {
            effect.applyToCanvas(ctx, this);
        }
        return ctx;
    }

    applyToCanvasPost(ctx:CanvasRenderingContext2D)
    {
        if(this.isEmpty()) { return ctx; }
        for(const effect of this.effects)
        {
            ctx = effect.applyToCanvasPost(ctx) ?? ctx;
        }
        return ctx;
    }

    applyToDrawable(drawable:ResourceImage)
    {
        if(this.isEmpty()) { return drawable; } 
        for(const effect of this.effects)
        {
            drawable = effect.applyToImage(drawable, this) ?? drawable;
        }
        return drawable;
    }

    applyToHTML(node:HTMLElement)
    {
        if(this.isEmpty()) { return node; }
        for(const effect of this.effects)
        {
            effect.applyToHTML(node, this);
        }
        return node;
    }

    addFilterPixi(fp)
    {
        this.filtersPixi.push(fp);
    }

    addFilters(fs:string[])
    {
        for(const elem of fs) { this.addFilter(elem); }
    }

    addFilter(f:string)
    {
        this.filters.push(f);
    }

    removeFilter(f:string)
    {
        const idx = this.filters.indexOf(f);
        if(idx < 0) { return; }
        this.filters.splice(idx, 1);
    }

    getFilterString()
    {
        return this.filters.length <= 0 ? "none" : this.filters.join(" ");
    }

    setShadowProperties(ctx:CanvasRenderingContext2D)
    {
        ctx.shadowBlur = 0;
        ctx.shadowColor = "#000000";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if(this.isEmpty()) { return; }
        for(const effect of this.effects)
        {
            effect.applyShadow(ctx);
        }
    }

    needsTemporaryCanvas()
    {
        if(this.isEmpty()) { return false; }
        for(const effect of this.effects)
        {
            if(effect.needsTemporaryCanvas()) { return true; }
        }
        return false;
    }
}