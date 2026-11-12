import { Vector2 } from "../../geometry/vector2";
import { createContext } from "../canvas/creators";
import { LayoutOperation } from "../layoutOperation";
import { convertCanvasToImage } from "../canvas/converters";
import { ResourceImage } from "../resources/resourceImage";

interface PatternizeParams
{
    dims:Vector2|number, // total size
    num:Vector2|number, // number of icons in each direction
    size:Vector2|number, // how much of the available icon space the icon actually takes up (so usually <1.0)
    resource:ResourceImage, // which image to actually draw
    frame?:number, // optional, 0 by default
}

export type { PatternizeParams };
export const patternizeGrid = async (params:PatternizeParams) =>
{
    const dims = new Vector2(params.dims);
    const num = new Vector2(params.num);
    const size = new Vector2(params.size);
    const resourceInput = params.resource;
    const frame = params.frame ?? 0;

    const distBetweenIcons = dims.clone().div(num);
    const iconSize = size.clone().scale(distBetweenIcons);

    const ctx = createContext({ size: new Vector2(dims) });
    for(let x = 0; x < num.x; x++)
    {
        for(let y = 0; y < num.y; y++)
        {
            const pos = new Vector2(x,y).scale(distBetweenIcons);
            const op = new LayoutOperation({
                frame: frame,
                pos: pos,
                size: iconSize,
                pivot: Vector2.CENTER,
            })
            resourceInput.toCanvas(ctx, op);
        }
    }

    const img = await convertCanvasToImage(ctx.canvas);
    const resourceOutput = new ResourceImage(img);
    return resourceOutput;
}