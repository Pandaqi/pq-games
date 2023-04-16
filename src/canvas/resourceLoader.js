// @TODO: ResourceLoader might want to differentiate between different file types (if it ever has to load more than images)
// @TODO: Now many parts (also lib-pqWords) use xhr requests that are similar, leading to copied code

export default class ResourceLoader {
    constructor()
    {
        this.resourcesQueued = {};
        this.resources = {};
    }

    planLoad(id, params = {})
    {
        if(!params.path) { console.error("Can't load resource without path."); return; }
        this.resourcesQueued[id] = params;
        
        if(params.inkfriendly)
        {
            const newParams = structuredClone(params);
            const pathSplit = params.path.split(".");
            newParams.path = pathSplit[0] + "_inkfriendly" + "." + pathSplit[1];
            this.resourcesQueued[id + "_inkfriendly"] = newParams;
        }
    }

    planLoadMultiple(obj)
    {
        for(const key in obj)
        {
            this.planLoad(key, obj[key]);
        }
    }

    async loadPlannedResources()
    {
        let promise = Promise.resolve();
        for(const key in this.resourcesQueued)
        {
            const id = key;
            const params = this.resourcesQueued[key];
            promise = promise.then(() => this.loadResource(id, params));
        }
        this.resourcesQueued = {};

        await promise;
    }

    loadResource(id, params)
    {
        const that = this;
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = params.path;
            img.onload = () => {
                that.cacheLoadedResource(id, params, img);
                resolve(true);
            };
        });
    }

    cacheLoadedResource(id, params, img)
    {
        params.data = img;
        this.resources[id] = params;

        params.size = { width: img.naturalWidth, height: img.naturalHeight }
        if(!params.frames) { params.frames = { x: 1, y: 1}; }
        params.frameSize = { 
            width: params.size.width / params.frames.x, 
            height: params.size.height / params.frames.y 
        };
    }

    getResource(id)
    {
        return this.resources[id].data;
    }

    getResourceSize(id)
    {
        return this.resources[id].size;
    }

    getFrame(id, frame)
    {
        const frames = this.resources[id].frames;
        const frameSize = this.resources[id].frameSize;
        const frameVec = { x: frame % frames.x, y: Math.floor(frame / frames.x) };
        const data = {
            x: frameVec.x * frameSize.width,
            y: frameVec.y * frameSize.height,
            width: frameSize.width,
            height: frameSize.height
        }
        return data;
    }
}