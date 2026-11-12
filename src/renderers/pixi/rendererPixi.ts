import { autoDetectRenderer, Assets, Container, Graphics, Sprite, Spritesheet, Texture, WebGPURenderer } from "./pixi.mjs";
import * as PIXIFilters from "./pixi-filters.mjs";
import { ResourceImage } from "../../layout/resources/resourceImage";
import type { ResourceLoadParams } from "../../layout/resources/resourceLoader";
import { Renderer, RendererDrawFinishParams } from "../renderer";
import { ResourceGroup } from "../../layout/resources/resourceGroup";
import { LayoutOperation } from "../../layout/layoutOperation";
import { EffectsOperation } from "../../layout/effects/effectsOperation";
import { ResourceText } from "../../layout/resources/resourceText";
import { ResourceShape } from "../../layout/resources/resourceShape";
import { Color } from "../../layout/color/color";
import { StrokeAlign } from "../../layout/values";

interface RendererPixiParams
{
    bgColor?: string,
    bgAlpha?: number,
    forceWebGPU?: boolean,
}

export class RendererPixi extends Renderer
{
    bgColor: Color;
    bgAlpha:number;
    customBatchSize = 1; // more than that, an average computer might lose the graphics context
    rendererInstance: any;
    forceWebGPU = false

    constructor(params:RendererPixiParams = {})
    {
        super();
        this.bgColor = new Color(params.bgColor ?? "#FFFFFF");
        this.bgAlpha = params.bgAlpha ?? 1;
        this.forceWebGPU = params.forceWebGPU ?? false;
    }

    async cacheLoadedImage(img:HTMLImageElement, params:ResourceLoadParams) : Promise<ResourceImage>
    {
        await img.decode(); // we need this anyway because of text drawing still using non-pixified images ...
        const res = new ResourceImage(img, params);
        await res.createPixiObject({ assets: Assets, sprite: Sprite, spritesheet: Spritesheet });
        return res;
    }

    prepareDraw(cfg:Record<string,any> = {})
    {
        return new ResourceGroup();
    }
    
    async finishDraw(params:RendererDrawFinishParams)
    {
        const initConfig = { 
            width: params.size.x, height: params.size.y, 
            backgroundColor: this.bgColor.toHEXNumber(),
            //antialias: true,
            preference: 'webgpu',
            backgroundAlpha: this.bgAlpha ?? 1,
            useBackBuffer: true,
        };

        let renderer;
        if(this.forceWebGPU) {
            const renderer = new WebGPURenderer(); 
            await renderer.init(initConfig);
        } else {
            renderer = await autoDetectRenderer(initConfig);
        }
        this.rendererInstance = renderer;

        const appRoot = new Container();
        const op = new LayoutOperation({ renderer: this });
        params.group.toPixi(renderer, appRoot, op);
        renderer.render(appRoot);
        const canv = renderer.canvas;
        //renderer.destroy(true);
        return canv;
    }

    async applyOperationToPixi(op:LayoutOperation, app:any, parent:Container)
    {
        // GROUP
        // just call all children to do what they want (they add themselves to us)
        let obj:any;
        let shouldAddObject = true;
        if(op.resource instanceof ResourceGroup)
        {
            obj = new Container();
            parent.addChild(obj);
            shouldAddObject = false;

            const combos = (op.resource as ResourceGroup).combos;
            for(const combo of combos)
            {
                combo.toPixi(app, obj, op);
            }
        }

        // IMAGES
        if(op.resource instanceof ResourceImage)
        {
            obj = op.resource.getPixiObject(op.frame, Sprite);
        }

        // SHAPES / GEOMETRY
        if(op.resource instanceof ResourceShape)
        {
            obj = op.resource.getPixiObject(Graphics);

            if(op.hasFill()) 
            { 
                obj.setFillStyle({ color: op.fill.toNumber() });
                obj.fill(); 
            }

            if(op.hasStroke())
            {
                const alignNum = op.strokeAlign == StrokeAlign.INSIDE ? 1.0 : (op.strokeAlign == StrokeAlign.OUTSIDE ? 0.0 : 0.5);
                obj.setStrokeStyle({ color: op.stroke.toNumber(), width: op.strokeWidth, alignment: alignNum });
                obj.stroke();
            }
        }

        // TEXT (draws on-the-fly to an offscreen canvas, then just returns that as a Sprite)
        if(op.resource instanceof ResourceText)
        {
            obj = op.resource.getPixiObject({ sprite: Sprite, texture: Texture, layoutOperation: op, debugText: this.debugText });
        }

        if(shouldAddObject)
        {
            parent.addChild(obj);
        }

        this.applyToPixiObjectProperties(op, obj);

        return obj;
    }

    applyToPixiObjectProperties(op:LayoutOperation, obj)
    {
        //
        // set all the GENERAL PROPERTIES (which should exist on all/most DisplayObjects)
        //
        obj.position.set(op.posResult.x, op.posResult.y);
        obj.rotation = op.rot;
        obj.zIndex = op.depth;
        
        obj.roundPixels = true;
        obj.tint = op.getTint();
        obj.blendMode = op.composite;
        obj.alpha = op.alpha;

        // PIXI resizes stuff by changing _scale_ (not by setting an absolute size)
        // So we calculate the scaling factor by dividing full size by dims
        // But don't forget to multiple by original operation's scale (which is mostly needed for flipX, flipY stuff)
        const scaleResult = op.scaleResult.clone();
        if(op.resource instanceof ResourceImage)
        {
            const scale = op.sizeResult.clone().div(op.resource.frameSize);
            scaleResult.scale(scale);
        }

        obj.scale.set(scaleResult.x, scaleResult.y);
        obj.skew.set(op.skew.x, op.skew.y);
        
        // @NOTE: obj.pivot is automatically correct now, as it's in local space, and (0,0) = anchor point
        // in the future, I might want to support rotating around a different point; I'll need to rename stuff and add an extra property then
        if(obj.anchor)
        {
            obj.anchor.set(op.pivot.x, op.pivot.y);
        }

        //
        // MASKING (either through graphics object or sprite)
        //
        if(op.clip) {
            obj.mask = new Graphics({}).poly(op.clip.toPathArray(), false).fill(0xFFFFFF);
        } else if(op.mask) {
            obj.mask = op.mask.resource.getPixiObject(0, Sprite);
        }

        //
        // apply all EFFECTS
        //
        const effOp = new EffectsOperation();
        for(const effect of op.effects)
        {
            effect.applyToPixi(PIXIFilters, effOp, obj); // some effects do something directly on object
        }
        obj.filters = effOp.filtersPixi;
    }
}