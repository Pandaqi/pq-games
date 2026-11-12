import { Vector2 } from "../../geometry/vector2"
import { Rectangle } from "../../geometry/shapes/rectangle";
import { ResourceShape } from "../resources/resourceShape";
import { LayoutOperation } from "../layoutOperation";
import { BlurEffect } from "../effects/blurEffect";
import { ResourceGroup } from "../resources/resourceGroup";

interface BlurryRectParams
{
    size?: Vector2,
    pos?: Vector2,
    color?: string,
    blur?: number,
    alpha?: number,
    composite?: GlobalCompositeOperation
}

export const drawBlurryRectangle = (params:BlurryRectParams = {}, group:ResourceGroup = null) =>
{
    const rect = new Rectangle({ center: params.pos ?? new Vector2(), extents: params.size});
    const res = new ResourceShape(rect);
    const op = new LayoutOperation({
        fill: params.color ?? "#FFFFFF",
        effects: [new BlurEffect(params.blur ?? 5)],
        alpha: params.alpha ?? 1.0,
        composite: params.composite ?? "source-over"
    });
    if(group) { group.add(res, op); return group; }
    return { res, op };
}