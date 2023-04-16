import PdfBuilder from "js/pq_games/pdf/pdfBuilder"
import Canvas from "js/pq_games/canvas/main"

export default class GridMapper {
    constructor(params = {})
    {
        this.canvases = [];
        this.layoutShape = params.layoutShape || "rectangle"; // rectangle, hexagon, triangle, circle
        this.dims = params.dims || { x: 3, y: 3 };
        this.outerMargin = params.outerMargin || { x: 35, y: 35 };
        this.innerMargin = params.innerMargin || { x: 20, y: 20 };
        this.padding = { x: 0.0, y: 0.0 };
        this.currentElement = 0;

        this.pdfBuilder = params.pdfBuilder || new PdfBuilder(params);
        this.pageSize = this.pdfBuilder.getPageSize();
        this.innerPageSize = {
            x: (this.pageSize.width-2*this.outerMargin.x),
            y: (this.pageSize.height-2*this.outerMargin.y)
        }

        this.maxPixels = { 
            x: Math.floor( this.innerPageSize.x / this.dims.x ), 
            y: Math.floor( this.innerPageSize.y / this.dims.y )
        };

        // for non-rectangular layouts, tell the computer "trust me, this will fit in the fakeSize"
        this.fakeSize = Object.assign({}, this.innerPageSize);
        if(this.layoutShape != "rectangle")
        {
            if(this.layoutShape == "triangle") {
                this.fakeSize.x /= 0.5;
                this.fakeSize.y /= 0.85;

                // why is this needed? => the LAST tile still needs to be finished completely
                // now we pretend it's squished as well, so we compensate that by removing the extra size
                this.fakeSize.x -= (this.fakeSize.x/this.dims.x);
                this.fakeSize.y -= (1.0-0.85)*(this.fakeSize.y/this.dims.y);
            } else if(this.layoutShape == "hexagon") {
                this.fakeSize.x /= 0.5*(3/2);
                this.fakeSize.y /= 0.5*Math.sqrt(3);
                this.fakeSize.y -= 0.5*(this.fakeSize.y/this.dims.y); // that one offset column

                // why is this needed?
                this.fakeSize.x -= 0.375*(this.fakeSize.x/this.dims.x);
                this.fakeSize.y -= (1.0-0.5*Math.sqrt(3))*(this.fakeSize.y/this.dims.y);
            } else if(this.layoutShape == "circle") {
                this.fakeSize.x /= 0.66;
                this.fakeSize.y -= 0.5*(this.fakeSize.y/this.dims.y); // that one offset column
            }

            const nonSquareMaxPixels = {
                x: Math.floor( this.fakeSize.x / this.dims.x ),
                y: Math.floor( this.fakeSize.y / this.dims.y )
            }

            this.maxPixels = nonSquareMaxPixels;
        }

        if(params.dimsElement)
        {
            const ratio = (params.dimsElement.y / params.dimsElement.x);
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
            this.dims = {
                x: Math.floor( this.innerPageSize.x / this.maxPixels.x),
                y: Math.floor( this.innerPageSize.y / this.maxPixels.y),
            }
        }

        const spaceUsed = { x: this.maxPixels.x * this.dims.x, y: this.maxPixels.y * this.dims.y };
        spaceUsed.x *= (this.innerPageSize.x / this.fakeSize.x);
        spaceUsed.y *= (this.innerPageSize.y / this.fakeSize.y);
            
        // padding left/right/top/bottom around each element to center it
        this.padding = {
            x: (this.innerPageSize.x - spaceUsed.x) / this.dims.x,
            y: (this.innerPageSize.y - spaceUsed.y) / this.dims.y
        }

        this.elementsPerPage = this.dims.x * this.dims.y;

        if(isNaN(this.maxPixels.x) || isNaN(this.maxPixels.y)) { 
            console.error("GridMapper has NaN size for elements"); 
        }
    }

    getElementsPerPage()
    {
        return this.elementsPerPage;
    }

    getMaxElementSize()
    {
        return { width: this.maxPixels.x, height: this.maxPixels.y };
    }

    getMaxElementSizeAsSquare()
    {			
        const maxSize = this.getMaxElementSize();
        const smallestSize = Math.min(maxSize.width, maxSize.height);
        return { width: smallestSize, height: smallestSize };
    }

    addElement(elem)
    {
        this.addNewCanvasIfNeeded();

        const canv = this.canvases[this.canvases.length - 1];
        const col = this.currentElement % this.dims.x;
        const row = Math.floor(this.currentElement / this.dims.x);

        let offsetX = 0, offsetY = 0;
        let colFactor = 1, rowFactor = 1;

        // @NOTE: values below must be exact inverse of the fakeSize extension above
        if(this.layoutShape == "hexagon") {
            colFactor = 0.5 * (3/2);
            rowFactor = 0.5 * Math.sqrt(3);
            if(col % 2 == 1) { offsetY = 0.5 * rowFactor * this.maxPixels.y; }
        } else if(this.layoutShape == "triangle") {
            colFactor = 0.5;
            rowFactor = 0.85; //(0.5 * 1.66)
        } else if(this.layoutShape == "circle") { 
            colFactor = 0.66;
            rowFactor = 0.66;
            if(col % 2 == 1) { offsetY = 0.5 * rowFactor * this.maxPixels.y; }
        }

        let x = Math.floor(this.outerMargin.x + offsetX + col * (colFactor * this.maxPixels.x + this.padding.x));
        let y = Math.floor(this.outerMargin.y + offsetY + row * (rowFactor * this.maxPixels.y + this.padding.y));

        const scaleX = (this.maxPixels.x - this.innerMargin.x) / elem.width;
        const scaleY = (this.maxPixels.y - this.innerMargin.y) / elem.height;
        const finalScale = Math.min(scaleX, scaleY);

        const finalWidth = Math.floor(elem.width * finalScale);
        const finalHeight = Math.floor(elem.height * finalScale);

        console.log("see elem with", elem.width, elem.height);
        console.log("added elem with", finalWidth, finalHeight);

        let marginX = this.maxPixels.x - finalWidth;
        let marginY = this.maxPixels.y - finalHeight;
        x += 0.5*marginX + 0.5*this.padding.x;
        y += 0.5*marginY + 0.5*this.padding.y;

        const ctx = canv.getContext("2d");
        ctx.resetTransform();
        ctx.drawImage(elem, x, y, finalWidth, finalHeight);

        this.currentElement += 1;
    }

    addNewCanvasIfNeeded()
    {
        if(this.currentElement < this.elementsPerPage && this.canvases.length > 0) { return; }
        this.addNewCanvas();
    }

    addNewCanvas()
    {
        const canv = Canvas.createNew({ width: this.pageSize.width, height: this.pageSize.height });
        this.canvases.push(canv);
        this.currentElement = 0;
    }

    getCanvases()
    {
        return this.canvases;
    }
}