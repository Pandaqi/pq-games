import { RendererPandaqi } from "../../renderers/pandaqi/rendererPandaqi";
import { createCanvas } from "../canvas/creators";
import { LayoutOperation } from "../layoutOperation";
import { drawTextToCanvas } from "../text/drawing";
import { TextConfig } from "../text/textConfig";
import { Resource } from "./resource";
import { CanvasLike } from "./resourceImage";

interface ResourceTextParams
{
    text?: string
    textConfig?: TextConfig
}

export { ResourceText };
export default class ResourceText extends Resource
{
    text:string
    textConfig:TextConfig

    constructor(params:ResourceTextParams|string = "", cfg:TextConfig = null)
    {
        super()

        if(typeof params == "string")
        {
            this.text = params;
            this.textConfig = cfg ?? new TextConfig();
            return;
        }

        this.text = params.text.toString() ?? "";
        this.textConfig = params.textConfig ?? new TextConfig();
    }
    
    clone(deep = false) : ResourceText
    {
        const tc = deep ? this.textConfig.clone() : this.textConfig
        return new ResourceText({ text: this.text, textConfig: tc });
    }

    /* The `to` functions */
    toCanvas(canv:CanvasLike = null, op:LayoutOperation = null)
    {
        if(canv instanceof CanvasRenderingContext2D) { canv = canv.canvas; }
        op.resource = this;
        op.applyToCanvas(canv);
        return canv;
    }

    async toPixi(app, parent, op = new LayoutOperation())
    {
        op.resource = this;
        return op.applyToPixi(app, parent);
    }

    // we simply draw the text to an empty canvas, then place that as a sprite inside PIXI
    async createPixiObject() {}
    getPixiObject(helpers)
    {
        const operation : LayoutOperation = helpers.layoutOperation.clone();
        const renderer = new RendererPandaqi(); // only that renderer actually does rich text;
        renderer.debugText = helpers.debugText ?? false;
        operation.renderer = renderer

        const canv = createCanvas({ size: operation.size });
        const ctx = canv.getContext("2d");
        operation.setFillAndStrokeOnContext(ctx);
        drawTextToCanvas(canv, operation);
        return new helpers.sprite(helpers.texture.from(canv));
    }

    async toHTML(op:LayoutOperation = null)
    {
        const textNode = document.createElement("span");
        textNode.innerHTML = this.text;
        textNode.style.display = "inline-block";
        this.textConfig.applyToHTML(textNode);
        return textNode;
    }
}