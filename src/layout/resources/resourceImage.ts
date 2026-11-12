import { convertCanvasToImage, convertCanvasToImageMultiple } from "../../layout/canvas/converters"
import { LayoutOperation } from "../layoutOperation"
import { Vector2 } from "../../geometry/vector2"
import { Resource } from "./resource"
//import ResourceGradient from "./resourceGradient"
//import ResourcePattern from "./resourcePattern"

import { getPixiAtlasData } from "../../renderers/pixi/getPixiAtlasData"
import { createContext } from "../canvas/creators"
import { ResourceLoader } from "./resourceLoader"
import { ResourceText } from "./resourceText"
import { drawTextFromResource } from "../text/drawing"

type ImageLike = HTMLImageElement|ResourceImage//|ResourceGradient|ResourcePattern
type CanvasLike = HTMLCanvasElement|CanvasRenderingContext2D
type DrawableData = HTMLImageElement|HTMLCanvasElement;
type FrameSet = HTMLImageElement[];

interface FrameData {
    xIndex: number,
    yIndex: number,
    x: number,
    y: number,
    width: number,
    height: number
}

interface ResourceImageParams
{
    numThumbnails?: number,
    frames?: Vector2,
    uniqueKey?: string,
}

export { CanvasLike, ImageLike }
export class ResourceImage extends Resource
{
    img : HTMLImageElement;
    canv : HTMLCanvasElement;
    size : Vector2; // can't be set from outside, calculated internally
    frameDims : Vector2;
    frameSize : Vector2;
    frame: number;
    frames : (DrawableData)[];

    thumbnails: FrameSet[];
    numThumbnails : number; // how many smaller thumbnails we should cache for each frame (e.g. a 1024x1024 also saves a 512x512 if set to 1)
    uniqueKey:string
    pixiObject:any;

    constructor(imageData : DrawableData = null, params:ResourceImageParams = {})
    {
        super()

        this.frames = [];
        this.thumbnails = [];
        this.numThumbnails = params.numThumbnails ?? 0;
        this.frameDims = new Vector2();
        this.uniqueKey = params.uniqueKey;

        if(imageData) { this.fromRawDrawable(imageData, params); }
    }
    
    clone(deep = false) : ResourceImage
    {
        const img = new ResourceImage();
        img.fromResourceImage(this, deep);
        return img;
    }

    isImageElement() { return this.img instanceof HTMLImageElement; }
    isCanvasElement() { return this.canv instanceof HTMLCanvasElement; }
    hasDrawableData() { return this.isImageElement() || this.isCanvasElement(); }

    /* The `to` functions */
    toCanvas(canv:CanvasLike = null, op:LayoutOperation = new LayoutOperation())
    {
        if(op.size.isZero()) { op.size = this.getSize(); }
        op.resource = this;
        op.frame = op.frame ?? this.frame;
        return op.applyToCanvas(canv);
    }

    toHTMLElement(frame = 0)
    {
        const img = document.createElement("img");
        img.src = this.getImageFrameAsResource(frame).getSRCString();
        return img;
    }

    async toHTML(op:LayoutOperation = new LayoutOperation())
    {
        const frame = op.frame ?? 0;
        const img =  this.toHTMLElement(frame);
        img.style.width = "100%";
        img.style.height = "100%";
        return await op.applyToHTML(img);
    }

    async toPixi(app, parent, op:LayoutOperation = new LayoutOperation())
    {
        if(op.size.isZero()) { op.size = this.getSize(); }
        op.resource = this;
        op.frame = op.frame ?? this.frame;
        return await op.applyToPixi(app, parent);
    }

    getPixiObject(frame:number, spriteConstructor = null) 
    { 
        if(this.isSingleFrame()) { return spriteConstructor.from(this.pixiObject); }
        return this.getImageFrameAsPixiObject(frame, spriteConstructor); 
    }

    async createPixiObject(helpers:Record<string,any> = {})
    {
        const filePath = this.getSRCString();
        const tex = await helpers.assets.load(filePath);
        if(this.isSingleFrame())
        {
            this.pixiObject = tex;
            return;
        }

        const atlasData = getPixiAtlasData(this);
        const spritesheet = new helpers.spritesheet(tex, atlasData);
        await spritesheet.parse();
        this.pixiObject = spritesheet;
    }

    getImageFrameAsPixiObject(frame:number, spriteConstructor)
    {   
        return spriteConstructor.from(this.pixiObject.textures["frame_" + frame]);
    }

    // for getting a new ResourceImage with result after operation applied
    async toResourceImage(op = new LayoutOperation())
    {
        return new ResourceImage(this.toCanvas(null, op));
    }

    // translation between IMAGE and CANVAS representation
    toResourceImageCanvas() : ResourceImage
    {
        const res = this.clone();
        if(!this.isCanvasElement())
        {
            const ctx = createContext({ size: this.size });
            ctx.drawImage(this.getImage(), 0, 0);
            res.fromRawDrawable(ctx.canvas);
        }
        return res;
    }

    /* The `from` functions */
    fromResourceImage(r:ResourceImage, deep = false)
    {
        this.fromRawDrawable(r.getImage());
        this.size = deep ? r.size.clone() : r.size;
        this.frameDims = deep ? r.frameDims.clone() : r.frameDims;
        this.frames = deep ? r.frames.slice() : r.frames;
        this.refreshSize();
    }

    fromRawDrawable(img:DrawableData, params:ResourceImageParams = {})
    {
        if(img instanceof HTMLImageElement) { this.img = img; this.canv = null; }
        else if(img instanceof HTMLCanvasElement) { this.canv = img; this.img = null; }
        this.frameDims = new Vector2(params.frames ?? new Vector2(1,1));
        this.frames = this.isSingleFrame() ? [this.getImage()] : [];
        this.refreshSize();
    }

    async fromSVG(elem:SVGImageElement)
    {
        const resLoader = new ResourceLoader();
        // @ts-ignore
        resLoader.planLoad("svg_embedded_image", { path: elem.href });
        await resLoader.loadPlannedResources();
        const imgRes = resLoader.getResource("svg_embedded_image");
        this.fromResourceImage(imgRes);
    }

    async fromCanvas(canv:HTMLCanvasElement)
    {
        this.img = await convertCanvasToImage(canv);
        this.refreshSize();
        await this.cacheFrames();
        return this;
    }

    fromPath(path:string, params:ResourceImageParams = {})
    {
        const img = document.createElement("img");
        img.src = path;
        this.fromRawDrawable(img, params);
        return this;
    }

    async fromText(text:ResourceText)
    {
        const canv = drawTextFromResource(text);
        this.fromRawDrawable(canv);
        return this
    }

    /* Helpers & Tools */
    refreshSize()
    {
        if(!this.hasDrawableData()) { return; }

        if(this.isImageElement()) { this.size = new Vector2(this.img.naturalWidth, this.img.naturalHeight); }
        else if(this.isCanvasElement()) { this.size = new Vector2(this.canv.width, this.canv.height); }

        this.frameSize = new Vector2(
            this.size.x / this.frameDims.x,
            this.size.y / this.frameDims.y
        )
    }

    async calculateThumbnails(num:number, mask:number[] = [])
    {
        this.numThumbnails = num;
        await this.cacheThumbnails(mask);
    }

    async cacheThumbnails(mask:number[] = [])
    {
        if(this.numThumbnails <= 0) { return; }

        const num = this.numThumbnails;
        for(let i = 0; i < this.frames.length; i++)
        {
            if(mask.length > 0 && !mask.includes(i)) { continue; }

            const data = this.getFrameData(i);
            const size = new Vector2(data.width, data.height );

            const canvases = [];
            for(let t = 0; t < num; t++)
            {
                size.div(2);
                const ctx = createContext({ size: size });
                ctx.drawImage(
                    this.img, 
                    data.x, data.y, data.width, data.height, 
                    0, 0, size.x, size.y
                )
                canvases[t] = ctx.canvas;
            }

            if(this.isCanvasElement()) { this.thumbnails[i] = canvases; }
            else if(this.isImageElement()) { this.thumbnails[i] = await convertCanvasToImageMultiple(canvases, true); }
        }
    }

    uncacheFrames() { this.frames = []; }
    async cacheFrames()
    {
        const canvases = [];
        for(let x = 0; x < this.frameDims.x; x++)
        {
            for(let y = 0; y < this.frameDims.y; y++)
            {
                const frame = x + y*this.frameDims.x;
                const data = this.getFrameData(frame);
                const size = new Vector2(data.width, data.height);

                const ctx = createContext({ size: size });
                ctx.drawImage(
                    this.img, 
                    data.x, data.y, data.width, data.height, 
                    0, 0, size.x, size.y
                )
                canvases[frame] = ctx.canvas;
            }
        }

        if(this.isCanvasElement()) { this.frames = canvases; }
        else if(this.isImageElement()) { this.frames = await convertCanvasToImageMultiple(canvases, true); }

        await this.cacheThumbnails();
    }

    getFrameData(frm:number = 0) : FrameData
    {
        const frameVec = new Vector2().setXY(
            frm % this.frameDims.x,
            Math.floor(frm / this.frameDims.x)
        )

        return {
            xIndex: frameVec.x,
            yIndex: frameVec.y,
            x: frameVec.x * this.frameSize.x,
            y: frameVec.y * this.frameSize.y,
            width: this.frameSize.x,
            height: this.frameSize.y 
        }
    }

    getSRCString() : string
    {
        if(this.isCanvasElement()) { return (this.getImage() as HTMLCanvasElement).toDataURL(); }
        else if(this.isImageElement()) { return (this.getImage() as HTMLImageElement).src; }
    }

    getCSSUrl() : string
    {
        return "url(" + this.getSRCString() + ")";
    }

    // Ratio is always X:Y (so 2 means twice as WIDE as it is TALL, as it's 2:1)
    getRatio() : number
    {
        return this.frameSize.x / this.frameSize.y
    }

    getSizeKeepRatio(size:number, axisGiven:string = "x")
    {
        const ratio = this.getRatio();
        if(axisGiven == "x") { return size / ratio; }
        else if(axisGiven == "y") { return size * ratio; }
        return size;
    }

    getSize() : Vector2
    {
        if(!(this.size instanceof Vector2)) { this.refreshSize(); }
        return this.size.clone();
    }

    getImage() : DrawableData
    { 
        return this.img ?? this.canv;
    }

    getImageFrameAsResource(num:number, desiredSize:Vector2 = null) : ResourceImage
    {
        const img = this.getImageFrame(num, desiredSize);
        return new ResourceImage(img);
    }

    hasFrameInCache(num:number) 
    { 
        return num < this.frames.length && this.frames[num];
    }

    missingFrames()
    {
        return this.frames.length < this.frameDims.x*this.frameDims.y;
    }

    getImageFrame(num:number, desiredSize:Vector2 = null) : DrawableData
    {
        const frameNotCached = !this.hasFrameInCache(num);
        if(frameNotCached)
        {
            // cut it out on the fly
            const data = this.getFrameData(num);
            const canv = document.createElement("canvas");
            canv.width = data.width;
            canv.height = data.height;
            const ctx = canv.getContext("2d");
            ctx.drawImage(this.getImage(),
                data.x, data.y, data.width, data.height, 
                0, 0, canv.width, canv.height);

            // resize frames array to hold it
            const newLength = Math.max(this.frames.length, num + 1);
            this.frames.length = newLength; // cheapest way to resize
            this.frames[num] = ctx.canvas;
            return ctx.canvas;
        }

        const maxSize = this.frameDims.clone();
        let thumbIndex = 0;
        if(desiredSize)
        {
            // find the smallest thumbnail that's still large enough
            // the value 0 is reserved for "original image" ( = "don't use thumbnail at all")
            for(let i = 1; i < this.thumbnails.length + 1; i++)
            {
                maxSize.div(2);
                const becomeTooSmall = maxSize.x < desiredSize.x || maxSize.y < desiredSize.y;
                if(becomeTooSmall) { break; }
                thumbIndex = i;
            }
        }

        if(thumbIndex <= 0) { return this.frames[num]; }
        return this.thumbnails[num][thumbIndex];
    }

    isSingleFrame()
    {
        return this.countFrames() == 1;
    }

    countFramesRaw() : number
    {
        return frames.length;
    }

    countFrames() : number
    {
        return this.frameDims.x * this.frameDims.y;
    }

    getFrame() : number
    {
        return this.frame;
    }

    setFrame(f:number)
    {
        this.frame = f;
        return this;
    }

    swapImage(img:DrawableData)
    {
        this.fromRawDrawable(img);
        return this;
    }

    async addFrame(img:DrawableData)
    {
        this.frames.push(img);
        this.frameDims.x += 1;
        if(this.frameDims.y <= 0) { this.frameDims.y = 1; }
        this.refreshSize();
        await this.cacheThumbnails([this.countFrames()]);
    }

    async addFrames(imgs:DrawableData[])
    {
        for(const img of imgs)
        {
            await this.addFrame(img);
        }
    }

    async swapFrame(idx:number, img:DrawableData)
    {
        this.frames[idx] = img;
        await this.cacheThumbnails([idx]);
        return this;
    }

    async swapFrames(newFrames:DrawableData[])
    {
        if(newFrames.length != this.frames.length) { return console.error("Can't swap frames if number of them doesn't match"); }
        this.frames = newFrames.slice();
        await this.cacheThumbnails();
        return this;
    }
    
    // not truly unique if you load the same image multiple times, but why'd you do that?
    setUniqueKey(k:string)
    {
        this.uniqueKey = k;
    }

    getUniqueKey() : string
    {
        if(this.uniqueKey) { return this.uniqueKey; }

        const src = this.getSRCString();
        let srcSplit = src.split("/");

        // EXCEPTION: canvases give a data URL that always starts the same, so cut off that part
        if(src.includes("base64,"))
        {
            srcSplit = src.split("base64,");
        }

        const fileName = srcSplit[srcSplit.length-1];
        const srcName = fileName.split(".")[0];
        const maxLength = 25;
        const srcTrunc = srcName.slice(0, Math.min(srcName.length, maxLength));
        return srcTrunc
    }
}