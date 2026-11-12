import { Vector2 } from "../../geometry/vector2";
import { createContext } from "../canvas/creators";
import { LayoutOperation } from "../layoutOperation";
import type { CanvasLike } from "../resources/resourceImage";
import type { ResourceText } from "../resources/resourceText";
import { StrokeAlign } from "../values";
import { LineData } from "./lineData";
import { calculateTextMetrics, type TextBoxMetrics } from "./metrics";
import { TextChunkImage, TextChunkStyle, TextChunkText } from "./textChunk";
import type { TextConfig } from "./textConfig";
import { hasVisibleLines } from "./tools";

export const drawTextFromResource = (resource:ResourceText) =>
{
    const metrics = calculateTextMetrics(resource);
    const ctx = createContext({ size: metrics.dimsUsed.getSize() });
    const op = new LayoutOperation();
    op.resource = resource;
    drawTextToCanvas(ctx, op);
    return ctx.canvas;
}

export const drawTextToCanvas = (canv:CanvasLike, op:LayoutOperation = new LayoutOperation(), debug = false) =>
{
    const textMetrics = op.textMetrics;
    const config = (op.resource as ResourceText).textConfig;
    if(!hasVisibleLines(textMetrics.lines)) { return; }

    const ctx = (canv instanceof HTMLCanvasElement) ? canv.getContext("2d") : canv;
    const oldTextAlign = ctx.textAlign;
    const oldBaseline = ctx.textBaseline;

    // setting then unsetting at the end is cheaper than a save/restore canvas stack thing
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    drawTextLines(ctx, op, textMetrics.lines, config);
    if(debug) { drawTextDebug(ctx, textMetrics); }

    ctx.textAlign = oldTextAlign;
    ctx.textBaseline = oldBaseline;
}

const drawTextLines = (ctx:CanvasRenderingContext2D, op:LayoutOperation, lines:LineData[], cfg:TextConfig) =>
{
    const style = cfg.clone();
    style.color = op.fill;
    style.applyToCanvas(ctx);

    for(const line of lines)
    {
        let pos = line.getPosition();

        for(const elem of line.getChunks())
        {
            const elemWidth = elem.getSize(ctx).x;

            if(elem instanceof TextChunkText) {
                const text = style.applyTextTransform(elem.text);
                fillAndStrokeText(ctx, text, pos, op);
                pos.x += elemWidth;
                if(elem.isEmptySpace()) { pos.x += line.extraSpaceJustifyX; }
            } else if(elem instanceof TextChunkImage) {
                drawImageChunk(ctx, elem, pos, line, op, cfg);
                pos.x += elemWidth;
            } else if(elem instanceof TextChunkStyle) { 
                elem.updateTextConfig(style); 
                style.applyToCanvas(ctx);
            }
        }
    }
}

export const fillAndStrokeText = (ctx:CanvasRenderingContext2D, txt:string, pos:Vector2, op:LayoutOperation) =>
{
    const strokeBeforeFill = op.strokeAlign == StrokeAlign.OUTSIDE;
    const clipStroke = op.strokeAlign == StrokeAlign.INSIDE;

    // @TODO: Clipping (for the inside stroke) NOT IMPLEMENTED YET
    // Clipping only works for paths, and text is not a path
    // Use secondary image and masking for this!
    // @SOURCE: https://stackoverflow.com/questions/7307430/html-canvas-clipping-and-text

    if(strokeBeforeFill) {
        ctx.strokeText(txt, pos.x, pos.y);
        ctx.fillText(txt, pos.x, pos.y);
    } else {
        ctx.fillText(txt, pos.x, pos.y);
        ctx.strokeText(txt, pos.x, pos.y);
    }
}

const drawImageChunk = (ctx:CanvasRenderingContext2D, elem:TextChunkImage, pos:Vector2, line:LineData, opParent:LayoutOperation, cfg:TextConfig) =>
{
    const res = elem.resource;

    // by attaching a LayoutOperation to the image you can customize its placement/size/everything
    const customOperation = (elem.operation ?? cfg.defaultImageOperation);
    const op = customOperation ? customOperation.clone() : new LayoutOperation();

    // place image at current relative location in text, centered vertically
    const posImage = pos.clone();
    posImage.y = line.getCenter().y;
    posImage.move(op.pos); // take any custom positioning into account
    op.pos = posImage;
    op.pivot = new Vector2(0, 0.5);
    if(op.size.isZero()) { op.size = elem.getSize(); }

    // by giving it the parent operation, 
    // that relative location can now be transformed to the absolute location within the entire canvas
    op.parentOperation = opParent;

    // NOW COMES SOMETHING IMPORTANT
    // we basically apply this operation ... in the middle of applying ANOTHER layout operation; it's an "inline image", this can't be helped
    // layout operations only "reset/save" the state of the canvas when they start to apply themselves
    // as such, after placing this image, the reset mechanism won't reset the state before we continue drawing other text,
    // which is why we need the `inline` property to tell the LayoutOperation that these changes are temporary and should be forgotten
    op.inline = true;

    // now draw the image at the right size+location
    // (and, as explained, forget about our changes afterwards so the rest of the text continues at the proper settings/location)
    res.toCanvas(ctx, op);
}

const drawTextDebug = (ctx:CanvasRenderingContext2D, metrics:TextBoxMetrics) =>
{
    // Full TextBox Size
    ctx.lineWidth = 3
    ctx.strokeStyle = '#00FF00'
    ctx.strokeRect(
        metrics.dimsFull.position.x, metrics.dimsFull.position.y, 
        metrics.dimsFull.size.x, metrics.dimsFull.size.y
    )

    // Used Textbox Size (only visible text, no empty space)
    ctx.lineWidth = 2
    ctx.strokeStyle = '#FF0000'
    ctx.strokeRect(
        metrics.dimsUsed.position.x, metrics.dimsUsed.position.y, 
        metrics.dimsUsed.size.x, metrics.dimsUsed.size.y
    )
}

