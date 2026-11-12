import { MapperConfig, GameConfig } from "../settings/configuration"
import { Vector2 } from "../geometry/vector2"
import { createCanvas } from "../layout/canvas/creators"
import { PageOrientation, PageSides, getPageSizeSingle } from "../tools/pdf/tools"

export enum GridMapperLayout
{
    TRIANGLE,
    RECTANGLE,
    HEXAGON,
    CIRCLE
}

export enum MapperPreset
{
    FULL_PAGE = "full",
    CARD = "card",
    TILE = "tile",
    DOMINO = "domino",
}

export enum ItemSize
{
    TINY = "tiny",
    SMALL = "small",
    REGULAR = "regular",
    LARGE = "large",
    HUGE = "huge",
}

export const GRID_SIZE_DEFAULT:Record<ItemSize,Vector2> = 
{
    [ItemSize.TINY]: new Vector2(5,5),
    [ItemSize.SMALL]: new Vector2(4,4),
    [ItemSize.REGULAR]: new Vector2(3,3),
    [ItemSize.LARGE]: new Vector2(2,2),
    [ItemSize.HUGE]: new Vector2(1,1)
}

export const MAPPER_PRESETS:Record<MapperPreset, MapperConfig> =
{
    [MapperPreset.FULL_PAGE]:
    {
        autoStroke: false,
        sizeGridForced: new Vector2(1,1),
        // no sizeElement set means it will just stretch and fill the whole space
        margin: Vector2.ZERO,
        pageOrientation: PageOrientation.LANDSCAPE
    },

    [MapperPreset.CARD]: 
    {
        autoStroke: true,
        sizeElement: new Vector2(1, 1.4),
        size: 
        { 
            small: new Vector2(4,4),
            regular: new Vector2(3,3),
            large: new Vector2(2,2)
        }, 
        pageOrientation: PageOrientation.PORTRAIT
    },

    [MapperPreset.TILE]:
    {
        autoStroke: true,
        sizeElement: new Vector2(1, 1),
        size: 
        { 
            small: new Vector2(5,7),
            regular: new Vector2(3,5),
            large: new Vector2(2,3)
        },
        pageOrientation: PageOrientation.PORTRAIT
    },

    [MapperPreset.DOMINO]:
    {
        autoStroke: true,
        sizeElement: new Vector2(1, 2),
        size: 
        { 
            small: new Vector2(5,4),
            regular: new Vector2(4,3),
            large: new Vector2(3,2)
        },
        pageOrientation: PageOrientation.PORTRAIT
    }
}

const DEF_AUTO_STROKE = {
    size: 0.01,
    color: "#000000"
}

export interface GridMapperElementStrokeParams
{
    size?: number,
    color?: string,
}

export interface GridMapperParams
{
    debug?: boolean,
    layoutShape?: GridMapperLayout
    size?: Vector2
    sizeElement?: Vector2,
    pageSize?: Vector2,
    pageSides?: PageSides,
    outerMargin?: Vector2
    innerMargin?: Vector2,
    absoluteElementSize?: Vector2,
    autoStroke?: GridMapperElementStrokeParams|boolean
}

export const getGridSizeFromMapperConfig = (MapperConfig:MapperConfig, itemSizeKey:string) =>
{
    // override if needed
    if(MapperConfig.sizeGridForced) { return MapperConfig.sizeGridForced; }

    // if something is set specifically, use that
    const size = (MapperConfig.size ?? {})[itemSizeKey];
    if(size) { return size; }

    // otherwise, extract from "base" size 
    // (calculate the relative step between default size and wanted size, apply to the input setting)
    const baseSize = GRID_SIZE_DEFAULT.regular;
    const targetSize = GRID_SIZE_DEFAULT[itemSizeKey ?? "regular"];
    const sizeChange = 0.5*Math.ceil((targetSize.x / baseSize.x) + (targetSize.y / baseSize.y));
    const newSize = MapperConfig.size.regular.clone().scale(sizeChange).round();
    return newSize;
}

export const createGridMapperFromConfig = (config:GameConfig, mapperConfig:MapperConfig) =>
{
    // a shortcut to select an oft-used preset of settings
    if(typeof mapperConfig == "string") { mapperConfig = { preset: mapperConfig }; };
    if(mapperConfig.preset) { mapperConfig = MAPPER_PRESETS[mapperConfig.preset]; }
    
    // grab proper settings from general, allowing override from specific config
    const itemSizeKey = config._settings.defaults.itemSize.value;
    const pageSize = getPageSizeSingle({
        pageSize: mapperConfig.pageSize ?? config._settings.defaults.pageSize.value,
        orientation: mapperConfig.pageOrientation ?? config._generation.pageOrientation
    });

    const pageSides = config._settings.defaults.pageSides.value ?? config._game.pageSides ?? PageSides.SINGLE;

    // return new GridMapper made for this
    const size = getGridSizeFromMapperConfig(mapperConfig, itemSizeKey);
    const gridConfig:GridMapperParams = 
    { 
        pageSides: pageSides, 
        pageSize: pageSize, 
        size: size, 
        sizeElement: mapperConfig.sizeElement, 
        autoStroke: mapperConfig.autoStroke
    };

    if(mapperConfig.margin)
    {
        gridConfig.outerMargin = mapperConfig.margin;
        gridConfig.innerMargin = mapperConfig.margin;
    }

    if(config._debug.mapper)
    {
        gridConfig.debug = true;
    }
    
    return new GridMapper(gridConfig);
}

export class GridMapper 
{
    debug = false

    pageSides: PageSides

    canvasesFront : HTMLCanvasElement[]
    canvasesBack : HTMLCanvasElement[]

    currentElement : number

    layoutShape : GridMapperLayout
    dims : Vector2
    outerMargin : Vector2
    innerMargin : Vector2
    padding : Vector2
    pageSize : Vector2
    pageSizeUnit : number
    innerPageSize : Vector2
    maxPixels : Vector2

    fakeDims : Vector2
    offsetPerElement : Vector2
    elementsPerPage : number
    elementPositions : Vector2[]

    autoStroke: GridMapperElementStrokeParams

    constructor(params:GridMapperParams = {})
    {
        this.debug = params.debug ?? false;

        this.pageSides = params.pageSides;
        this.pageSize = params.pageSize;
        this.pageSizeUnit = Math.min(this.pageSize.x, this.pageSize.y);

        this.canvasesFront = [];
        this.canvasesBack = [];

        this.layoutShape = params.layoutShape ?? GridMapperLayout.RECTANGLE; // rectangle, hexagon, triangle, circle
        this.dims = params.size ?? new Vector2(3, 3);
        this.outerMargin = params.outerMargin ?? new Vector2(0.02); // default printer margin is 0.5 inch, which is roughly 0.02 of smallest side of A4
        this.innerMargin = params.innerMargin ?? new Vector2(0.01); // could be 0 if I wanted, so this is just a nice value for visual clarity
        this.outerMargin = this.outerMargin.clone().scaleFactor(this.pageSizeUnit);
        this.innerMargin = this.innerMargin.clone().scaleFactor(this.pageSizeUnit);

        this.autoStroke = params.autoStroke ? Object.assign(Object.assign({}, DEF_AUTO_STROKE), params.autoStroke) : null;
        
        this.padding = new Vector2();
        this.currentElement = 0;
        
        this.innerPageSize = new Vector2({
            x: (this.pageSize.x-2*this.outerMargin.x),
            y: (this.pageSize.y-2*this.outerMargin.y)
        });

        this.maxPixels = new Vector2({ 
            x: Math.floor( this.innerPageSize.x / this.dims.x ), 
            y: Math.floor( this.innerPageSize.y / this.dims.y )
        });

        this.fakeDims = this.dims.clone();
        this.offsetPerElement = new Vector2(1.0, 1.0);

        const shp = this.layoutShape;
        const useAlternativeGrid = shp != GridMapperLayout.RECTANGLE;
        if(useAlternativeGrid)
        {
            if(shp == GridMapperLayout.TRIANGLE) {
                this.offsetPerElement.x = 0.5;
                this.offsetPerElement.y = 1.0;
            } else if(shp == GridMapperLayout.HEXAGON) {
                this.offsetPerElement.x = 0.75;
                this.offsetPerElement.y = Math.sqrt(3)/2;
            } else if(shp == GridMapperLayout.CIRCLE) {
                this.offsetPerElement.x = Math.sqrt(2)/2;
                this.offsetPerElement.y = Math.sqrt(2);
            }

            const numElemsPerRealElem = {
                x: 1.0 / this.offsetPerElement.x,
                y: 1.0 / this.offsetPerElement.y
            }

            this.fakeDims.x /= numElemsPerRealElem.x;
            this.fakeDims.y /= numElemsPerRealElem.y;

            this.fakeDims.x += (1.0 - this.offsetPerElement.x);
            this.fakeDims.y += (1.0 - this.offsetPerElement.y);

            if(this.layoutRequiresOffset())
            {
                this.fakeDims.y += 0.5 * this.offsetPerElement.y;
            }

            this.maxPixels = new Vector2({
                x: this.innerPageSize.x / this.fakeDims.x,
                y: this.innerPageSize.y / this.fakeDims.y
            })
        }

        const dimsElement = params.sizeElement;
        if(dimsElement)
        {
            const ratio = (dimsElement.y / dimsElement.x);
            let newX = this.maxPixels.x;
            let newY = this.maxPixels.y;
            let scaleDown = 1.0;

            if(ratio <= 1) {
                newY = this.maxPixels.x * ratio;
                scaleDown = Math.min( (this.maxPixels.y / newY), 1.0);
            } else {
                newX = this.maxPixels.y * (1.0 / ratio);
                scaleDown = Math.min( (this.maxPixels.x / newX), 1.0);
            }

            this.maxPixels.y = newY * scaleDown;
            this.maxPixels.x = newX * scaleDown;
        }

        // this just overrides and recalculates using a fixed, absolute size (if given)
        if(params.absoluteElementSize) { 
            this.maxPixels = params.absoluteElementSize;
            this.dims = new Vector2({
                x: Math.floor( this.innerPageSize.x / this.maxPixels.x),
                y: Math.floor( this.innerPageSize.y / this.maxPixels.y),
            });
        }

        if(isNaN(this.maxPixels.x) || isNaN(this.maxPixels.y)) 
        { 
            console.error("GridMapper has NaN size for elements"); 
            return;
        }

        const spaceUsed = new Vector2({ x: this.maxPixels.x * this.fakeDims.x, y: this.maxPixels.y * this.fakeDims.y });
            
        // padding left/right/top/bottom around each element to center it
        this.padding = new Vector2({
            x: (this.innerPageSize.x - spaceUsed.x) / this.dims.x,
            y: (this.innerPageSize.y - spaceUsed.y) / this.dims.y
        });

        this.elementsPerPage = this.dims.x * this.dims.y;
        this.calculateElementPositions();
    }

    getElementsPerPage() : number
    {
        return this.elementsPerPage;
    }

    getMaxElementSize() : Vector2
    {
        return this.maxPixels.clone();
    }

    getMaxElementSizeAsSquare() : Vector2
    {			
        const maxSize = this.getMaxElementSize();
        const smallestSize = Math.min(maxSize.x, maxSize.y);
        return new Vector2().setXY(smallestSize, smallestSize);
    }

    layoutRequiresOffset() : boolean
    {
        return this.layoutShape == GridMapperLayout.HEXAGON || this.layoutShape == GridMapperLayout.CIRCLE;
    }

    calculateElementPositions()
    {
        const arr = [];
        const totalSizePerElement = new Vector2({
            x: this.offsetPerElement.x * this.maxPixels.x + this.padding.x,
            y: this.offsetPerElement.y * this.maxPixels.y + this.padding.y
        });

        for(let i = 0; i < this.getElementsPerPage(); i++)
        {
            const col = i % this.dims.x;
            const row = Math.floor(i / this.dims.x);
    
            let offsetX = 0, offsetY = 0;
            let offsetColumn = false;
            if(this.layoutRequiresOffset()) { offsetColumn = (col % 2 == 1); }
            if(offsetColumn) { offsetY = 0.5 * this.offsetPerElement.y * this.maxPixels.y; }

            const anchor = {
                x: this.outerMargin.x + offsetX,
                y: this.outerMargin.y + offsetY
            }

            const x = Math.floor(anchor.x + col * totalSizePerElement.x);
            const y = Math.floor(anchor.y + row * totalSizePerElement.y);
            arr.push(new Vector2().setXY(x,y));
        }
        
        this.elementPositions = arr;
    }

    addElements(elems:HTMLCanvasElement[]) { elems.forEach((elem) => this.addElement(elem)); }
    addElement(elemFront:HTMLCanvasElement, elemBack:HTMLCanvasElement = null)
    {
        this.addNewCanvasIfNeeded();
        
        const scaleX = (this.maxPixels.x - this.innerMargin.x) / elemFront.width;
        const scaleY = (this.maxPixels.y - this.innerMargin.y) / elemFront.height;
        const finalScale = Math.min(scaleX, scaleY);

        const finalWidth = Math.floor(elemFront.width * finalScale);
        const finalHeight = Math.floor(elemFront.height * finalScale);

        const marginX = this.maxPixels.x - finalWidth;
        const marginY = this.maxPixels.y - finalHeight;

        const innerPaddingX = 0.5*marginX + 0.5*this.padding.x;
        const innerPaddingY = 0.5*marginY + 0.5*this.padding.y;

        const pos = this.elementPositions[this.currentElement];
        const finalX = pos.x + innerPaddingX;
        const finalY = pos.y + innerPaddingY;

        this.addToActiveCanvas(elemFront, false, { x: finalX, y: finalY, w: finalWidth, h: finalHeight, xElemPos: pos.x, yElemPos: pos.y });

        // if MIX we leave the backside empty
        // this always flips on the LEFT SIDE (which is long side on portrait, which is the default double-sided flip for 99% of uses)
        if(this.pageSides == PageSides.DOUBLE)
        {
            const elementsPerRow = this.dims.x;
            const curRow = Math.floor(this.currentElement / elementsPerRow);
            const colOnBack = elementsPerRow - 1 - (this.currentElement % elementsPerRow); // invert the column = flip position on X
            const curElementOnBack = curRow * elementsPerRow + colOnBack; // so this should align perfectly with the back once printed

            const posBack = this.elementPositions[curElementOnBack];
            const finalXBack = posBack.x + innerPaddingX;
            const finalYBack = posBack.y + innerPaddingY;

            this.addToActiveCanvas(elemFront, false, { x: finalXBack, y: finalYBack, w: finalWidth, h: finalHeight, xElemPos: posBack.x, yElemPos: posBack.y });
        }

        this.currentElement += 1;
    }

    getActiveCanvas(back = false) 
    { 
        if(back) { return this.canvasesBack[this.canvasesBack.length-1]; }
        return this.canvasesFront[this.canvasesFront.length - 1]; 
    }

    addToActiveCanvas(elem:HTMLCanvasElement, back = false, params:Record<string,any>)
    {
        const { x, y, w, h, xElemPos, yElemPos } = params;
        const activeCanvas = this.getActiveCanvas(back);
        const ctx = activeCanvas.getContext("2d");
        ctx.resetTransform();
        ctx.drawImage(elem, x, y, w, h);

        if(this.debug)
        {
            ctx.strokeStyle = "#FF0000";
            ctx.lineWidth = 2;
            ctx.strokeRect(xElemPos, yElemPos, this.maxPixels.x, this.maxPixels.y);

            ctx.strokeStyle = "#0000FF";
            ctx.lineWidth = 5;
            ctx.strokeRect(x, y, w, h);
        }

        if(this.autoStroke)
        {
            ctx.strokeStyle = this.autoStroke.color;
            ctx.lineWidth = this.autoStroke.size * Math.min(w,h);
            ctx.strokeRect(x, y, w, h);
        }
    }

    addNewCanvasIfNeeded()
    {
        if(this.currentElement < this.elementsPerPage && this.canvasesFront.length > 0) { return; }
        this.addNewCanvas();
    }

    addNewCanvas()
    {
        const canv = createCanvas({ width: this.pageSize.x, height: this.pageSize.y });
        this.canvasesFront.push(canv);

        if(this.pageSides != PageSides.SINGLE)
        {
            const canv = createCanvas({ width: this.pageSize.x, height: this.pageSize.y });
            this.canvasesBack.push(canv);
        }

        this.currentElement = 0;

        // debug draws inner page size
        if(this.debug)
        {
            const ctx = canv.getContext("2d");
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 10;
            ctx.strokeRect(this.outerMargin.x, this.outerMargin.y, this.innerPageSize.x, this.innerPageSize.y);
        }
    }

    getPageSize() { return this.pageSize; }
    getCanvases() : HTMLCanvasElement[] 
    { 
        // if double-sided, alternate front and back
        if(this.pageSides != PageSides.SINGLE)
        {
            const arr = [];
            for(let i = 0; i < this.canvasesFront.length; i++)
            {
                arr.push(this.canvasesFront[i]);
                arr.push(this.canvasesBack[i]);
            }
            return arr;
        }

        return this.canvasesFront; 
    }
}