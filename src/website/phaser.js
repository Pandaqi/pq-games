import Canvas from "../canvas/main"
import PDF from "../pdf/main"
import PdfBuilder from "../pdf/pdfBuilder"
import Settings from "./settings"
import { Game, CANVAS, Scale } from "../phaser.esm"

export default {
	phaserGame: null,
	gameConfig: {},
	pdfBuilder: null,
	generationClass: null,
	generationKey: "boardGeneration",

	getPhaserContainer()
	{
		return document.getElementById('phaser-container');
	},

	getConfig()
	{
		return this.gameConfig
	},
	
	setGenerationClass(obj)
	{
		this.generationClass = obj;
	},

	linkTo(scene, key = null)
	{
		this.setGenerationClass(scene);
		Settings.initBoard(true);
		if(key) { this.generationKey = key; }
	},

	onGenerationStart()
	{
		const btn = Settings.getGenerateBoardButton();
		if(!btn) { return; }
		btn.disabled = true;
		btn.style.opacity = 0.75;
		btn.innerHTML = '...';
	},

	onConversionDone(_scene) {
		// if we're building a collection, we don't immediately destroy/finalize after each image
		if(this.collection) { return; }

		this.phaserGame.destroy(true);
		this.pdfBuilder.onConversionDone();
		
		const cont = this.getPhaserContainer();
		if(cont) { cont.scrollIntoView({behavior: "smooth", block: "start"}); }

		const btn = Settings.getGenerateBoardButton();
		if(!btn) { return; }
		btn.disabled = false;
		btn.style.opacity = 1.0;
		btn.innerHTML = 'Regenerate';
	},

	start: function(cfg) {
		const phaserContainer = this.getPhaserContainer();
		if(!phaserContainer) { return console.error("Can't start Phaser without container."); }

		this.gameConfig = cfg;
		this.createPDFBuilder();

		const generationClass = this.generationClass || window.BoardGeneration;

		phaserContainer.innerHTML = '';
		var phaserConfig = {
			type: CANVAS,
			width: cfg.size.width,
			height: cfg.size.height,
			scale: {
				mode: Scale.FIT,
			},

			backgroundColor: cfg.bgColor || '#FFFFFF',
			parent: 'phaser-container',
			scene: [generationClass],
		}

		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

		this.phaserGame = new Game(phaserConfig);
		this.phaserGame.scene.start(this.generationKey, cfg);
		window.GAME = this.phaserGame; 

		this.onGenerationStart();

		// @NOTE: for some stupid fucking reason Phaser decides to add height=100% to body and html
		// so I need to immediately overwrite it, otherwise we jump to the top of the page
		// giving all the visitors a stroke (and generally a bad experience)
		document.documentElement.style.height = "";
		document.body.style.height = "";
		window.scrollTo(scrollLeft, scrollTop);
	},

	convertCanvasToImage: async function(scene) {
		if(!this.pdfBuilder) { console.error("Can't convert canvas to image. No PDF builder!"); return; }

		const phaserContainer = this.getPhaserContainer();
		phaserContainer.style.overflow = "visible";
		
		const canv = phaserContainer.firstChild;

		// must wait a bit to ensure Phaser canvas is actually redrawn
		await new Promise((resolve, reject) => setTimeout(resolve, 100));

		// convert, split if necessary, add to pdfBuilder
		const img = await Canvas.convertCanvasToImage(canv);
		const splitConfig = { split: this.gameConfig.splitBoard, cols: 2, rows: 2 };
		const images = await Canvas.splitImage(img, splitConfig);

		for(let i = 0; i < images.length; i++)
		{
			this.pdfBuilder.addImage(images[i]);
			phaserContainer.appendChild(images[i]);
		}

		// repeat the draw, but calling a different visualization function ("createSecretBoard")
		// @NOTE: hide the secret board after creating it
		if(this.gameConfig.secretBoard) {
			if(!scene.createdSecretBoard) { scene.createSecretBoard(); return; } 
			img.style.display = 'none'; 
		} 

		this.onConversionDone(scene);
	},

	createPDFBuilder()
	{
		if(this.pdfBuilder) { this.pdfBuilder.destroy(); }

		this.pdfBuilder = new PdfBuilder(this.gameConfig);
		this.gameConfig.size = this.pdfBuilder.getPageSize();
		this.pdfBuilder.connectConfig(this.gameConfig);
		this.pdfBuilder.connectButton(PDF.getCreatePDFButton());
		this.pdfBuilder.onGenerationStart();
	},

	startCollection()
	{
		this.createPDFBuilder();
		this.collection = true;
	},

	endCollection()
	{
		this.collection = false;
		this.onConversionDone();
	}
};