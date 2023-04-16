import PandaqiPhaser from "js/pq_games/website/phaser"

export default {
	init()
	{
		this.initGame();
		this.initBoard();
	},

	// This is for GAMES (hybrid/interactive)
	initGame(clean = false)
	{
		this.gameButtonCallback = this.onGameButtonClicked.bind(this);
		const startGameBtn = this.getStartGameButton();
		if(!startGameBtn) { return; }
		if(clean) { startGameBtn.onclick = null; }
		this.startGameBtn = startGameBtn;
		this.startGameBtn.addEventListener('click', this.gameButtonCallback);
	},

	onGameButtonClicked(ev)
	{
		ev.preventDefault();
		ev.stopPropagation();

		const cfg = this.readFrom(this.startGameBtn);
		window.localStorage.setItem(cfg.localstorage, JSON.stringify(cfg));
		
		if(cfg.singleClick)
		{
			this.startGameBtn.removeEventListener("click", this.gameButtonCallback);
		}

		if(cfg.stayOnPage) { return false; }
		
		const URL = cfg.targetURL || "game.html";
		return window.open(URL, "_blank");
	},

	// This is for BOARD generation (merely downloadable PDF)
	initBoard(clean = false)
	{
		this.boardButtonCallback = this.onBoardButtonClicked.bind(this);
		const generateBoardBtn = this.getGenerateBoardButton();
		if(!generateBoardBtn) { return; }
		this.generateBoardBtn = generateBoardBtn;
		if(clean) { generateBoardBtn.onclick = null; }
		generateBoardBtn.addEventListener("click", this.boardButtonCallback);
	},

	onBoardButtonClicked(ev)
	{
		const gameConfig = this.readFrom(this.generateBoardBtn);
		console.log("gameConfig", gameConfig);
		this.addDefaultParams(gameConfig);
		setTimeout(() => { PandaqiPhaser.start(gameConfig); }, 50);

		ev.preventDefault();
		ev.stopPropagation();
		return false;
	},

	getStartGameButton()
	{
		return document.getElementById('btn-start-game');
	},

	getGenerateBoardButton()
	{
		return document.getElementById('btn-generate-board');
	},

	addToConfig: function(cfg, id, val)
	{
		id = id.split("-");
		if(id.length == 3) {
			const subcat = id[1];
			const key = id[2];
			if(!(subcat in cfg)) { cfg[subcat] = {}; }
			cfg[subcat][key] = val;
		} else if(id.length == 2) {
			const key = id[1];
			cfg[key] = val;
		}
	},

	// override some crucial settings if not provided
	addDefaultParams: function(cfg = {})
	{
		const randomSeedLength = Math.floor(Math.random() * 6) + 3;
		const randomSeed = Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, randomSeedLength);
		const defaultParams = {
			seed: randomSeed,
			numPlayers: 4,
			inkFriendly: false,
			orientation: "landscape",
			gameTitle: "Title"
		}

		for(const key in defaultParams)
		{
			if(key in cfg && cfg[key]) { continue; }
			cfg[key] = defaultParams[key];
		}
	},

	bubbleUpFrom: function(node)
	{
		let containerClass = "game-settings-container";
		while(node)
		{
			const validContainers = node.getElementsByClassName(containerClass);
			if(validContainers.length > 0) { return validContainers[0]; }
			node = node.parentNode;
		}
		return null;
	},

	readFrom: function(startNode)
	{
		const container = this.bubbleUpFrom(startNode);
		if(!container) { return {}; }
		
		const inputs = Array.from(container.getElementsByTagName("input"))
						.concat(Array.from(container.getElementsByTagName("select")));

		let cfg = {};
		for(const input of inputs)
		{
			let val = input.value;
			if(input.type == "checkbox") { val = input.checked; }
			this.addToConfig(cfg, input.id, val);
		}

		cfg.localstorage = container.dataset.localstorage;
		cfg.targetURL = container.dataset.targeturl;
		cfg.stayOnPage = container.dataset.stayonpage;
		cfg.singleClick = container.dataset.singleclick;
		console.log(cfg);
		return cfg;
	}
};