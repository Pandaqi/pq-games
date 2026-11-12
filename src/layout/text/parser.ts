import { TextChunk, TextChunkBreak, TextChunkImage, TextChunkStyle, TextChunkText } from "./textChunk";
import { TextWeight, TextStyle, TextVariant, TextConfig, TextTransform, TextAnchor } from "./textConfig";
import { getDefaultInlineImageSize, getPathToVisibleContent, lineHasVisibleContent, moveLineBreak } from "./tools";

export const parseTextString = (text:string, config:TextConfig) =>
{
    // line breaks, bold, italic, images, other rich text formatting
    const regexFormatting = /\n|<b>|<\/b>|<em>|<\/em>|<i>|<\/i>|<sc>|<\/sc>|<img id="(.+?)" frame="(.+?)">|<size num="(.+?)">|<\/size>|<font id="(.+?)">|<\/font>|<col hex="(.+?)">|<\/col>|<upper>|<\/upper>|<lower>|<\/lower>|<sup>|<\/sup>|<sub>|<\/sub>/g; 
    const regexFlat = /\n/g;
    const regex = config.format ? regexFormatting : regexFlat;

    let tempText = text;
    let chunks = [];
    let match;
    do {
        match = regex.exec(tempText);
        // This is the crucial line! The regex is a _state_, so it remembers the last match and will only check from THAT POINT, unless we reset it.
        regex.lastIndex = 0; 
        if(!match) { chunks.push(new TextChunkText(tempText)); break; }

        const key = match[0];
        const idx = match.index;

        // if it's not the first thing, then we've passed some text before it; register that first
        const hasTextBefore = (idx > 0);
        if(hasTextBefore)
        {
            const textBefore = tempText.slice(0, idx);
            chunks.push(new TextChunkText(textBefore));
            tempText = tempText.slice(idx);
            continue;
        }

        let newChunks;
        if(key == "<b>") { newChunks = new TextChunkStyle("weight", TextWeight.BOLD); }
        else if(key == "</b>") { newChunks = new TextChunkStyle("weight"); }
        else if(key == "<em>" || key == "<i>") { newChunks = new TextChunkStyle("style", TextStyle.ITALIC); }
        else if(key == "</em>" || key == "</i>") { newChunks = new TextChunkStyle("style"); }
        else if(key == "<upper>") { newChunks = new TextChunkStyle("transform", TextTransform.UPPERCASE); } 
        else if(key == "</upper>") { newChunks = new TextChunkStyle("transform"); } 
        else if(key == "<lower>") { newChunks = new TextChunkStyle("transform", TextTransform.LOWERCASE); } 
        else if(key == "</lower>") { newChunks = new TextChunkStyle("transform"); } 
        else if(key == "<sup>") { newChunks = [new TextChunkStyle("anchor", TextAnchor.BOTTOM), new TextChunkStyle("size", config.size*0.66)]; } 
        else if(key == "</sup>") { newChunks = [new TextChunkStyle("size"), new TextChunkStyle("anchor")]; } 
        else if(key == "<sub>") { newChunks = [new TextChunkStyle("anchor", TextAnchor.TOP), new TextChunkStyle("size", config.size*0.66)]; } 
        else if(key == "</sub>") { newChunks = [new TextChunkStyle("size"), new TextChunkStyle("anchor")]; } 
        else if(key == "<sc>") { newChunks = new TextChunkStyle("variant", TextVariant.SMALLCAPS); }
        else if(key == "</sc>") { newChunks = new TextChunkStyle("variant"); }
        else if(key == "\n") { newChunks = new TextChunkBreak(); }
        else if(key.includes("<img")) {
            const resLoader = config.resLoader;
            const frame = parseInt(match[2]) ?? 0;
            const res = resLoader.getResource(match[1]).getImageFrameAsResource(frame);
            newChunks = new TextChunkImage(res);
        } else if(key.includes("<size")) {
            newChunks = new TextChunkStyle("size", parseFloat(match[3]));
        } else if(key == "</size>") {
            newChunks = new TextChunkStyle("size");
        } else if(key.includes("<col")) {
            // The matches are indexed for the WHOLE regex! 
            // So to get a specific capture group, I need to check its position in the WHOLE thing, not just the actual string matched
            newChunks = new TextChunkStyle("color", match[5]);
        } else if(key == "</col>") {
            newChunks = new TextChunkStyle("color");
        } else if(key.includes("<font")) {
            newChunks = new TextChunkStyle("font", match[4]);
        } else if(key == "</font>") {
            newChunks = new TextChunkStyle("font");
        }

        tempText = tempText.slice(key.length);
        if(!Array.isArray(newChunks)) { newChunks = newChunks; }
        chunks.push(...newChunks);
        
    } while (match);

    return chunks;
}

const MIN_SIZE_LAST_LINE = 4; // if possible, tries to prevent typography widows/orphans

// Parsing has two stages
// - If our input is a string, parse it into TextChunk types
// - When we have our chunks, add line breaks wherever needed for wrapping
export const parseText = (text:string|TextChunk[], textConfig:TextConfig, boxWidth:number, ctx:CanvasRenderingContext2D) : TextChunk[] =>
{
    // a much quicker shortcut if your text requirements are simple
    const executeSimpleParse = (typeof text === "string") && !textConfig.wrap && !textConfig.format;
    if(executeSimpleParse) { return [new TextChunkText(text)]; }

    const input : TextChunk[] = Array.isArray(text) ? text : parseTextString(text, textConfig);

    // break all text chunks into individual words and spaces
    for(let i = 0; i < input.length; i++)
    {
        if(!(input[i] instanceof TextChunkText)) { continue; }
        const chunks = input[i].break();
        input.splice(i, 1, ...chunks);
    }

    const output = []; 

    const style = textConfig.clone();
    style.applyToCanvas(ctx);

    let curLine = [];
    let curLineWidth = 0;

    for(const elem of input)
    {
        let elemSize = elem.getSize(ctx);
        if(elem instanceof TextChunkImage && !elemSize) 
        { 
            elem.setDims(getDefaultInlineImageSize(elem, style, textConfig)); 
            elemSize = elem.getSize();
        }

        // empty spaces at the start of a line are pointless, remove them
        if(elem.isEmptySpace() && !lineHasVisibleContent(curLine)) { continue; }

        // gather data about what happened before us (mostly line break)
        const pathPrev = getPathToVisibleContent(output, "prev");
        let lineBreakBefore = null;
        for(const elem of pathPrev)
        {
            if(elem instanceof TextChunkBreak) { lineBreakBefore = elem; }
        }
        const hasLineBreakBefore = (lineBreakBefore != null);

        // keep punctuation together with what came before, instead of splitting with line break
        const pathNext = getPathToVisibleContent(input, "next", elem);
        if(elem.isPunctuation() && hasLineBreakBefore)
        {
            moveLineBreak(output, lineBreakBefore, pathPrev[0]);
        }
                    
        const elemWidth = elemSize.x;
        const newLineWidth = curLineWidth + elemWidth;
        curLineWidth = newLineWidth;

        // if this element is the last visible one, but the line is too short, move line break to earlier spot
        const minSizeLastLine = MIN_SIZE_LAST_LINE * style.size;
        const tooSmallForOwnLine = elem.isVisible() && newLineWidth <= minSizeLastLine && !pathNext;
        if(tooSmallForOwnLine)
        {
            moveLineBreak(output, lineBreakBefore, pathPrev[0]);
        }

        // if we don't wrap, then we just pretend everything always fits on the line!
        const fitsOnLine = textConfig.wrap ? (newLineWidth <= boxWidth) : true;
        if(elem instanceof TextChunkStyle) { elem.updateTextConfig(style); style.applyToCanvas(ctx); }
        if(elem instanceof TextChunkBreak || !fitsOnLine) 
        { 
            if(!fitsOnLine) { output.push(new TextChunkBreak()); }
            curLine = []; 
            curLineWidth = elemWidth;
        }

        curLine.push(elem);
        output.push(elem);
    }

    return output;
}