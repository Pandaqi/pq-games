export const maximumValue = (list:any[], filter:Function = (a:any) => a) : any =>
{
    let maxVal = -Infinity;
    for(const elem of list)
    {
        const val = filter(elem);
        maxVal = Math.max(maxVal, val);
    }
    return maxVal
}

export const maximumElements = (list:any[], filter:Function = (a:any) => a) =>
{
    const maxVal = maximumValue(list, filter);
    const arr = [];
    for(const elem of list)
    {
        if(filter(elem) != maxVal) { continue; }
        arr.push(elem);
    }
    return arr;
}

export const minimumValue = (list:any[], filter:Function = (a) => a) : any =>
{
    let maxVal = Infinity;
    for(const elem of list)
    {
        const val = filter(elem);
        maxVal = Math.min(maxVal, val);
    }
    return maxVal
}

export const minimumElements = (list:any[], filter:Function = (a:any) => a) =>
{
    const maxVal = minimumValue(list, filter);
    const arr = [];
    for(const elem of list)
    {
        if(filter(elem) != maxVal) { continue; }
        arr.push(elem);
    }
    return arr;
}