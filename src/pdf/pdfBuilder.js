import PDF from "js/pq_games/pdf/main"
import { jsPDF } from "./jspdf";

export default class PdfBuilder {
    constructor(cfg = {})
    {
        this.jsPDF = cfg.jsPDF || jsPDF;
        if(!this.jsPDF) 
        { 
            return console.error("Can't create PDF builder without jsPDF library working."); 
        }
        
        this.button = null;
        this.buttonConfig = {};
        this.orientation = cfg.orientation || "landscape";
        this.size = this.calculatePageSize(cfg);
        this.buttonClickHandler = this.onPDFButtonClicked.bind(this);
        this.reset();
    }

    reset()
    {
        this.images = []
    }

    addImage(img)
    {
        this.images.push(img);
    }

    addImages(imgs)
    {
        for(const img of imgs)
        {
            this.images.push(img);
        }
    }

    destroy()
    {
        this.reset();
        this.removeButton();
    }

    removeButton()
    {
        if(!this.button) { return; }
        this.button.removeEventListener("click", this.buttonClickHandler);
    }

    connectConfig(cfg)
    {
        this.buttonConfig = cfg;
    }

    connectButton(btn, cfg)
    {
        this.removeButton();

        this.button = btn;
        this.button.addEventListener('click', this.buttonClickHandler);
    }

    onPDFButtonClicked(ev)
    {
        const btn = ev.currentTarget;
        btn.innerHTML = '...';
        btn.disabled = true;
        ev.preventDefault();
        ev.stopPropagation();

        // timeout prevents blocking/freezing the page
        const that = this;
        setTimeout(() => {
            that.downloadPDF(that.buttonConfig);
            btn.innerHTML = 'Download PDF';
            btn.disabled = false;
        }, 50);
        return false;
    }

    onGenerationStart()
    {
        this.reset();
        if(!this.button) { return; }
        this.button.style.display = 'none';
    }

    onConversionDone()
    {
        if(!this.button) { return; }
        this.button.style.display = 'inline-block';
    }

    calculatePageSize(cfg = {})
    {
        var scaleFactor = PDF.getDPIScalar();
        if(cfg.splitBoard) { scaleFactor *= (cfg.splitBoardFactor || 2.0); }

        const longSide = 297*scaleFactor;
        const shortSide = 210*scaleFactor;

        if(this.orientation == "landscape") { 
            return { width: longSide, height: shortSide };
        } else {
            return { width: shortSide, height: longSide };
        }
    }

    getPageSize()
    {
        return this.size;
    }

    getPDFConfig(cfg = {})
    {
        let fileName = cfg.gameTitle + ' (' + cfg.seed + ').pdf';
        if(cfg.customFileName) { fileName = cfg.customFileName + ".pdf"; }

        return {
            orientation: this.orientation,
            unit: 'px',
            format: [this.size.width, this.size.height],
            fileName: fileName
        }
    }

    downloadPDF(cfg = {})
    {
        const pdfConfig = this.getPDFConfig(cfg);
        const doc = new this.jsPDF(pdfConfig);
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // This simply places images, one per page, and creates a _new_ page each time after the first one
        // DOC: addImage(imageData, format, x, y, width, height, alias, compression, rotation)
        for(var i = 0; i < this.images.length; i++) {
            if(i > 0) { doc.addPage(); }
            doc.addImage(this.images[i], 'png', 0, 0, width, height, undefined, 'FAST');
        }

        doc.save(pdfConfig.fileName);
        return false;
    }
}