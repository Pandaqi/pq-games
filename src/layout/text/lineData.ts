import { Vector2 } from "../../geometry/vector2";
import { TextChunk, TextChunkImage, TextChunkText } from "./textChunk";

export class LineData
{
    chunks: TextChunk[]
    size: Vector2
    pos: Vector2
    topLeft: Vector2
    bottomRight: Vector2
    ascent: number
    descent: number
    extraSpaceJustifyX: number

    constructor(pos = new Vector2())
    {
        this.pos = pos;
        this.size = new Vector2();
        this.chunks = [];
        this.ascent = 0;
        this.descent = 0;
        this.topLeft = new Vector2();
        this.bottomRight = new Vector2();
        this.extraSpaceJustifyX = 0;
    }

    hasContent() { return this.chunks.length > 0; }
    getChunks() { return this.chunks.slice(); }
    registerChunk(ctx:CanvasRenderingContext2D, chunk:TextChunk)
    {
        let size = chunk.getSize(ctx);
        let ascent = 0;
        let descent = 0;

        if(chunk instanceof TextChunkText) {
            const metrics = chunk.getMetrics(ctx);
            ascent = Math.abs(metrics.actualBoundingBoxAscent);
            descent = Math.abs(metrics.actualBoundingBoxDescent);

        } else if(chunk instanceof TextChunkImage) {
            ascent = 0.75*size.y;
            descent = 0.25*size.y;
        }

        this.ascent = Math.max(this.ascent, ascent);
        this.descent = Math.max(this.descent, descent);
        this.size.x += size.x;

        this.chunks.push(chunk);
        this.refresh();
    }

    getSize() : Vector2 { return this.size.clone(); }
    getPosition() : Vector2 { return this.pos.clone(); }

    getCenter() : Vector2
    {
        return new Vector2(
            this.topLeft.x + 0.5 * (this.bottomRight.x - this.topLeft.x),
            this.topLeft.y + 0.5 * (this.bottomRight.y - this.topLeft.y)
        );
    }

    updatePosition(pos:Vector2)
    {
        this.pos.move(pos);
        this.refresh();
    }

    refresh()
    {
        this.topLeft = new Vector2(this.pos.x, this.pos.y - this.ascent);
        this.bottomRight = new Vector2(this.pos.x + this.size.x, this.pos.y + this.descent);
        this.size.y = this.ascent + this.descent;
    }

    calculateJustifyX(totalWidth:number)
    {
        let numEmptySpaces = 0;
        for(const chunk of this.chunks)
        {
            if(!chunk.isEmptySpace()) { continue; }
            numEmptySpaces++;
        }

        const sizePerSpace = totalWidth / numEmptySpaces;
        this.extraSpaceJustifyX = sizePerSpace;
    }
}