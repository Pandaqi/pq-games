import type { Vector2 } from "../geometry/vector2";
import type { ResourceGroup } from "../layout/resources/resourceGroup";
import { ResourceImage, CanvasLike } from "../layout/resources/resourceImage";
import type { ResourceLoadParams } from "../layout/resources/resourceLoader";
import type { LayoutOperation } from "../layout/layoutOperation";
import type { Resource } from "../layout/resources/resource";

interface RendererDrawFinishParams
{
    size?: Vector2,
    group?: ResourceGroup,
    canvas?: HTMLCanvasElement
}

export { RendererDrawFinishParams }
export class Renderer
{
    debugLayoutOperation = false;
    debugText = false;
    customBatchSize: number = null;

    async cacheLoadedImage(img:HTMLImageElement, params:ResourceLoadParams) : Promise<ResourceImage>
    {
        return new ResourceImage(img, params);
    }

    prepareDraw(cfg:Record<string,any> = {}) : any {}
    async startDraw(cfg:Record<string,any> = {}) {}
    async finishDraw(params:RendererDrawFinishParams) : Promise<HTMLCanvasElement>
    {
        return document.createElement("canvas");
    }

    applyOperationToCanvas(op:LayoutOperation, canv:CanvasLike) : HTMLCanvasElement
    {
        return document.createElement("canvas");
    }

    async applyOperationToHTML(op:LayoutOperation, node:HTMLElement, res:Resource = null) : Promise<HTMLElement>
    {
        return document.createElement("div");
    }

    async applyOperationToPixi(op:LayoutOperation, app:any, parent:any) : Promise<any> {}
}