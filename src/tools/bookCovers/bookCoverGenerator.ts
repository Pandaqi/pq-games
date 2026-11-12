import type { Renderer } from "../../renderers/renderer";
import { RendererPandaqi } from "../../renderers/pandaqi/rendererPandaqi";
import { ResourceLoader } from "../../layout/resources/resourceLoader";
import { ProgressBar } from "../dom/progressBar";
import BookCoverTargetData from "./bookCoverTargetData";
import BookCoverData from "./bookCoverData";
import { Vector2 } from "../../geometry/vector2";
import BookCoverVisualizer from "./bookCoverVisualizer";
import { fromArray } from "../random/pickers";
import { ResourceImage } from "../../layout/resources/resourceImage";

const DEFAULT_PAGE_SIZE = new Vector2(5.5, 8.5); // inches
type DrawerCallback = (vis:BookCoverVisualizer) => ResourceImage

enum BookCoverComponent
{
    BACK = "back",
    SPINE = "spine",
    FRONT = "front"
}

export { BookCoverComponent }
export type { DrawerCallback }
export default class BookCoverGenerator
{
    config:Record<string,any>
    renderer:Renderer;

    customTargets:Record<string,any>;
    customBookData:Record<string,any>;
    customPageSize:Vector2;

    resLoader:ResourceLoader

    giveFeedback = true
    progressBar:ProgressBar;
    callbacks:Record<string,DrawerCallback>;

    constructor()
    {
        this.progressBar = new ProgressBar();
        this.progressBar.setPhases(["Loading Assets", "Drawing Targets", "Drawing Standalone Cover", "Done"]);

        this.renderer = new RendererPandaqi();
    }

    setConfig(cfg:Record<string,any>)
    {
        this.config = cfg;
        return this;
    }

    getConfigDebug()
    {
        return this.config.debug ?? {};
    }

    setCallbacks(cb:Record<string,DrawerCallback>)
    {
        this.callbacks = cb;
        return this;
    }

    setRenderer(r:Renderer)
    {
        this.renderer = r;
        return this;
    }

    getTargetData(key:string) : BookCoverTargetData
    {
        return this.customTargets ?? (this.config.targets[key] ?? {});
    }

    getBookData() : BookCoverData
    {
        const data = this.customBookData ?? (this.config.bookData ?? {});
        if(!data.custom) { data.custom = {}; }
        return data;
    }

    getPageSize() : Vector2
    {
        return this.customPageSize ?? (this.config.pageSize ?? this.config.settings.defaults.pageSize.value ?? DEFAULT_PAGE_SIZE);
    }

    getCoverTarget() : string
    {
        return fromArray(Object.keys(this.config.targets));
    }

    async loadAssets()
    {
        this.progressBar.gotoNextPhase();
        await this.letDomUpdate();

        const resLoader = new ResourceLoader({ base: this.config.assetsBase, renderer: this.renderer });
        
        if(this.giveFeedback)
        {
            resLoader.onResourceLoaded = (txt:string) => { this.progressBar.setInfo(txt); };
        }

        resLoader.planLoadMultiple(this.config.assets, this.config);
        await resLoader.loadPlannedResources();
        this.resLoader = resLoader; 
    }

    async drawTargets()
    {
        this.progressBar.gotoNextPhase();
        await this.letDomUpdate();

        const customTargets = this.getConfigDebug().targets ?? [];
        const targetsChosen = customTargets.length > 0 ? customTargets : Object.keys(this.config.targets)
        for(const key of targetsChosen)
        {
            await this.createWraparoundForTarget(key, false);
        }
    }

    async generate()
    {
        await this.loadAssets();
        await this.drawTargets();
        await this.createStandaloneCover();

        this.progressBar.gotoNextPhase();
        this.progressBar.node.remove();
    }

    async createWraparoundForTarget(target:string, frontOnly = false)
    {
        this.progressBar.setInfo("Drawing target: " + target);
        await this.letDomUpdate();

        const vis = new BookCoverVisualizer(this.getPageSize(), this.getBookData(), this.getTargetData(target), this.getConfigDebug());
        vis.setRenderer(this.renderer);
        vis.setResourceLoader(this.resLoader);
        vis.setCallbacks(this.callbacks[BookCoverComponent.BACK], this.callbacks[BookCoverComponent.SPINE], this.callbacks[BookCoverComponent.FRONT]);
        if(frontOnly) { vis.makeCover(); }
        await vis.draw();
    }

    async createStandaloneCover()
    {
        this.progressBar.gotoNextPhase();
        await this.letDomUpdate();

        if(this.getConfigDebug().noCover) { return; }
        await this.letDomUpdate();
        await this.createWraparoundForTarget(this.getCoverTarget(), true);
    }

    async letDomUpdate()
    {
        if(!this.giveFeedback) { return Promise.resolve('No delay!'); }
        const sleep = (timeout:number) => new Promise(r => setTimeout(r, timeout));
        return sleep(33);
    }
}