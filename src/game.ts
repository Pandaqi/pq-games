import { generateMaterial } from "./generateMaterial";
import { loadSettings } from "./settings/nodes";

export const defaultGameCallback = async (config) =>
{
    const btn = config._settings.meta.button;
    btn.innerHTML = "... generating ...";
    await generateMaterial(config);
    btn.innerHTML = "Generate!";
}

export const loadGame = (config:Record<string,any>) =>
{
    window.addEventListener("load", () => 
    {
        loadSettings(config, defaultGameCallback);
    });
}