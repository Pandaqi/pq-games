import type { Renderer } from "../../renderers/renderer";
import BookCoverData from "./bookCoverData";
import BookCoverDebugData from "./bookCoverDebugData";
import BookCoverTargetData from "./bookCoverTargetData";
import { convertCanvasToImage } from "../../layout/canvas/converters";
import { Vector2 } from "../../geometry/vector2";
import { BookCoverComponent, DrawerCallback } from "./bookCoverGenerator";
import { LayoutOperation } from "../../layout/layoutOperation";
import { ResourceLoader } from "../../layout/resources/resourceLoader";
// @ts-ignore
import { jsPDF } from "../pdf/jspdf";

export default class BookCoverVisualizer
{
    renderer: Renderer
    resLoader: ResourceLoader
    pageSize: Vector2
    debug: BookCoverDebugData
    bookData: BookCoverData
    targetData: BookCoverTargetData
    frontOnly = false

    backCallback: DrawerCallback
    spineCallback: DrawerCallback
    frontCallback: DrawerCallback

    constructor(ps:Vector2, bd:BookCoverData, td:BookCoverTargetData, db:BookCoverDebugData)
    {
        this.pageSize = ps;
        this.bookData = bd;
        this.targetData = td;
        this.debug = db;

        console.log(this);
    }

    makePrintWraparound()
    {
        this.frontOnly = false;
    }

    makeCover()
    {
        this.frontOnly = true;
    }

    setCallbacks(b:DrawerCallback, s:DrawerCallback, f:DrawerCallback)
    {
        this.backCallback = b;
        this.spineCallback = s;
        this.frontCallback = f;
    }

    setRenderer(r:Renderer)
    {
        this.renderer = r;
    }

    setResourceLoader(r:ResourceLoader)
    {
        this.resLoader = r;
    }

    convertInchesToPixels(inp:Vector2) : Vector2
    {
        return inp.clone().scale(300).ceil();
    }

    convertPixelsToInches(inp:Vector2) : Vector2
    {
        return inp.clone().div(300);
    }

    getSpineSizePixels() : Vector2
    {
        return this.convertInchesToPixels(this.getSpineSize());
    }

    // The "regular" function is for the full, raw size
    // The "content" function is for the size without bleed/margins, so where the actual content should be placed and resized
    getSpineSize() : Vector2
    {
        let spineX = (this.targetData.pageThicknessConstant ?? 0) + this.targetData.pageThickness * (this.bookData.numPages ?? 0);
        if(this.bookData.forcedSpineSize) { spineX = this.bookData.forcedSpineSize; } // this must be inches too
        return new Vector2(spineX, this.getPageSize().y);
    }

    getSpineSizeContentPixels() : Vector2
    {
        return this.convertInchesToPixels(this.getSpineSizeContent());
    }

    getSpineSizeContent() : Vector2
    {
        return new Vector2(this.getSpineSize().x, this.getPageSizeContent().y);
    }

    getSpineCenter() : Vector2
    {
        return this.getSpineSizePixels().scale(0.5);
    }

    getSpineAnchorContent() : Vector2
    {
        const diff = this.getSpineSizePixels().sub( this.getSpineSizeContentPixels());
        return new Vector2(0, 0.5*diff.y);
    }

    getSpineCenterContent() : Vector2
    {
        return this.getSpineAnchorContent().add( this.getSpineSizeContentPixels().scale(0.5));
    }

    getPageSizePixels() : Vector2
    {
        return this.convertInchesToPixels(this.getPageSize());
    }

    getPageSize() : Vector2
    {
        let bleed = this.targetData.bleed ?? new Vector2();
        if(this.frontOnly) { bleed = new Vector2(); }

        return new Vector2(
            1 * bleed.x + this.pageSize.x,
            2 * bleed.y + this.pageSize.y
        )
    }

    getPageSizeContentPixels() : Vector2
    {
        return this.convertInchesToPixels(this.getPageSizeContent())
    }

    getPageSizeContent() : Vector2
    {
        return this.pageSize.clone();
    }

    getCoverSize() : Vector2
    {
        if(this.frontOnly) { return this.getPageSizeContentPixels(); }

        const pageSize = this.getPageSize();
        const sizeInches = new Vector2(
            2 * pageSize.x + this.getSpineSize().x,
            pageSize.y
        )

        return this.convertInchesToPixels(sizeInches);
    }

    getPageCenter() : Vector2
    {
        return this.getPageSizePixels().scale(0.5);
    }

    getPageCenterContent(comp:BookCoverComponent) : Vector2
    {
        return this.getPageAnchorContent(comp).add( this.getPageSizeContentPixels().scale(0.5) );
    }

    getPageAnchorContent(comp:BookCoverComponent) : Vector2
    {
        const diff = this.getPageSizePixels().sub ( this.getPageSizeContentPixels() );
        if(comp == BookCoverComponent.BACK) 
        {
            return new Vector2(diff.x, 0.5*diff.y);
        }

        if(comp == BookCoverComponent.FRONT)
        {
            return new Vector2(0, 0.5*diff.y);
        }
    }

    getFileName() : string
    {
        const str = this.frontOnly ? "Book Cover" : "Print Wraparound";
        return "[" + this.bookData.name + "] " + str + "; Target " + this.targetData.key;
    }

    getResource(key:string)
    {
        return this.resLoader.getResource(key);
    }

    async draw()
    {
        // setup required stuff
        const group = this.renderer.prepareDraw();

        // do the individual drawing (back, spine, front)
        if(this.frontOnly) {
            group.add(this.frontCallback(this));
        } else {
            group.add(this.backCallback(this));

            const opSpine = new LayoutOperation({ pos: new Vector2(this.getPageSizePixels().x, 0) });
            group.add(this.spineCallback(this), opSpine);

            const opFront = new LayoutOperation({ pos: new Vector2(this.getPageSizePixels().x + this.getSpineSizePixels().x, 0) });
            group.add(this.frontCallback(this), opFront);
        }

        // combine and finalize
        const canv = await this.renderer.finishDraw({ group: group, size: this.getCoverSize() })
        const img = await this.addImage(canv);
        await this.createPDF(img);
    }

    async addImage(canv:HTMLCanvasElement) : Promise<HTMLImageElement>
    {
        const img = await convertCanvasToImage(canv);
        if(this.debug.noImage || this.targetData.noImage) { return img; }

        img.style.maxWidth = "100%";
        img.title = this.getFileName();
        document.body.appendChild(img);   
        return img;
    }

    async createPDF(img:HTMLImageElement)
    {
        if(this.debug.noPDF || this.targetData.noPDF) { return; }

        const size = this.convertPixelsToInches( new Vector2(img.naturalWidth, img.naturalHeight) );
        const pdfConfig = {
            unit: 'in',
            orientation: "landscape",
            format: [size.x, size.y],
        }

        const doc = new jsPDF(pdfConfig);
        // DOC: addImage(imageData, format, x, y, width, height, alias, compression, rotation)
        // compression values = NONE, FAST, MEDIUM, SLOW
        doc.addImage(img, 'png', 0, 0, size.x, size.y, undefined, 'MEDIUM');
        doc.save(this.getFileName());
    }
}