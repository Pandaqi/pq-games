import PdfBuilder from "./pdfBuilder"
import { jsPDF } from "./jspdf";

export default {
	scaleFactor: 3.7795, // standard conversion for PX to MM (270x210 for A4)
	extraDPIFactor: 1.66, // this seems a good compromise between sharp resolution and fast drawing/PDF download
	button: null,
    PdfBuilder: PdfBuilder,
    jsPDF: jsPDF,

    getPDFBuilder(config)
    {
        config.jsPDF = this.jsPDF;
        return new this.PdfBuilder(config);
    },

	getDPIScalar()
	{
		return this.scaleFactor * window.devicePixelRatio * this.extraDPIFactor;
	},

	getCreatePDFButton()
	{
		return document.getElementById('btn-create-pdf');
	},
}