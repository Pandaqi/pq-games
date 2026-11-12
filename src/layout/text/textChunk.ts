import { Vector2 } from "../../geometry/vector2";
import type { TextConfig } from "./textConfig";
import type { ResourceImage } from "../resources/resourceImage";
import { LayoutOperation } from "../layoutOperation";

class TextChunk
{
    getSize(ctx:CanvasRenderingContext2D = null) : Vector2 { return new Vector2(); }
    break() : TextChunk[] { return [this]; }
    isEmptySpace() { return false; }
    isVisible() { return false; }
    isPunctuation() { return false; }
}

const PUNCTUATION = [".", "?", "!", "-", "+"]

class TextChunkText extends TextChunk
{
    text:string

    constructor(txt:string)
    {
        super();
        this.text = txt;
    }

    isVisible() { return !this.isEmptySpace(); }
    isPunctuation() { return PUNCTUATION.includes(this.text); }
    getMetrics(ctx) : TextMetrics
    {
        return ctx.measureText(this.text);
    }

    getSize(ctx)
    {
        const metrics = this.getMetrics(ctx);
        return new Vector2(
            metrics.width,
            Math.abs(metrics.actualBoundingBoxAscent) + Math.abs(metrics.actualBoundingBoxDescent)
        );
    }

    isEmptySpace()
    {
        return this.text.trim().length <= 0;
    }

    break()
    {
        const regex = /\s/g; // cuts on spaces (@TODO: might add hyphens in the future, don't know how to distinguish from minus signs)
        let text = this.text;
        let chunks = [];
        let match;
        do {
            match = regex.exec(text);
            if(!match) { chunks.push(new TextChunkText(text)); break; }

            const key = match[0];
            const idx = match.index;
            let chunkString = (idx == 0) ? key : text.slice(0, idx);
            const newChunk = new TextChunkText(chunkString);
            chunks.push(newChunk);

            text = (idx == 0) ? text.slice(key.length) : text.slice(idx);
        } while (match);
        return chunks;
    }
}

class TextChunkImage extends TextChunk
{
    resource: ResourceImage;
    operation: LayoutOperation;

    constructor(res:ResourceImage)
    {
        super();
        this.resource = res;
    }

    isVisible() { return true; }
    setDims(size:Vector2)
    {
        if(!this.operation) { this.operation = new LayoutOperation(); }
        this.operation.size = size;
    }

    getSize()
    {
        if(!this.operation) { return null; }
        return this.operation.size.clone();
    }
}

class TextChunkBreak extends TextChunk
{

}

class TextChunkStyle extends TextChunk
{
    prop: string
    value: any

    constructor(prop:string, value:any = null)
    {
        super();
        this.prop = prop;
        this.value = value;
    }

    isReset() { return this.value == null; }
    updateTextConfig(tc:TextConfig)
    {
        if(this.isReset()) { tc.rollbackProperty(this.prop); return; }
        tc.updateProperty(this.prop, this.value);
    }
}

export { TextChunk, TextChunkText, TextChunkImage, TextChunkBreak, TextChunkStyle }