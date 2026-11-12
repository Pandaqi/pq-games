import { Vector2 } from "../../geometry/vector2";
import { PdfPageConfig } from "./pdfBuilder";

export const PDF_DPI = 300.0;
export const MM_PER_INCH = 25.4;

export enum PageOrientation 
{
    PORTRAIT = "portrait",
    LANDSCAPE = "landscape"
}

// It's crucial these strings are lowercase like this
// Because they are hardcoded in the dropdowns for game settings (setting-pageSize)
export enum PageSize
{
    A4 = "a4",
    A5 = "a5",
    LETTER = "letter"
}

export enum PageSides
{
    SINGLE = "single",
    MIX = "mix", // single-sided, but half the pages are simply empty to allow printing double-sided
    DOUBLE = "double"
}

// Defined in MILLIMETERS as that's the most common way to do so
export const PAGE_SIZES = 
{
    [PageSize.A4]: new Vector2(297, 210),
    [PageSize.A5]: new Vector2(210, 148),
    [PageSize.LETTER]: new Vector2(297, 216) 
}

export const convertPixelsToInches = (p:Vector2) =>
{
    return p.clone().div(PDF_DPI);
}

export const convertInchesToPixels = (p:Vector2) =>
{
    return p.clone().mult(PDF_DPI);
}

export const convertMillimetersToInches = (p:Vector2) =>
{
    return p.clone().div(MM_PER_INCH);
}

export const convertInchesToMillimeters = (p:Vector2) =>
{
    return p.clone().mult(MM_PER_INCH);
}

export const convertMillimetersToPixels = (p:Vector2) =>
{
    return convertInchesToPixels(convertMillimetersToInches(p));
}

export const convertPixelsToMillimeters = (p:Vector2) =>
{
    return convertInchesToMillimeters(convertPixelsToInches(p));
}

export const getSplitDimsAsPoint = (dims:Vector2|string, enabled:boolean = true) =>
{
    if(!enabled) { return new Vector2(1,1); }
    if(!dims) { return new Vector2(1,1); }

    if(dims instanceof Vector2) { return dims; }
    
    const newDimsArray = (dims as string).split("x");
    if(newDimsArray.length != 2) { console.error("Can't split canvas with dimensions: ", dims); return new Vector2(1,1); };
    const newDims = new Vector2(parseInt(newDimsArray[0]), parseInt(newDimsArray[1]));
    if(isNaN(newDims.x) || isNaN(newDims.y)) { console.error("Invalid dimensions for canvas split: ", newDims); return new Vector2(1,1); }
    return newDims;
}

export const makeSizeSplittable = (size:Vector2, splitDims:Vector2|string, splitEnabled = true) =>
{
    const splitDimsSanitized = getSplitDimsAsPoint(splitDims, splitEnabled);
    return size.clone().scale(splitDimsSanitized);
}

export const getPageSizeSingle = (config:PdfPageConfig) =>
{
    const pageFormatSize = PAGE_SIZES[config.pageSize];
    const dims = convertMillimetersToPixels(pageFormatSize.clone());

    if(config.orientation == PageOrientation.LANDSCAPE) { return dims.clone(); } // landscape is the default
    return new Vector2(dims.y, dims.x); // otherwise return the dims flipped to portrait
}

export const getPageSizeSplittable = (config:PdfPageConfig) =>
{
    return makeSizeSplittable(getPageSizeSingle(config), config.splitDims, config.splitEnabled);
}