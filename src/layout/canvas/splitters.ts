import { Vector2 } from "../../geometry/vector2";
import { convertCanvasToImage } from "./converters";
import { createCanvas } from "./creators";

export const getSplitCanvases = (original:HTMLCanvasElement|HTMLImageElement, dims:Vector2, size:Vector2) =>
{
    const cols = dims.x ?? 2;
    const rows = dims.y ?? 2; 
    const totalParts = cols * rows;

    const chunkX = size.x / cols;
    const chunkY = size.y / rows;

    const canvases = [];
    for(var i = 0; i < totalParts; i++) 
    {
        const x = i % cols;
        const y = Math.floor(i / cols);

        const canvasOutput = createCanvas({ size: new Vector2(chunkX, chunkY) });
        
        // MAGIC HAPPENS HERE => this slices part of the image and draws it onto the canvas
        const ctx = canvasOutput.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            original, 
            x*chunkX, y*chunkY, chunkX, chunkY, 
            0, 0, canvasOutput.width, canvasOutput.height
        )

        canvases.push(canvasOutput);
    }
    return canvases;
}

export const splitCanvas = (canvasInput:HTMLCanvasElement, dims:Vector2) =>
{
    const mustSplit = dims.x > 1 || dims.y > 1;
    if(!mustSplit) { return [canvasInput]; }

    return getSplitCanvases(canvasInput, dims, new Vector2(canvasInput.width, canvasInput.height));
}

export const splitImage = async (img:HTMLImageElement, dims:Vector2) : Promise<HTMLImageElement[]> => 
{
    const mustSplit = dims.x > 1 || dims.y > 1;
    if(!mustSplit) { return [img]; }

    const canvases = getSplitCanvases(img, dims, new Vector2(img.naturalWidth, img.naturalHeight));
    const promises = [];
    for(const canvas of canvases)
    {
        promises.push(convertCanvasToImage(canvas));
    }

    return await Promise.all(promises);
}