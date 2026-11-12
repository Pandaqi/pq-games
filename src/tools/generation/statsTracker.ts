import { maximumElements, minimumElements } from "../collections/extremes";
import { ensureDictionaryEntry } from "../collections/inits";
import { FrequencyExtreme } from "./balancedFrequencyPicker";

export class StatsTracker
{
    numPerType: Record<string, number>
    optionsPerType: Record<string, any[]>

    static DEFAULT_ELEM = {}

    register(type:string, elem:any = StatsTracker.DEFAULT_ELEM)
    {
        ensureDictionaryEntry(this.numPerType, type, 0);
        this.numPerType[type]++;
        ensureDictionaryEntry(this.optionsPerType, type, []);
        this.optionsPerType[type].push(elem);
    }

    unregister(type:string, elem:any = StatsTracker.DEFAULT_ELEM)
    {
        const idx = this.optionsPerType[type].indexOf(elem);
        if(idx < 0)
        {
            console.error("Can't unregister (" + type + "," + elem + ") from stats tracker; doesn't exist");
            return;
        }

        this.optionsPerType[type].splice(idx, 1);
        this.numPerType[type]--;
    }

    getExtreme(extreme:FrequencyExtreme)
    {
        const list = Object.keys(this.numPerType);
        const filter = (elem) => { this.numPerType[elem]; }
        if(extreme == FrequencyExtreme.LEAST) { return minimumElements(list, filter); }
        else if(extreme == FrequencyExtreme.MOST) { return maximumElements(list, filter); }
    }
}