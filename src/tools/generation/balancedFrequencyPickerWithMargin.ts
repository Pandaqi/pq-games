import { fromArray } from "../random/pickers"

export interface FrequencyPickerWithMarginParams
{
    options?:string[]
    stats?:Record<string,number>,
    maxDist?:number,
    maxDistCustom?:Record<string,number>
    penaltyCustom?:Record<string,number>
}

export class BalancedFrequencyPickerWithMargin
{
    options:string[]
    maxDist:number
    maxDistCustom:Record<string,number> // a custom maxDist for certain elements
    penaltyCustom:Record<string, number> // if set, it "pretends" those types have X more than they have, so they lag behind everything else and are picked in consistently lower numbers
    stats:Record<string,number>

    constructor(params:FrequencyPickerWithMarginParams = {}) 
    {
        this.options = params.options ?? [];
        this.stats = params.stats ?? {};
        this.maxDist = params.maxDist ?? 1;
        this.maxDistCustom = params.maxDistCustom ?? {};
        this.penaltyCustom = params.penaltyCustom ?? {};
    }

    clone(deep = true)
    {
        const newOptions = deep ? this.options.slice() : this.options;
        const newStats = deep ? structuredClone(this.stats) : this.stats;
        return new BalancedFrequencyPickerWithMargin({ options: newOptions, maxDist: this.maxDist, stats: newStats });
    }

    getStats() { return this.stats; }

    pickAny(exclude = [])
    {
        const arr = [];
        for(const elem of this.options)
        {
            if(exclude.includes(elem)) { continue; }
            arr.push(elem);
        }
        return fromArray(arr);
    }

    pickNext() : string
    {
        // find frequency of least used option
        let leastUsedOption = null;
        let leastUsedFreq = Infinity;
        for(const option of this.options)
        {
            const freq = (this.stats[option] ?? 0) + (this.penaltyCustom[option] ?? 0);
            if(freq >= leastUsedFreq) { continue; }
            leastUsedFreq = freq;
            leastUsedOption = option;
        }

        // check how bad the situation is
        // any options still close to it are still considered as valid options
        const finalOptions = [];
        for(const option of this.options)
        {
            const freq = (this.stats[option] ?? 0) + (this.penaltyCustom[option] ?? 0);
            const dist = Math.abs(freq - leastUsedFreq);
            const tempMaxDist = this.maxDistCustom[option] ?? this.maxDist;
            if(dist > tempMaxDist) { continue; }
            finalOptions.push(option);
        }

        // then just draw a random one from those + register we did that
        const randOption = fromArray(finalOptions);
        this.registerStatChange(randOption);
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

    registerStatChange(option: string, num = 1)
    {
        if(!this.stats[option]) { this.stats[option] = 0; }
        this.stats[option] += num;
    }
}