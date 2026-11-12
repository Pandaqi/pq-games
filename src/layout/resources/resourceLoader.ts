import { Vector2 } from "../../geometry/vector2"
import type { Renderer } from "../../renderers/renderer"
import { RendererPandaqi } from "../../renderers/pandaqi/rendererPandaqi"
import { TextConfig } from "../text/textConfig"
import { Resource } from "./resource"
import { ResourceFont } from "./resourceFont"
import { ResourceImage } from "./resourceImage"

export interface ResourceLoaderParams
{
    base?:string,
    renderer?: Renderer
}

export interface ResourceLoadParams
{
    path?: string
    id?: string
    key?: string
    textConfig?: TextConfig,
    useAbsolutePath?: boolean // default is false = relative path, potentially from base
    inkfriendly?: boolean, // default = false
    loadIf?: string[], // only if these specific paths in config evaluate to TRUE, load this asset
    loadInSequence?: boolean, // parallel loading is default, but that can break on Chrome + old system + lots of stuff to load
    enableCaching?: boolean, // creates a separate cached image for every frame; only useful if we have a spritesheet that the generator draws from aaall the time

    numThumbnails?: number,
    frames?: Vector2,
    uniqueKey?: string,
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "webp", "png", "jfif", "avif", "svg"]
const AUDIO_EXTENSIONS = ["mp3", "ogg", "wav"]
const VIDEO_EXTENSIONS = ["mp4", "webm"]
const FONT_EXTENSIONS = ["otf", "ttf", "woff", "woff2"]

export class ResourceLoader 
{
    resourcesQueued : Record<string, ResourceLoadParams>
    resourcesLoaded : Record<string, Resource>
    resourcesCustom : File[]
    base: string
    renderer : Renderer;

    loadInSequence = false
    onResourceLoaded = (txt:string) => {}

    fallbackImage : ResourceImage
    fallbackFont : ResourceFont

    constructor(params:ResourceLoaderParams = {})
    {
        this.resourcesQueued = {};
        this.resourcesLoaded = {};
        this.resourcesCustom = [];
        this.renderer = params.renderer ?? new RendererPandaqi();

        this.base = params.base ?? "";
        if(this.base.slice(-1) != "/") { this.base += "/"; }
    }

    planLoad(id:string, params:ResourceLoadParams = {})
    {
        if(typeof params !== "object") { return; }
        
        if(!params.path) { return console.error("Can't load resource without path."); }
        const resourceAlreadyLoaded = this.resourcesQueued[id] || this.resourcesLoaded[id];
        if(resourceAlreadyLoaded) { return; }

        this.resourcesQueued[id] = Object.assign({}, params);
        
        if(params.inkfriendly)
        {
            const newParams = structuredClone(params);
            const pathSplit = params.path.split(".");
            newParams.path = pathSplit[0] + "_inkfriendly" + "." + pathSplit[1];
            this.resourcesQueued[id + "_inkfriendly"] = newParams;
        }
    }

    getStringPathIntoDict(paths:string[], config:Record<string,any>)
    {
        for(const pathString of paths)
        {
            const path = pathString.split(".");
            let val = config;
            for(const elem of path)
            {
                val = val[elem];
                if(val == undefined) { break; }
            }
            if(val) { return true; }
        }
        return false;
    }

    planLoadMultiple(dict:Record<string,ResourceLoadParams>, config:Record<string,any> = {})
    {
        const filterResources = (config._debug ?? {}).filterResources ?? [];
        for(const [id,data] of Object.entries(dict))
        {
            if(data.loadIf)
            {
                const val = this.getStringPathIntoDict(data.loadIf, config);
                if(!val) { continue; }
            }

            if(filterResources.length > 0 && !filterResources.includes(id)) { continue; }
            this.planLoad(id, data);
        }
    }

    async loadPlannedResources()
    {
        if(Object.keys(this.resourcesQueued).length <= 0) { return; }

        const promises = [];
        for(const [id, params] of Object.entries(this.resourcesQueued))
        {
            if(params.loadInSequence || this.loadInSequence) {
                await this.loadResource(id, params);
            } else {
                promises.push(this.loadResource(id, params));                
            }
        }

        this.resourcesQueued = {};
        if(promises.length > 0) { await Promise.all(promises); }
    }

    getExtension(path:string) : string
    {
        const splitPath = path.split(".");
        if(splitPath.length <= 1) { return ""; }
        return splitPath[splitPath.length - 1];
    }

    isImage(path:string) : boolean
    {
        return IMAGE_EXTENSIONS.includes(this.getExtension(path))
    }

    isAudio(path:string) : boolean
    {
        return AUDIO_EXTENSIONS.includes(this.getExtension(path))
    }

    isVideo(path:string) : boolean
    {
        return VIDEO_EXTENSIONS.includes(this.getExtension(path))
    }

    isFont(path:string) : boolean
    {
        return FONT_EXTENSIONS.includes(this.getExtension(path));
    }

    addResource(id:string, res:Resource)
    {
        this.resourcesLoaded[id] = res;
    }

    async loadResource(id:string, params:ResourceLoadParams)
    {
        // manipulate path to get both the FULL path (correctly) + the individual FILENAME
        const originalPath = params.path ?? "";
        let path = params.useAbsolutePath ? params.path : this.base + originalPath;
        path = path.replaceAll("//", "/"); // to prevent any silly shenanigans with trailing slashes

        const key = (params.id ?? params.key) ?? id;

        const pathOriginal = path;
        const pathSplit = path.split("/");
        const fileName = pathSplit[pathSplit.length - 1];

        // swap assets with custom assets, if available and names match
        const customResourceIndex = this.resourcesCustom.findIndex((x) => x.name == fileName);
        const hasCustomResourceMatch = customResourceIndex >= 0;
        if(hasCustomResourceMatch)
        {
            path = URL.createObjectURL(this.resourcesCustom[customResourceIndex]);
        }

        // load images as needed
        if(this.isImage(pathOriginal))
        {
            const img = new Image();
            img.src = path;
            await this.cacheLoadedImage(key, params, img);
            this.onResourceLoaded("Image (" + fileName + ")");
            if(!this.fallbackImage) { this.fallbackImage = this.resourcesLoaded[id] as ResourceImage; }
        }

        // load fonts as needed
        if(this.isFont(pathOriginal))
        {
            const textConfig = params.textConfig ? params.textConfig.getFontFaceDescriptors() : {};
            const fontFile = new FontFace(key, "url('" + path + "')", textConfig);
            const f = await fontFile.load()
            this.cacheLoadedFont(key, params, f);
            this.onResourceLoaded("Font (" + fileName + ")");
            if(!this.fallbackFont) { this.fallbackFont = this.resourcesLoaded[id] as ResourceFont; }
        }
        
    }

    cacheLoadedFont(id:string, params:ResourceLoadParams, f:FontFace)
    {
        // @ts-ignore
        document.fonts.add(f);
        const res = new ResourceFont(f, params);
        this.resourcesLoaded[id] = res;
    }

    async cacheLoadedImage(id:string, params:ResourceLoadParams, img:HTMLImageElement)
    {
        this.resourcesLoaded[id] = await this.renderer.cacheLoadedImage(img, params);
    }

    getResource(id:string, copy:boolean = false) : any
    {
        let res = this.resourcesLoaded[id];
        if(!res) { return null; }
        if(copy) { res = res.clone(true); }
        return res;
    }

    getResourceImageRandom() : ResourceImage
    {
        return this.fallbackImage;
    }

    setCustomResources(data:FileList)
    {
        this.resourcesCustom = Array.from(data);
    }
}