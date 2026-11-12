import { Dims } from "../../geometry/dims"
import { Vector2 } from "../../geometry/vector2"
import { createContext } from "../canvas/creators"
import { ResourceText } from "../resources/resourceText"
import { LineData } from "./lineData"
import { parseText } from "./parser"
import { TextChunk, TextChunkBreak, TextChunkStyle } from "./textChunk"
import { TextAlign } from "./textConfig"
import { hasVisibleText } from "./tools"

export interface TextBoxMetrics
{
    dimsFull: Dims, // the full dimensions of the text box (including empty space if centered within, for example)
    dimsUsed: Dims, // a box around the actual visible text and nothing else
    textParsed: TextChunk[],
    lines: LineData[],
}

// if no size set, we need a really huge canvas to make sure whatever we draw will likely fit so it can be measured
const DEFAULT_SIZE = new Vector2(2048, 2048); 

export const calculateTextMetrics = (resource:ResourceText, size:Vector2 = DEFAULT_SIZE, offset:Vector2 = Vector2.ZERO) =>
{
    const ctx = createContext({ size: size });
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    const cfg = resource.textConfig;
    const textParsed = parseText(resource.text, cfg, size.x, ctx);

    if(!hasVisibleText(textParsed)) { return; }

    const xStart = offset.x;
    const yStart = offset.y;
    const boxWidth = size.x;
    const boxHeight = size.y;
    const xEnd = xStart + boxWidth;
    const yEnd = yStart + boxHeight;

    //
    // first, collect the dimensions of each individual LINE
    //
    let lineData = new LineData();
    const lines : LineData[] = [];

    const fixedLineHeight = (cfg.lineHeight * cfg.size)

    const style = cfg.clone();
    style.applyToCanvas(ctx);

    let tempY = 0;
    for(const elem of textParsed)
    {
        if(elem instanceof TextChunkBreak)
        {
            lines.push(lineData);
            const dynamicLineHeight = lineData.getSize().y;
            tempY += cfg.useDynamicLineHeight ? dynamicLineHeight : fixedLineHeight;

            lineData = new LineData(new Vector2(0, tempY));
            continue;
        }

        if(elem instanceof TextChunkStyle) 
        { 
            elem.updateTextConfig(style); 
            style.applyToCanvas(ctx);
        }

        lineData.registerChunk(ctx, elem); // refresh a correct topLeft and bottomRight
    }

    if(lineData.hasContent()) { lines.push(lineData); }

    //
    // second, combine all those dimensions into total size of the text block
    //
    const topLeftTotal = new Vector2(Infinity, Infinity);
    const bottomRightTotal = new Vector2(-Infinity, -Infinity);

    for(const line of lines)
    {
        topLeftTotal.x = Math.min(topLeftTotal.x, line.topLeft.x);
        topLeftTotal.y = Math.min(topLeftTotal.y, line.topLeft.y);
        bottomRightTotal.x = Math.max(bottomRightTotal.x, line.bottomRight.x);
        bottomRightTotal.y = Math.max(bottomRightTotal.y, line.bottomRight.y);
    }

    const textDims = new Dims(
        topLeftTotal.x,
        topLeftTotal.y,
        (bottomRightTotal.x - topLeftTotal.x),
        (bottomRightTotal.y - topLeftTotal.y)
    );

    if(cfg.useSimpleDims)
    {
        const numLines = lines.length;
        const simpleHeight = fixedLineHeight * numLines;
        textDims.setSize(new Vector2(textDims.size.x, simpleHeight));
    }

    const realWidth = textDims.size.x;
    const realHeight = textDims.size.y;

    const tooHigh = (realHeight > boxHeight);
    if(tooHigh)
    {
        console.error("Textbox overflows on Y-axis!", boxHeight, realHeight, textParsed);
        textDims.size.y = Math.min(textDims.size.y, boxHeight);
    }

    const tooWide = (realWidth > boxWidth);
    if(tooWide)
    {
        console.error("Textbox overflows on X-axis!", boxWidth, realWidth, textParsed);
        textDims.size.x = Math.min(textDims.size.x, boxHeight);
    }

    //
    // third, use all that information for proper aligning
    //

    const alignH = cfg.alignHorizontal;
    const alignV = cfg.alignVertical;

    let yOffset;
    if (alignV === TextAlign.START || alignV == TextAlign.JUSTIFY) { yOffset = yStart + lines[0].ascent; }
    else if (alignV === TextAlign.END) { yOffset = yEnd - realHeight + lines[0].ascent; }
    else if(alignV == TextAlign.MIDDLE) { yOffset = yStart + 0.5 * (boxHeight - realHeight) + lines[0].ascent; }

    const justifyY = (alignV == TextAlign.JUSTIFY);
    let extraJustifyOffsetY = 0;
    if(justifyY && lines.length > 0)
    {
        const spaceLeftY = boxHeight - realHeight;
        const numSubdivisions = lines.length - 1;
        extraJustifyOffsetY = spaceLeftY / numSubdivisions;
    }

    const justifyX = (alignH == TextAlign.JUSTIFY);
    for(const line of lines)
    {
        let xOffset;
        if(alignH == TextAlign.START || alignH == TextAlign.JUSTIFY) { xOffset = xStart; }
        else if(alignH == TextAlign.END) { xOffset = xEnd - line.getSize().x; }
        else if(alignH == TextAlign.MIDDLE) { xOffset = xStart + 0.5*(xEnd - line.getSize().x); }

        if(justifyX) { line.calculateJustifyX(boxWidth); }

        line.updatePosition(new Vector2(xOffset, yOffset));
        yOffset += extraJustifyOffsetY;
    }

    // return all the final metrics we found
    return {
        dimsFull: textDims.clone(),
        dimsUsed: textDims.clone().move(new Vector2(0, lines[0].getPosition().y)),
        textParsed: textParsed,
        lines: lines
    }
}