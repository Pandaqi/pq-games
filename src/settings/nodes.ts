import { FeedbackNode } from "../tools/dom/feedbackNode";
import { isNumber } from "../tools/numbers/checks";
import { GameConfig, ensureConfigProperties } from "./configuration";
import { getDefaultSettings } from "./defaults";
import { STYLES } from "./styles";

export enum SettingType
{
    GROUP = "group",
    ENUM = "enum",
    CHECK = "checkbox",
    MULTI = "multi",
    NUMBER = "number",
    TEXT = "text",
    INPUT = "input",
    RADIO = "radio", // @TODO: not implemented yet because practically same as enum
}

export interface SettingConfig
{
    id?: string,

    type?: SettingType,
    label?: string,
    default?: any,
    remark?: string,
    placeholder?: string,

    value?: any,
    values?: any[],
    keys?: any[],

    min?: number,
    max?: number,
    step?: number,
}

const convertRecursive = (config:Record<string,any>, path:string, container:HTMLElement) =>
{
    for(const [key,data] of Object.entries(config))
    {
        if(typeof data !== "object") { continue; }
        const isProtectedProperty = ["meta"].includes(key);
        if(isProtectedProperty) { continue; }

        const newPath = path.length <= 0 ? key : `${path}.${key}`;
        if(data.type == SettingType.GROUP) {
            const newNode = document.createElement("div");
            newNode.classList.add("settings-group");
            newNode.dataset.folded = data.folded ? "true" : "false";

            const header = document.createElement("div");
            header.innerHTML = `Group: ${key}`;
            header.classList.add("settings-group-header")
            newNode.appendChild(header);

            const content = document.createElement("div");
            content.classList.add("settings-group-content");
            newNode.appendChild(content);

            container.appendChild(newNode);
            convertRecursive(data, newPath, content);
        } else {
            const newNode = convertSettingToHTML(newPath, data);
            container.appendChild(newNode);
        }
        
    }
}

const foldGroup = (node:HTMLElement) =>
{
    const content = node.getElementsByClassName("settings-group-content")[0] as HTMLElement;

    node.dataset.folded = "true";
    content.style.display = "none";
}

const unfoldGroup = (node:HTMLElement) =>
{
    const content = node.getElementsByClassName("settings-group-content")[0] as HTMLElement;

    node.dataset.folded = "false";
    content.style.display = "flex";
}

const makeGroupsFoldable = (container:HTMLElement) =>
{
    const nodes = Array.from(container.getElementsByClassName("settings-group")) as HTMLElement[];

    for(const node of nodes)
    {
        const header = node.getElementsByClassName("settings-group-header")[0] as HTMLElement;

        // simple fold/unfold system through clicks on the header
        header.addEventListener("click", (ev) => 
        {
            if(node.dataset.folded == "true") { return unfoldGroup(node); }
            return foldGroup(node);
        });

        // do a fake click to start folded (if needed)
        if(node.dataset.folded == "true")
        {
            foldGroup(node);
        }
    }
}

export const convertSettingsToHTML = (config:GameConfig, addDefaults = false) =>
{
    const container = document.createElement("div");
    container.classList.add("settings-container");
    if(addDefaults) { Object.assign(config._settings.defaults, getDefaultSettings(config)); }
    convertRecursive(config._settings, "", container);
    makeGroupsFoldable(container);
    return container;
}

export const convertSettingToHTML = (path:string, data:SettingConfig) =>
{
    const container = document.createElement("div");
    container.classList.add("settings-element");

    const key = path.split(".").pop();
    const label = document.createElement("label");
    container.appendChild(label);
    label.innerHTML = data.label ?? key; 
    label.setAttribute("for", path);

    if(data.remark)
    {
        label.innerHTML += ` <span class="settings-remark" title="${data.remark}">(?)</span>`;
    }

    const type = data.type ?? SettingType.CHECK;
    const defaultValue = data.default ?? data.value ?? 0;
    
    let elem;

    if(type == SettingType.ENUM)
    {
        elem = document.createElement("select");
        for(const value of data.values)
        {
            const option = document.createElement("option");
            option.value = value;
            option.innerHTML = value;
            elem.appendChild(option);

            const isDefault = value == defaultValue;
            if(isDefault) { option.selected = true; }
        }
    }

    if(type == SettingType.CHECK)
    {
        elem = document.createElement("input");
        elem.type = "checkbox";
        elem.checked = defaultValue ?? false;
    }

    if(type == SettingType.MULTI)
    {
        elem = document.createElement("div");
        elem.classList.add("settings-input-multi");

        const defaultValues = data.default ?? [];
        const values = data.values ?? [];
        for(const value of values)
        {
            const cont = document.createElement("div");
            elem.appendChild(cont);

            const label = document.createElement("label");
            cont.appendChild(label);
            label.innerHTML = value;

            const inp = document.createElement("input");
            cont.appendChild(inp);
            inp.type = "checkbox";
            inp.checked = defaultValues.includes(value);
            inp.dataset.value = value;
        }
    }

    if(type == SettingType.NUMBER)
    {
        elem = document.createElement("input");
        elem.type = "number";
        elem.min = data.min ?? 0;
        elem.max = data.max ?? 100;
        elem.step = data.step ?? 1;
        elem.value = defaultValue ?? 0;
    }

    if(type == SettingType.TEXT)
    {
        elem = document.createElement("input");
        elem.type = "text";
        elem.placeholder = data.placeholder ?? "... text here ...";
        elem.value = defaultValue ?? "";
    }

    if(type == SettingType.INPUT)
    {
        elem = document.createElement("input");
        elem.type = "file";
        elem.multiple = true;
        elem.accept = "audio/*,video/*,image/*,.woff2,.woff,.otf,.ttf";
    }

    elem.dataset.default = defaultValue;
    elem.name = path;
    elem.id = path;
    container.appendChild(elem);

    return container;
}

export const readSettingsFromHTML = (node:HTMLElement) =>
{
    const settingsElements = Array.from(node.querySelectorAll("input,select"));
    const obj = {};
    for(const elem of settingsElements)
    {
        // index into the object
        const path = elem.id.split(".");
        const key = path.pop();
        let curPosition = obj;
        for(const part of path)
        {
            if(!curPosition[part]) { curPosition[part] = {}; }
            curPosition = curPosition[part];
        }
        curPosition[key] = {};

        // then place the value at the right place
        let value;
        if(elem instanceof HTMLInputElement) {
            if(elem.type == "checkbox") { value = elem.checked; }
            else if(elem.type == "file") { value = elem.files; }
            else { value = elem.value }
        } else if(elem instanceof HTMLSelectElement) {
            value = elem.options[elem.selectedIndex].value;
        } else if(elem.classList.contains("settings-input-multi")) {
            const subInputs = Array.from(elem.querySelectorAll("input")) as HTMLInputElement[];
            const list = [];
            for(const input of subInputs)
            {
		if(!input.checked) { continue; }
                list.push(input.dataset.value);
            }
            value = list;
        }

        // all values are strings now; turn numbers back into numbers
        // (integers don't exist in JS; so parseFloat for all is fine)
        if(isNumber(value)) { value = parseFloat(value); }

        curPosition[key].value = value;
    }

    return obj;
}

const resetSettings = (node:HTMLElement) =>
{
    const settingsElements = Array.from(node.querySelectorAll("input,select"));
    for(const elem of settingsElements)
    {
        if(elem instanceof HTMLSelectElement)
        {
            elem.value = elem.dataset.default;
        }

        if(elem instanceof HTMLInputElement)
        {
            if(elem.type == "checkbox") { elem.checked = (elem.dataset.default == "true"); }
            else if(elem.type == "number" || elem.type == "text") { elem.value = elem.dataset.default; }
            else if(elem.type == "file") { elem.value = null; }
        }
    }
}

const changeFoldedStateAll = (node:HTMLElement, folded = false) =>
{
    const nodes = Array.from(node.getElementsByClassName("settings-group")) as HTMLElement[];
    for(const node of nodes)
    {
        if(folded) { foldGroup(node); }
        else { unfoldGroup(node); }
    }
}

export const loadSettings = (config:GameConfig, callback: Function, parent = document.body) =>
{
    // this is just a way to allow the raw object to be put in too, for easier out-of-framework usage
    // @ts-ignore
    if(!config._settings) { config = { _settings: config }; } 
    ensureConfigProperties(config);

    const container = document.createElement("div");
    container.classList.add("settings");
    parent.appendChild(container);

    const header = document.createElement("h1");
    header.innerHTML = config._game.name ?? config._game.fileName ?? "Game Settings";
    container.appendChild(header);

    // tools (reset, collapse/uncollapse all, etc)
    const tools = document.createElement("div");
    tools.classList.add("settings-tools");
    container.appendChild(tools);

    const resetButton = document.createElement("button");
    resetButton.innerHTML = "Reset to Defaults";
    tools.appendChild(resetButton);
    resetButton.addEventListener("click", () => {
        resetSettings(container);
    });

    const collapseButton = document.createElement("button");
    collapseButton.innerHTML = "Fold All Groups";
    tools.appendChild(collapseButton);
    collapseButton.addEventListener("click", () => {
        changeFoldedStateAll(container, true);
    });

    const uncollapseButton = document.createElement("button");
    uncollapseButton.innerHTML = "Unfold All Groups";
    tools.appendChild(uncollapseButton);
    uncollapseButton.addEventListener("click", () => {
        changeFoldedStateAll(container, false);
    });

    // convert settings into input elements
    const settingsList = convertSettingsToHTML(config, !config._game.noDefaultSettings);
    container.appendChild(settingsList);

    // and add a button that fires up the generation process when clicked
    const btn = document.createElement("button");
    btn.innerHTML = "Generate!";

    const progressInfo = document.createElement("div");
    progressInfo.classList.add("feedback-node-sub");
    
    const feedbackNode = new FeedbackNode(btn, progressInfo);
    btn.addEventListener("click", async () => 
    {
        config._settings.meta.button = btn;
        config._settings.meta.settingsContainer = container;
        config._settings.meta.feedbackNode = feedbackNode.signalReceiver;

        btn.disabled = true;

        const settings = readSettingsFromHTML(container);
        Object.assign(config._settings, settings);
        await callback(config);

        btn.disabled = false;
        if(config._settings.meta.selfDestroy) { container.remove(); }
    });

    settingsList.appendChild(btn);
    settingsList.appendChild(progressInfo);

    const style = document.createElement("style");
    style.innerHTML = STYLES;
    container.appendChild(style);
}