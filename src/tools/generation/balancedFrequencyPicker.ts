import { fromArray } from "../random/pickers"
import { StatsTracker } from "./statsTracker"

export enum FrequencyExtreme
{
    LEAST,
    MOST
}

export interface FrequencyPickerParams
{
    types?:string[]
    stats?:StatsTracker
    extreme?:FrequencyExtreme
}

export class BalancedFrequencyPicker
{
    types:string[]
    stats:StatsTracker
    extreme:FrequencyExtreme

    constructor(params:FrequencyPickerParams = {}) 
    {
        this.types = params.types ?? [];
        this.stats = params.stats ?? new StatsTracker();
        this.extreme = params.extreme ?? FrequencyExtreme.LEAST;
    }

    pickNext() : string
    {
        const options = this.stats.getExtreme(this.extreme);
        const randOption = fromArray(options);
        this.stats.register(randOption);
        return randOption;
    }

    pickMultiple(num:number) : string[]
    {
        const arr = [];
        for(let i = 0; i < num; i++)
        {
            arr.push(this.pickNext());
        }
        return arr;
    }
}