import { GrayScaleEffect } from "../layout/effects/grayScaleEffect";
import type { Renderer } from "./renderer";
import { RendererPandaqi } from "./pandaqi/rendererPandaqi";
import { ResourceGroup } from "../layout/resources/resourceGroup";
import { ResourceLoader } from "../layout/resources/resourceLoader";
import { Vector2 } from "../geometry/vector2";
import { Configurator } from "../settings/configurator";
import { ensureConfigProperties, GameConfig } from "../settings/configuration";
import { translate } from "../layout/text/translation";

export class MaterialVisualizer
{
    debug?: boolean

    configurator: Configurator
    resLoader: ResourceLoader
    renderer: Renderer;
    
    inkFriendly: boolean
    size: Vector2;
    sizeUnit: number;
    center: Vector2;
    custom: any;
    inkFriendlyEffect: GrayScaleEffect[]

    filterResources: string[]

    translation: Record<string,any>
    language: string

    constructor(config:GameConfig, customItemSize:Vector2 = null)
    {
        ensureConfigProperties(config);
        
        this.renderer = config._game.renderer ?? new RendererPandaqi();
        this.resLoader = config._game.resLoader;

        this.language = (config._settings.defaults.language ?? {}).value ?? config._translation.language;
        this.translation = config._translation ?? { dictionary: {} };

        this.inkFriendly = config._settings.defaults.inkFriendly.value ?? false;
        this.inkFriendlyEffect = this.inkFriendly ? [new GrayScaleEffect()] : [];
        this.size = customItemSize ? customItemSize.clone() : new Vector2(512, 512)
        
        this.sizeUnit = Math.min(this.size.x, this.size.y);
        this.center = this.size.clone().scale(0.5);
        this.filterResources = config._debug.filterResources ?? [];

        // this is just for very easy access through the configurator later; must come first though to ensure we have it for everything else
        this.configurator = new Configurator();
        this.configurator.calculate({
            size: this.size,
            sizeUnit: this.sizeUnit,
            center: this.center,
            inkFriendly: this.inkFriendly
        })
        this.configurator.calculate(config._drawing);

        if(this.debug) { console.log(`[Debug] MaterialVisualizer`, this); console.log(`[Debug] MaterialVisualizer's configurator object`, this.configurator); }
    }

    get(s:string|string[])
    {
        return this.configurator.get(s);
    }

    getTranslated(s:string, params:Record<string,any>)
    {
        return translate({
            dict: this.translation.dictionary, 
            key: s, 
            params: params, 
            language: this.language, 
            delimitersReplace: this.translation.delimitersReplace,
            delimitersTranslate: this.translation.delimitersTranslate
        });
    }

    getResource(s:string)
    {
        const useFallback = this.filterResources.length > 0 && !this.filterResources.includes(s);
        if(useFallback) { return this.resLoader.getResourceImageRandom(); }
        return this.resLoader.getResource(s);
    }

    prepareDraw() : ResourceGroup
    {
        return new ResourceGroup();
    }

    async finishDraw(group:ResourceGroup) : Promise<HTMLCanvasElement>
    {
        return this.renderer.finishDraw({ size: this.size, group: group });
    }
}