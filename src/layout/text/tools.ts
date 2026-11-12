import { Vector2 } from "../../geometry/vector2";
import { TextConfig } from ".";
import { LineData } from "./lineData";
import { TextChunk, TextChunkBreak, TextChunkImage } from "./textChunk";

export const toTextDrawerImageStrings = (dict:Record<string,any>, resourceKey = "misc", frameKey = "frame") =>
{
    const arr = [];
    for(const [key,data] of Object.entries(dict))
    {
        arr.push('<img id="' + resourceKey + '" frame="' + data[frameKey] + '">');
    }
    return arr;
}

export const hasVisibleText = (txt) =>
{
    if(Array.isArray(txt)) { return lineHasVisibleContent(txt); }
    return txt.trim().length > 0;
}

export const hasVisibleLines = (lines:LineData[]) =>
{
    if(lines.length <= 0) { return false; }
    if(!lineHasVisibleContent(lines[0].chunks)) { return false; }
    return true;
}

export const lineHasVisibleContent = (list:TextChunk[]) =>
{
    for(const elem of list)
    {
        if(elem.isVisible()) { return true; }
    }
    return false;
}

export const getPathToVisibleContent = (list:TextChunk[], dir = "prev", fromElem = null) =>
{
    const arr = [];
    let startIndex = list.length - 1;
    if(fromElem) { startIndex = list.indexOf(fromElem); }

    let foundSomething = false;
    if(dir == "prev") {
        for(let i = startIndex; i >= 0; i--)
        {
            arr.push(list[i]);
            if(list[i].isVisible()) { foundSomething = true; break; }
        }
        if(foundSomething) { return arr.reverse(); }
    } else if(dir == "next") {
        for(let i = startIndex + 1; i < list.length; i++)
        {
            arr.push(list[i]);
            if(list[i].isVisible()) { foundSomething = true; break; }
        }
        if(foundSomething) { return arr; }
    }

    return [];
}

export const moveLineBreak = (list:TextChunk[], br:TextChunkBreak, beforeElem:TextChunk) =>
{
    const breakIndex = list.indexOf(br);
    list.splice(breakIndex, 1); // remove from original position

    const idx = list.indexOf(beforeElem);
    list.splice(idx, 0, br); // insert before elem
}

// Used to determine how to scale images inline with text, based on text fontSize/lineHeight
export const getDefaultInlineImageSize = (elem:TextChunkImage, style:TextConfig, textConfigGlobal:TextConfig) =>
{
    const sizeY = style.size * textConfigGlobal.heightToSizeRatio;
    const sizeX = elem.resource.getSizeKeepRatio(sizeY, "y");
    return new Vector2(sizeX, sizeY);
}

export const HAIR_SPACE = '\u200a'

export const getTextHeightOnCanvas = (ctx:CanvasRenderingContext2D, text:string, style:string) =>
{
    ctx.save();
    ctx.textBaseline = 'bottom'
    ctx.font = style
    const height = ctx.measureText(text).actualBoundingBoxAscent
    ctx.restore();

    return height
}

// Modifies a _string_ to add specific space characters between words, such that total length equals the line width
export const justifyLine = (ctx:CanvasRenderingContext2D, line:string, spaceWidth:number, width:number) =>
{
    const text = line.trim()
    const lineWidth = ctx.measureText(text).width

    const nbSpaces = text.split(/\s+/).length - 1
    const nbSpacesToInsert = Math.floor((width - lineWidth) / spaceWidth)

    if (nbSpaces <= 0 || nbSpacesToInsert <= 0) return text

    // We insert at least nbSpacesMinimum and we add extraSpaces to the first words
    const nbSpacesMinimum = Math.floor(nbSpacesToInsert / nbSpaces)
    let extraSpaces = nbSpacesToInsert - nbSpaces * nbSpacesMinimum

    const spaceChar = HAIR_SPACE;
    let spaces = [].fill(spaceChar, 0, nbSpacesMinimum);
    let spacesString = spaces.join('')

    const justifiedText = text.replace(/\s+/g, (match:string) => {
        const allSpaces = extraSpaces > 0 ? spacesString + spaceChar : spacesString
        extraSpaces--
        return match + allSpaces
    })

    return justifiedText
}