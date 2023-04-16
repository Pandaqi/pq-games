import PDF from "./pdf/main";
import PHASER from "./website/phaser";
import SETTINGS from "./website/settings";
import CANVAS from "./canvas/main";
import TOOLS from "./tools/main";
import Color from "./canvas/color";
import ResourceLoader from "./canvas/resourceLoader";
import GridMapper from "./canvas/gridMapper";

window.PQ_GAMES = {
    SETTINGS: SETTINGS,
    PHASER: PHASER,
    CANVAS: CANVAS,
    PDF: PDF,
    TOOLS: TOOLS,

    Color: Color,
    ResourceLoader: ResourceLoader,
    GridMapper: GridMapper,
};
