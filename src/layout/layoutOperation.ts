import { Vector2 } from "../geometry/vector2"
import { CanvasLike, ResourceImage } from "../layout/resources/resourceImage"
import { isZero } from "../tools/numbers/checks"
import { ColorLike, ColorLikeValue } from "./color/colorLike"
import { LayoutEffect } from "./effects/layoutEffect"
import { Resource } from "./resources/resource"
import type { ResourceBox } from "./resources/resourceBox"
import { ResourceGroup } from "./resources/resourceGroup"
import { ResourceShape } from "./resources/resourceShape"
import { ResourceText } from "./resources/resourceText"
import { TextBoxMetrics, calculateTextMetrics } from "./text/metrics"
import { TransformationMatrix } from "./tools/transformationMatrix"

import { RendererPandaqi } from "../renderers/pandaqi/rendererPandaqi"
import type { Renderer } from "../renderers/renderer"
import { fitSizeAndKeepRatio } from "../tools/numbers/bounds"
import { Color } from "./color/color"
import { isColorTransparent } from "./color/mixing"
import { StrokeAlign, StrokeType } from "./values"
import { Path } from "../geometry/path"

export type ResourceLike = ResourceImage|ResourceShape|ResourceText|ResourceBox|ResourceGroup
export interface MaskData
{
    resource: ResourceImage,
    operation: LayoutOperation
}

export interface LayoutOperationParams
{
    debug?: boolean,

    fill?:string|ColorLikeValue,
    stroke?:string|ColorLikeValue,
    strokeWidth?:number,
    strokeType?:StrokeType,
    strokeAlign?:StrokeAlign,

    pos?: Vector2,
    position?: Vector2,
    rot?:number,
    rotation?:number,
    scale?:Vector2,
    skew?:Vector2,
    depth?:number

    alpha?:number,
    composite?:GlobalCompositeOperation,

    size?:Vector2,
    sizeAuto?: boolean,

    pivot?:Vector2,
    flipX?:boolean,
    flipY?:boolean,

    clip?:Path,
    clipRelative?: boolean,
    mask?:MaskData,

    resource?:ResourceLike,
    effects?:LayoutEffect[],
    tint?:string|Color,

    frame?:number,
    parentOperation?: LayoutOperation,
    renderer?: Renderer,
    inline?: boolean,
}

export class LayoutOperation
{
    debug = false

    pos : Vector2
    posResult : Vector2 // set dynamically on every apply
    rot : number
    scale : Vector2
    scaleResult : Vector2 // set dynamically on every apply
    skew : Vector2
    depth : number

    alpha : number
    composite : GlobalCompositeOperation

    size : Vector2
    sizeAuto : boolean // fits the resource within the `size` given, maintaining original aspect ratio
    sizeResult : Vector2 // set dynamically on every apply
    pivot : Vector2
    pivotOffset : Vector2 // final calculated offset because of pivot
    flipX : boolean
    flipY : boolean

    clip: Path
    clipRelative : boolean
    mask: MaskData

    resource : ResourceLike
    effects : LayoutEffect[]
    tint : Color
    
    frame: number // frame of image (spritesheets)
    transformResult: TransformationMatrix // set dynamically on every apply
    parentOperation: LayoutOperation
    renderer: Renderer
    inline: boolean // if true, all changes to the context/canvas are temporary as this operation places something "inline" (in the midst of) another operation

    fill: ColorLike
    stroke: ColorLike
    strokeWidth: number
    strokeAlign: StrokeAlign
    strokeType: string

    textMetrics: TextBoxMetrics

    constructor(params:LayoutOperationParams = {})
    {
        this.debug = params.debug;

        this.pos = (params.pos ?? params.position) ?? new Vector2();
        if(!(this.pos instanceof Vector2)) { console.error(`Invalid position ${this.pos} set in LayoutOperation`, this); }

        this.rot = (params.rot ?? params.rotation) ?? 0;
        if(typeof this.rot != "number") { console.error(`Invalid rotation ${this.pos} set in LayoutOperation`, this); }

        this.sizeAuto = params.sizeAuto ?? false;
        this.size = params.size ?? new Vector2();
        if(!(this.size instanceof Vector2)) { console.error(`Invalid size ${this.size} set in LayoutOperation`, this); }

        this.scale = params.scale ?? new Vector2(1,1);
        if(!(this.scale instanceof Vector2)) { console.error(`Invalid scale ${this.scale} set in LayoutOperation`, this); }

        this.pivot = params.pivot ?? Vector2.CENTER;
        if(!(this.pivot instanceof Vector2)) { console.error(`Invalid pivot ${this.pivot} set in LayoutOperation`, this); }

        this.alpha = params.alpha ?? 1.0;
        if(typeof this.alpha != "number") { console.error(`Invalid alpha ${this.alpha} set in LayoutOperation`, this); }

        this.frame = params.frame ?? 0;
        if(typeof this.frame != "number") { console.error(`Invalid frame ${this.frame} set in LayoutOperation`, this); }
    
        this.skew = params.skew ?? new Vector2();
        if(!(this.skew instanceof Vector2)) { console.error(`Invalid skew/shear ${this.skew} set in LayoutOperation`, this); }

        this.depth = params.depth ?? 0.0; // zIndex; @TODO: not supported by RendererPandaqi

        this.flipX = params.flipX ?? false;
        this.flipY = params.flipY ?? false;
        this.composite = params.composite ?? "source-over";

        this.clip = params.clip ?? null;
        this.clipRelative = params.clipRelative ?? false;
        this.mask = params.mask ?? null;

        this.effects = params.effects ?? [];
        const badEffectsInput = this.effects.filter((x) => !(x instanceof LayoutEffect));
        if(badEffectsInput.length > 0) { console.error(`Invalid effect(s) set in LayoutOperation`, badEffectsInput, this); }

        this.fill = new ColorLike(params.fill);
        this.tint = new Color(params.tint);
        this.stroke = new ColorLike(params.stroke);

        this.strokeWidth = params.strokeWidth ?? 0;
        if(typeof this.strokeWidth != "number") { console.error(`Invalid strokeWidth ${this.strokeWidth} set in LayoutOperation`, this); }

        this.strokeType = params.strokeType ?? StrokeType.REGULAR;
        this.strokeAlign = params.strokeAlign ?? StrokeAlign.MIDDLE;

        this.inline = params.inline ?? false;

        this.parentOperation = params.parentOperation ?? null;
        this.resource = params.resource ?? null;
        this.renderer = params.renderer ?? (this.parentOperation ? this.parentOperation.renderer : new RendererPandaqi());
    }

    clone(deep = false)
    {
        const op = new LayoutOperation();
        for(const prop in this)
        {
            let val = this[prop];
            const clonable = (val instanceof Vector2) || (val instanceof Resource)
            // @ts-ignore
            if(deep && clonable) { val = val.clone(); }
            // @ts-ignore
            op[prop] = val;
        }

        op.effects = deep ? this.effects.map((e) => e.clone()) : this.effects;
        return op;
    }

    addEffect(fx:LayoutEffect) { this.effects.push(fx); }
    removeEffect(fx:LayoutEffect) { this.effects.splice(this.effects.indexOf(fx), 1); }

    calculateResultProperties()
    {
        let size = this.size.clone();
        let pos = this.pos.clone();
        let scale = this.scale.clone();

        if(this.flipX) { scale.x *= -1; }
        if(this.flipY) { scale.y *= -1; }
        
        if(this.isShape())
        {
            // used to use calculateBoundingBox which is correct in all cases (just checks all raw points), but also way slower
            // @TODO: check if this change is correct!
            const rawSize = (this.resource as ResourceShape).shape.getDimensions().size;
            size = this.sizeAuto ? fitSizeAndKeepRatio(rawSize, size) : rawSize;

            // it's much easier to just use scale than to implement a proper "scale" function on ALL POSSIBLE SHAPES
            // @TODO: though I guess I could call my scalePath() tool func on any shape's path?
            const scaleFactor = size.x / rawSize.x;
            scale.x *= scaleFactor;
            scale.y *= scaleFactor;
        }

        if(this.isImage())
        {
            if(this.sizeAuto)
            {
                const rawSize = (this.resource as ResourceImage).getSize();
                size = fitSizeAndKeepRatio(rawSize, size);
            }
        }

        if(this.isText())
        {
            const canBeSeen = this.hasFill() || this.hasStroke();
            if(!canBeSeen) { this.setFill(Color.BLACK); }

            let forceSizeAuto = this.sizeAuto;
            if(size.isZero()) { forceSizeAuto = true; }

            const textBoxSizeInitial = forceSizeAuto ? new Vector2(2048, 2048) : size;
            this.textMetrics = calculateTextMetrics(this.resource as ResourceText, textBoxSizeInitial);

            if(forceSizeAuto)
            {
                size = this.textMetrics.dimsFull.getSize();
                size.add(Vector2.ONE); // to prevent silly rounding errors making text boxes JUUUST too small
            }
        }

        pos.round();
        size.round();

        this.posResult = pos;
        this.sizeResult = size;
        this.scaleResult = scale;
        this.transformResult = this.calculateTransformationMatrix();
    }

    calculateTransformationMatrix()
    {
        const trans = this.parentOperation ? this.parentOperation.transformResult.clone() : new TransformationMatrix();
        trans.translate(this.posResult); 
        trans.rotate(this.rot);
        trans.scale(this.scaleResult);

        const pivot = this.pivot.clone();
        if(this.isShape()) { pivot.x -= 0.5; pivot.y -= 0.5; } // EXCEPTION: because all shapes are centered by default instead of top-left like images and such
        if(this.flipX) { pivot.x = 1.0 - pivot.x; }
        if(this.flipY) { pivot.y = 1.0 - pivot.y; }

        const offset = pivot.negate().scale(this.sizeResult);
        this.pivotOffset = offset;
        trans.translate(offset);
        trans.skew(this.skew);
        return trans;
    }

    isGroup() { return this.resource instanceof ResourceGroup; }
    isImage() { return this.resource instanceof ResourceImage; }
    isText() { return this.resource instanceof ResourceText; }
    isShape() { return this.resource instanceof ResourceShape; }

    applyToCanvas(canv:CanvasLike = null) : HTMLCanvasElement
    {   
        this.calculateResultProperties();
        return this.renderer.applyOperationToCanvas(this, canv);
    }

    async applyToHTML(node:HTMLElement, res:Resource = null)
    {
        this.calculateResultProperties();
        return this.renderer.applyOperationToHTML(this, node, res);
    }

    async applyToPixi(app, parent)
    {
        this.calculateResultProperties();
        return this.renderer.applyOperationToPixi(this, app, parent);
    }

    hasFill() { return !this.fill.isTransparent(); }
    hasStroke() { return !this.stroke.isTransparent() && !isZero(this.strokeWidth); }

    /* Handy functions to quickly get operations I usually want */
    setFill(c:string|ColorLikeValue) { this.fill = new ColorLike(c); return this; }
    setStroke(s:string|ColorLikeValue) { this.stroke = new ColorLike(s); return this; }
    setFillAndStroke(c:string|ColorLikeValue, s:string|ColorLikeValue) { this.setFill(c); this.setStroke(s); return this; }
    setOuterStroke(s:string|ColorLikeValue, w:number)
    {
        this.setStroke(s);
        this.strokeWidth = w;
        this.strokeAlign = StrokeAlign.OUTSIDE;
        return this;
    }

    setFillAndStrokeOnContext(ctx:CanvasRenderingContext2D)
    {
        ctx.fillStyle = this.fill.toCanvasStyle(ctx);
        ctx.strokeStyle = this.stroke.toCanvasStyle(ctx);

        let lineWidth = Math.round(this.strokeWidth);
        if(this.strokeAlign != StrokeAlign.MIDDLE) { lineWidth *= 2; }
        ctx.lineWidth = lineWidth;
    }

    applyFillAndStrokeToPath(ctx:CanvasRenderingContext2D, path:Path2D, callback:Function = null)
    {
        const hasFill = this.hasFill();
        const hasStroke = this.hasStroke();

        const strokeBeforeFill = this.strokeAlign == StrokeAlign.OUTSIDE && hasStroke;
        const clipStroke = this.strokeAlign == StrokeAlign.INSIDE && hasStroke;

        if(clipStroke) { ctx.save(); ctx.clip(path); }

        if(strokeBeforeFill) {
            if(hasStroke) { ctx.stroke(path); }
            if(hasFill) { ctx.fill(path); }
            if(callback) { callback(); }
        } else {
            if(hasFill) { ctx.fill(path); }
            if(callback) { callback(); }
            if(hasStroke) { ctx.stroke(path); }
        }

        if(clipStroke) { ctx.restore(); }
    }

    setPivotCenter() { this.pivot = Vector2.CENTER; return this; }
    setPivotTopLeft() { this.pivot = Vector2.ZERO; return this; }
    setPivotBottomRight() { this.pivot = Vector2.ONE; return this; }

    setFrame(f:number) { this.frame = f; return this; }
    hasDepth() { return !isZero(this.depth); }
    hasMask() { return this.mask && this.mask.resource; }
    hasClip() { return this.clip != null; }

    hasTint() { return !isColorTransparent(this.tint); }
    getTint() { return this.hasTint() ? this.tint.toHEXNumber() : 0xFFFFFF; }
}