import { getWeighted } from "../random/pickers";
import { shuffle } from "../random/shufflers";
import { Bounds, BoundsObject } from "../numbers/bounds";

type propQuery = { prop: string, num: number };

export class BalancedDictionaryPicker
{
    dict:Record<string,any> // this holds all the original data, never modified
    numPerType:Record<string,any>
    typesPossible:string[]
    minOfProperties:propQuery[]
    maxOfProperties:propQuery[]
    template: string[]
    templateProp: string
    numBounds: BoundsObject;

    constructor(dict:Record<string,any> = {})
    {
        this.dict = structuredClone(dict);
        this.numPerType = {}
        this.template = [];
        this.numBounds = { min: 0, max: Infinity }
        this.typesPossible = []
        this.minOfProperties = [];
        this.maxOfProperties = [];
    }

    // Each property is an object { type: string, num: integer }
    // This forces NUM objects with that PROPERTY
    // You can also just give a string, in which case number is 1
    setMinOfProperties(list:(string|propQuery)[])
    {
        const arr = [];
        for(const elem of list)
        {
            if(typeof elem == "object") { arr.push(elem); continue; }
            const newElem = { prop: elem as string, num: 1 };
            arr.push(newElem);
        }
        this.minOfProperties = arr;
    }

    setMaxOfProperties(list:(string|propQuery)[])
    {
        const arr = [];
        for(const elem of list)
        {
            if(typeof elem == "object") { arr.push(elem); continue; }
            const newElem = { prop: elem as string, num: 1 };
            arr.push(newElem);
        }
        this.maxOfProperties = arr;
    }

    // A template is a list of string (properties) that must be the first thing included
    // Example, I can set properties to "score" and "board" and "misc", 
    // then force ONE of each to be added in each game with template ["score", "board", "misc"]
    setTemplate(t:string[], prop:string = null)
    {
        this.template = t;
        this.templateProp = prop;
    }

    pickPossibleTypes(config:Record<string,any>, numBounds:Bounds)
    {
        const tempPossible = [];

        // remove anything that is simply forbidden by default
        const tempDict = structuredClone(this.dict);
        for(const [key,data] of Object.entries(tempDict))
        {
            if(this.typeRequirementsMet(config, data)) { continue; }
            delete tempDict[key];
        }
        
        // check for blankly ("naively") required types with a simple "required: true" property, at the start
        for(const [key,data] of Object.entries(tempDict))
        {
            if(!data.required) { continue; }
            this.addPossibleType(tempPossible, tempDict, key);
        }

        // add elements with properties that should appear a MINIMUM of times
        for(const reqProp of this.minOfProperties)
        {
            let prop = reqProp.prop;
            let num = reqProp.num;

            const arr = this.getAllTypesWithProperty(tempDict, prop as string);
            shuffle(arr);
            
            const pickedTypes = arr.slice(0, Math.min(num, arr.length));
            for(const pickedType of pickedTypes)
            {
                this.addPossibleType(tempPossible, tempDict, pickedType);
            }
        }

        // add elements according to a template (if set)
        for(const templateProp of this.template)
        {
            let arr : string[];

            // we can check for specific VALUES of one property (given)
            if(this.templateProp) { arr = this.getAllTypesWithPropertyValue(tempDict, this.templateProp, templateProp); }

            // or we can check for the PROPERTY itself (existing is enough, value is irrelevant)
            else { arr = this.getAllTypesWithProperty(tempDict, templateProp); }
            
            if(arr.length <= 0) { continue; }

            const alreadyIncluded = tempPossible.filter(element => arr.includes(element)).length > 0;
            if(alreadyIncluded) { continue; }

            shuffle(arr);
            const pickedType = arr[0];
            this.addPossibleType(tempPossible, tempDict, pickedType);
        }

        // fill up the list with random draws
        const num = numBounds.randomInteger();
        this.numBounds = numBounds;
        while(tempPossible.length < num)
        {
            if(Object.keys(tempDict).length <= 0) { break; }

            const type = getWeighted(tempDict, "prob");
            this.addPossibleType(tempPossible, tempDict, type);
        }

        shuffle(tempPossible);

        this.typesPossible = tempPossible;
    }

    getAllTypesWithPropertyArray(list: string[], dict:Record<string,any>, prop: string)
    {
        const arr = [];
        for(const elem of list)
        {
            const data = dict[elem];
            if(!data[prop]) { continue; }
            arr.push(elem);
        }
        return arr;
    }
    
    getAllTypesWithPropertyValue(dict: Record<string, any>, prop:string, val:any)
    {
        const arr = [];
        for(const [key,data] of Object.entries(dict))
        {
            if(data[prop] != val) { continue; }
            arr.push(key);
        }
        return arr;
    }

    getAllTypesWithProperty(dict: Record<string, any>, prop: string)
    {
        const arr = [];
        for(const [key,data] of Object.entries(dict))
        {
            if(!data[prop]) { continue; }
            arr.push(key);
        }
        return arr;
    }

    getPossibleTypes()
    {
        return this.typesPossible;
    }

    typeIncluded(type: string)
    {
        return this.typesPossible.includes(type)
    }

    addPossibleTypeForced(type: string)
    {
        this.typesPossible.push(type);
    }

    removePossibleTypeForced(type: string)
    {
        this.typesPossible.splice(this.typesPossible.indexOf(type), 1);
    }

    addPossibleType(optionList: any[], dict: Record<string, any>, type: string)
    {
        const invalidType = (type == null || type == undefined);
        if(invalidType) { return; }

        const alreadyAdded = optionList.includes(type);
        if(alreadyAdded) { return; }

        const data = dict[type];

        const requiredInclusions = this.countRequiredInclusions(data);
        const projectedListSize = optionList.length + 1 + requiredInclusions;
        if(projectedListSize > this.numBounds.max) { return; }

        delete dict[type];
        optionList.push(type);
        this.handleRequiredInclusions(optionList, dict, data);
        this.handleRequiredExclusions(optionList, dict, data);
        this.handleMaxOfProperties(optionList, dict);
    }

    removePossibleType(optionList: any[], dict:Record<string,any>, type: string | number)
    {
        delete dict[type];
        optionList.splice(optionList.indexOf(type), 1);
    }

    countRequiredInclusions(data)
    {
        if(!data.requiredTypes) { return 0; }
        if(!Array.isArray(data.requiredTypes)) { return 1; }
        return data.requiredTypes.length;
    }

    handleMaxOfProperties(optionList: any[], dict:Record<string,any>)
    {
        for(const maxProp of this.maxOfProperties)
        {
            const prop = maxProp.prop;
            const num = maxProp.num;

            const typesChosen = this.getAllTypesWithPropertyArray(optionList, this.dict, prop);
            const typesLeft = this.getAllTypesWithProperty(dict, prop);
            const reachedMaxForThisProp = typesChosen.length >= num;
            if(reachedMaxForThisProp)
            {
                this.removeTypesFromDictionary(typesLeft, dict);
            }
        }
    }

    removeTypesFromDictionary(types: string[], dict:Record<string,any>)
    {
        for(const type of types)
        {
            delete dict[type];
        }
    }

    typeRequirementsMet(config: Record<string, any>, data: { unpickable: any; expansion: any[]; })
    {
        if(data.unpickable) { return false; }

        // check if expansions are available
        if(data.expansion)
        {
            if(!Array.isArray(data.expansion)) { data.expansion = [data.expansion] }
            for(const exp of data.expansion)
            {
                if(!config.expansions[exp]) { return false; }
            }
        }

        return true;
    }


    handleRequiredExclusions(optionList: any, dict:Record<string,any>, data:any)
    {
        if(!data.forbiddenTypes) { return; }
        if(!Array.isArray(data.forbiddenTypes)) { data.forbiddenTypes = [data.forbiddenTypes]; }
        this.removeTypesFromDictionary(data.forbiddenTypes, dict);
    }

    handleRequiredInclusions(optionList: any, dict: any, data: { requiredTypes: any[]; })
    {
        if(!data.requiredTypes) { return; }
        if(!Array.isArray(data.requiredTypes)) { data.requiredTypes = [data.requiredTypes]; }
        for(const tp of data.requiredTypes)
        {
            this.addPossibleType(optionList, dict, tp);
        }
    }

    getDataFor(type: string)
    {
        return this.dict[type];
    }

    getFullTypeList(num: number)
    {
        const list = [];
        const tempPossible = this.typesPossible.slice();

        // initialize proper values for all optional settings
        for(const data of Object.values(this.dict))
        {
            var minAbs = data.minAbs || 1;
            var minRel = data.minRel ? data.minRel * num : 1;
            data.min = Math.round(Math.max(minAbs, minRel));

            var maxAbs = data.maxAbs || Infinity;
            var maxRel = data.maxRel ? data.maxRel * num : Infinity;
            data.max = Math.round(Math.min(maxAbs, maxRel));
        }

        // first handle the minimum
        const tempDict = {};
        for(const type of tempPossible)
        {
            const data = this.getDataFor(type);
            tempDict[type] = structuredClone(data);
            for(let i = 0; i < data.min; i++)
            {
                this.pickType(tempPossible, list, tempDict, type);
            }
        }

        // then fill up randomly
        while(list.length < num)
        {
            const type = getWeighted(tempDict, "prob");
            this.pickType(tempPossible, list, tempDict, type);
        }

        shuffle(list);
        return list;
    }

    // as we register types, also count them + remove if maximum reached
    pickType(optionList: string[], list: any[], tempDict: {}, type: string)
    {
        list.push(type);

        if(!this.numPerType[type]) { this.numPerType[type] = 0; }
        this.numPerType[type]++;

        const data = this.getDataFor(type);
        if(this.numPerType[type] >= data.max)
        {
            this.removePossibleType(optionList, tempDict, type);
        }
    }
}