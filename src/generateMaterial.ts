import type { Vector2 } from "./geometry/vector2";
import { convertCanvasToImage } from "./layout/canvas/converters";
import { splitCanvas } from "./layout/canvas/splitters";
import { GridMapper, createGridMapperFromConfig } from "./layout/gridMapper";
import { ResourceLoader } from "./layout/resources/resourceLoader";
import { MaterialVisualizer } from "./renderers/materialVisualizer";
import { RendererPandaqi } from "./renderers/pandaqi/rendererPandaqi";
import type { Renderer } from "./renderers/renderer";
import { addConfigFromLocalStorage, ensureConfigProperties, type GameConfig, type MaterialConfig } from "./settings/configuration";
import { sendProgressInfoSignal, sendProgressPhaseSignal } from "./tools/dom/feedbackNode";
import { PdfBuilder, PdfPageConfig } from "./tools/pdf/pdfBuilder";
import { getSplitDimsAsPoint, makeSizeSplittable } from "./tools/pdf/tools";

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_SLEEP_DURATION = 33 // ms

export interface MaterialDrawCall
{
    item: any,
    mapper: GridMapper,
    visualizer: MaterialVisualizer,
    splitDims: Vector2,
    frontDefault: HTMLCanvasElement,
    backDefault: HTMLCanvasElement
}

const sleep = (timeout:number) => new Promise(r => setTimeout(r, timeout))
const letDomUpdate = async () => { return sleep(DEFAULT_SLEEP_DURATION); }

const loadResources = async (config:GameConfig, feedbackNode:HTMLElement, renderer: Renderer) =>
{
    sendProgressPhaseSignal(feedbackNode, "Loading Resources");
    await letDomUpdate();

    const resourceFilter = config._resources.filter ?? ((dict) => { return dict; });
    const resourcesToLoad = resourceFilter(config._resources.files ?? {});
    const resLoader = new ResourceLoader({ base: config._resources.base, renderer: renderer });
    resLoader.onResourceLoaded = (txt:string) => { sendProgressInfoSignal(feedbackNode, txt); };
    resLoader.setCustomResources(config._settings.defaults.resources.value)

    if(!config._debug.onlyGenerate) { resLoader.planLoadMultiple(resourcesToLoad, config); }
    await resLoader.loadPlannedResources();

    config._game.resLoader = resLoader;
    
    return resLoader;
}

const generateItems = async (config:GameConfig, feedbackNode:HTMLElement, generators:Record<string,any>) =>
{
    sendProgressPhaseSignal(feedbackNode, "Creating Material");
    await letDomUpdate();

    const items = {};
    for(const [id,generator] of Object.entries(generators))
    {
        let value = [];
        if(typeof generator == "function") { 
            value = await generator(config)
        } else {
            await generator.generate()
            value = generator.get();
        }
	    if(!Array.isArray(value)) { value = [value]; }
        items[id] = value;
    }

    if(config._debug.picker) { console.log(`[Debug] Pickers`, items); }
    return items;
}

const generateDrawCalls = (config:GameConfig, allItems:Record<string,any>, mappers:Record<string,any>) : MaterialDrawCall[] =>
{
    if(config._debug.onlyGenerate) { return []; }

    const itemsOfType = {};

    // collect all items (and the visualizer for them), but don't draw them yet
    // so far, mappers are always just GridMappers, though that might generalize in the future
    const drawCalls:MaterialDrawCall[] = [];
    const splitDimsGlobal = config._settings.defaults.splitDims.value;
    for(const [id,mapper] of Object.entries(mappers))
    {
        const materialConfig = config._material[id];
        const items = allItems[id];

        // if we intend to split the image later, we need to draw it enlarged to keep it high resolution
        const splitDims = getSplitDimsAsPoint(splitDimsGlobal ?? materialConfig.splitDims);
        const itemSize = makeSizeSplittable(mapper.getMaxElementSize(), splitDims);

        const visualizerClass = (materialConfig.visualizer ?? config._generation.visualizer) ?? MaterialVisualizer;
        const visualizer = new visualizerClass(config, itemSize);
        if(config._debug.visualizer) { visualizer.debug = true; }

        const frontDefault = materialConfig.frontDefault ? materialConfig.frontDefault.draw(visualizer) : null;
        const backDefault = materialConfig.backDefault ? materialConfig.backDefault.draw(visualizer) : null;

        for(const item of items)
        {
            const type = item.type ?? "default";
            if(!itemsOfType[type]) { itemsOfType[type] = []; }
            itemsOfType[type].push(item);
            if(config._debug.singleDrawPerType && itemsOfType[type].length > 1) { continue; }

            drawCalls.push({ 
                item: item, 
                mapper: mapper, 
                visualizer: visualizer, 
                splitDims: splitDims, 
                frontDefault: frontDefault,
                backDefault : backDefault
            });
        }
    }

    return drawCalls
}

const drawItems = async (config: GameConfig, feedbackNode:HTMLElement, drawCalls:MaterialDrawCall[], renderer:Renderer) =>
{
    sendProgressPhaseSignal(feedbackNode, "Drawing Material");

    if(drawCalls.length <= 0) { return; }
    await letDomUpdate();

    let batchSize = (renderer.customBatchSize ?? config._generation.batchSize) ?? DEFAULT_BATCH_SIZE;

    // because we draw them in small batches to prevent overloading the browser
    // (and give intermittent feedback to user)
    if(batchSize <= 0 || config._generation.noBatching) { batchSize = drawCalls.length; }
    const numBatches = Math.ceil(drawCalls.length / batchSize);

    for(let i = 0; i < numBatches; i++)
    {
        const infoText = "Drawing batch " + (i+1) + " / " + numBatches;
        console.log(infoText);
        sendProgressInfoSignal(feedbackNode, infoText);
        await letDomUpdate();

        const promisesFront = [];
        const promisesBack = [];
        const drawCallsInBatch = drawCalls.splice(0, batchSize);
        for(const drawCall of drawCallsInBatch)
        {
            // cards handle drawing themselves (override by default if set)
            if(!("draw" in drawCall.item)) { console.error(`Item in DrawCall has no draw function`, drawCall); continue; }
            
            // the array stuff allows the draw call to return _multiple_ things -> not recommended almost ever, but at least handles it now
            let resultsFront = drawCall.frontDefault ?? drawCall.item.draw(drawCall.visualizer);
            if(!Array.isArray(resultsFront)) { resultsFront = [resultsFront]; }

            let resultsBack = drawCall.backDefault ?? (("drawBack" in drawCall.item) ? drawCall.item.drawBack(drawCall.visualizer) : null);
            if(!Array.isArray(resultsBack)) { resultsBack = [resultsBack]; }
            for(let i = 0; i < (resultsFront.length - resultsBack.length); i++) { resultsBack.push(null); } // pad to ensure equal length

            promisesFront.push(...resultsFront);
            promisesBack.push(...resultsBack);
        }

        const canvasesFront = await Promise.all(promisesFront);
        const canvasesBack = await Promise.all(promisesBack);
        const numCanvases = canvasesFront.length;
        for(let i = 0; i < numCanvases; i++)
        {
            const drawCall = drawCallsInBatch[i];
            
            // almost all cases will just have splitDims = 1x1, which means this just returns [originalCanvas]
            const canvasesFrontFinal = splitCanvas(canvasesFront[i], drawCall.splitDims);
            const canvasesBackFinal = canvasesBack[i] ? splitCanvas(canvasesBack[i], drawCall.splitDims) : new Array(canvasesFrontFinal.length).fill(null);
            for(let c = 0; c < canvasesFrontFinal.length; c++)
            {
                drawCall.mapper.addElement(canvasesFrontFinal[c], canvasesBackFinal[c]);
            }
        }
    }
}

const downloadPDF = async (config:GameConfig, feedbackNode: HTMLElement, mappers:Record<string,any>) =>
{
    if(config._debug.onlyGenerate) { return; }

    sendProgressPhaseSignal(feedbackNode, "Preparing PDF(s)");

    const pdfBuilders = new Map();
    for(const [key,mapper] of Object.entries(mappers))
    {
        const size = mapper.getPageSize();

        // if there isn't a PDF builder with the exact size we need yet, we're forced to start a new PDF
        let pdfBuilder = pdfBuilders.get(size);
        if(!pdfBuilder)
        {
            const pageParams:PdfPageConfig = {
                size: mapper.getPageSize(), 
                debugWithoutFile: config._debug.omitFile, 
                lossless: config._generation.losslessPdf,
                fileName: config._material[key].fileName ?? config._game.fileName ?? config._game.name,
            };
            pdfBuilder = new PdfBuilder(pageParams);
            pdfBuilders.set(size, pdfBuilder);
        }

        // draw everything into that new PDF
        const canvases = mapper.getCanvases();
        const numPages = canvases.length;
        for(let i = 0; i < numPages; i++)
        {
            const infoText = "Adding page " + (i+1) + " / " + numPages + " to PDF";
            console.log(infoText);

            sendProgressInfoSignal(feedbackNode, infoText);
            await letDomUpdate();

            const image = await convertCanvasToImage(canvases[i]);
            pdfBuilder.addImage(image);
        }
    }

    const numPdfs = pdfBuilders.size;
    sendProgressInfoSignal(feedbackNode, `Compressing PDFs (${numPdfs}) (final step).`);
    await letDomUpdate();

    // download all PDFs created
    for(const [size,builder] of pdfBuilders.entries())
    {
        builder.downloadPDF();
    }
    
}

const setupRenderer = (config:GameConfig) =>
{
    const renderer = config._game.renderer ?? new RendererPandaqi();
    config._game.renderer = renderer;
    renderer.debugLayoutOperation = config._debug.layoutOperation;
    renderer.debugText = config._debug.text;
    return renderer; 
}

export const generateMaterial = async (config:GameConfig) =>
{
    const startTime = Date.now();
    const feedbackNode = config._settings.meta.feedbackNode;
    sendProgressPhaseSignal(feedbackNode, "Starting");

    // prepare config
    addConfigFromLocalStorage(config);
    ensureConfigProperties(config);
    console.log(config);

    // register elements needed
    const generators = {};
    const mappers = {};
    const material:Record<string,MaterialConfig> = config._material ?? {};
    for(const [key,value] of Object.entries(material))
    {
        generators[key] = value.picker;
        mappers[key] = createGridMapperFromConfig(config, value.mapper);
    }

    // create, draw, finalize
    const renderer = setupRenderer(config);
    const resLoader = await loadResources(config, feedbackNode, renderer);
    const items = await generateItems(config, feedbackNode, generators);
    const drawCalls = generateDrawCalls(config, items, mappers);
    await drawItems(config, feedbackNode, drawCalls, renderer);
    await downloadPDF(config, feedbackNode, mappers);

    // finishing touches
    sendProgressPhaseSignal(feedbackNode, "Done!");
    sendProgressInfoSignal(feedbackNode, "PDF Downloaded!");
    const endTime = Date.now();
    const profilePerformance = config._debug.profile ?? false;
    if(profilePerformance) { console.log("Generation Time = ", endTime - startTime); }
}