import { ItemSize } from "../layout/gridMapper";
import { PageSides, PageSize } from "../tools/pdf/tools";
import type { GameConfig } from "./configuration";
import { SettingConfig, SettingType } from "./nodes";

export interface SettingsDefaultConfig
{
    type?: SettingType,
    folded?: boolean,

    resources?: SettingConfig,
    pageSize?: SettingConfig,
    pageSides?: SettingConfig,
    itemSize?: SettingConfig,
    inkFriendly?: SettingConfig,
    seed?: SettingConfig,
    splitDims?: SettingConfig,
    language?: SettingConfig,
}

const DEFAULT_SPLIT_OPTIONS = ["1x1", "2x2", "3x3", "4x4"];

export const getDefaultSettings = (config:GameConfig) => 
{
    const obj:SettingsDefaultConfig = 
    {
        type: SettingType.GROUP,
        folded: false
    };

    if(!config._game.noUploadingCustomResources)
    {
        obj.resources =
        {
            type: SettingType.INPUT,
            label: "(Custom) Assets",
            remark: "If not hosting this on a server, you MUST upload all files inside the assets folder yourself before generating!"
        }  
    }

    const languages = Object.keys(config._translation);
    if(languages.length > 1)
    {
        const defaultLanguage = config._translation.language ?? languages[0];
        obj.language = 
        {
            type: SettingType.ENUM,
            label: "Language",
            default: defaultLanguage,
            values: languages
        }
    }

    if(!config._game.noSeed)
    {
        obj.seed =
        {
            type: SettingType.TEXT,
            label: "Seed",
            default: "",
            remark: "Generations with the same settings and seed will yield identical results"
        }
    }

    if(!config._game.noInkFriendly)
    {
        obj.inkFriendly =
        {
            type: SettingType.CHECK,
            label: "Ink Friendly",
            default: false,
            remark: "Makes the material (mostly) grayscale and requiring less ink."
        }
    }

    const possibleItemSizes = config._generation.possibleItemSizes ?? Object.values(ItemSize);
    if(possibleItemSizes.length > 1)
    {
        obj.itemSize =
        {
            type: SettingType.ENUM,
            label: "Item Size",
            default: ItemSize.REGULAR,
            values: possibleItemSizes,
            remark: "Changes size of individual items (smaller items = more fit on single page)"
        }
           
    }
 
    const possiblePageSizes = config._generation.possiblePageSizes ?? Object.values(PageSize);
    if(possiblePageSizes.length > 1)
    {
        obj.pageSize =
        {
            type: SettingType.ENUM,
            label: "Page Size",
            default: PageSize.A4,
            values: possiblePageSizes,
            remark: "Changes size of entire page (to match your specific paper format if needed)"
        }
    }


    const possiblePageSides = config._generation.possiblePageSides ?? Object.values(PageSides);
    if(possiblePageSides.length > 1)
    {
        const defaultPageSides = config._game.pageSides ?? possiblePageSides[0];
        obj.pageSides =
        {
            type: SettingType.ENUM,
            label: "Page Binding / Sidedness",
            default: defaultPageSides,
            values: possiblePageSides,
            remark: "Whether to print single-sided, double-sided, or mix (single-sided but alternating with empty backside)"
        }
    }

    const possibleSplitDims = config._generation.possibleSplitDims ?? DEFAULT_SPLIT_OPTIONS;
    if(possibleSplitDims.length > 1)
    {
        obj.splitDims =
        {
            type: SettingType.ENUM,
            label: "Split Board",
            default: "1x1",
            values: possibleSplitDims,
            remark: "Split a single page into multiple ones (to stitch together into a giant board)"
        }
    }

    return obj;
}