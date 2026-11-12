import { Vector2 } from "../../geometry/vector2";
import { convertPixelsToInches, getPageSizeSingle, makeSizeSplittable, PageOrientation, PageSize } from "./tools";
// @ts-ignore
import { jsPDF } from "./jspdf";

export interface PdfConfig 
{
    orientation?: PageOrientation,
    unit: string,
    format: number[],
    userUnit?: number,
    hotfixes?: string[],
}

export interface PdfPageConfig 
{
    orientation?: PageOrientation,
    pageSize?: PageSize,
    size?: Vector2, // just a raw size to set
    fileName?: string,
    jsPDF?:any,
    debugWithoutFile?: boolean,
    lossless?: boolean, // default = false, means we compress the PDF
    splitEnabled?: boolean,
    splitDims?: Vector2,
}

export class PdfBuilder 
{
    jsPDF : jsPDF
    fileName: string

    sizeSplittablePage : Vector2 // defined in PIXELS
    sizeSinglePage : Vector2

    images : HTMLImageElement[]
    debugWithoutFile : boolean
    lossless : boolean

    constructor(config:PdfPageConfig = {})
    {
        this.jsPDF = config.jsPDF ?? jsPDF;
        if(!this.jsPDF) 
        { 
            console.error("Can't create PDF builder without jsPDF library working."); 
            return;
        }
        
        this.debugWithoutFile = config.debugWithoutFile ?? false;
        this.lossless = config.lossless ?? false;
        this.sizeSinglePage = config.size ?? getPageSizeSingle(config);
        this.sizeSplittablePage = makeSizeSplittable(this.sizeSinglePage, config.splitDims);
        this.fileName = config.fileName ?? "Generated Game";
        this.reset();
    }

    reset() { this.images = [] }
    destroy() { this.reset(); }

    addImage(img:HTMLImageElement) { this.images.push(img); }
    addImages(imgs:HTMLImageElement[])
    {
        for(const img of imgs)
        {
            this.addImage(img);
        }
    }

    getFullSize() : Vector2 { return this.sizeSplittablePage; }
    getSinglePageSize() : Vector2 { return this.sizeSinglePage; }

    getPDFConfig() : PdfConfig
    {
        const pageSizeInches = convertPixelsToInches(this.sizeSinglePage);
        const orientation = pageSizeInches.x > pageSizeInches.y ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT;

        // If you use unit: "px" (and the hotfix), the PDF is FUNCTIONALLY the same
        // However, many programs will interpret it wrong and scale it wrong when using the pixel dimensions
        // Defining it with inches makes sure PDF readers all understand it's a high-resolution (300 DPI) image, while size is identical
        return {
            unit: 'in',
            format: [pageSizeInches.x, pageSizeInches.y],
            orientation: orientation,
            //hotfixes: ["px_scaling"]
        }
    }

    downloadPDF(customFileName = null)
    {
        if(this.debugWithoutFile)
        {
            return this.images.forEach((img) => { 
                img.style.maxWidth = "100%";
                document.body.appendChild(img);
            });
        }

        const pdfConfig = this.getPDFConfig();
        const doc = new this.jsPDF(pdfConfig);

        const pageSize = this.getSinglePageSize();
        const pageSizeInches = convertPixelsToInches(pageSize);

        // This simply places images, one per page, and creates a _new_ page each time after the first one
        // DOC: addImage(imageData, format, x, y, width, height, alias, compression, rotation)
        // compression values = NONE, FAST, MEDIUM, SLOW
        // NONE creates 100+ mb files, so don't use that
        const compressionValue = this.lossless ? "NONE" : "MEDIUM";
        for(var i = 0; i < this.images.length; i++) 
        {
            if(i > 0) { doc.addPage(); }
            doc.addImage(this.images[i], 'png', 0, 0, pageSizeInches.x, pageSizeInches.y, undefined, compressionValue);
        }

        const fileName = `${customFileName ?? this.fileName}.pdf`;
        doc.save(fileName);
    }
}