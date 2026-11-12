import { Bounds, BoundsLike } from "../numbers/bounds";

export const range = (low:number|BoundsLike, high:number = 0, RNG = Math.random) : number =>
{
    if(typeof low == "object") 
    {
        const boundsObj = new Bounds(low); 
        low = boundsObj.min;
        high = boundsObj.max;
    }
    return RNG()*(high-low) + low;
}

export const rangeInteger = (low:number|BoundsLike, high:number = 0, RNG = Math.random) : number =>
{
    if(typeof low == "object") 
    {
        const boundsObj = new Bounds(low); 
        low = boundsObj.min;
        high = boundsObj.max;
    }
    return Math.floor(range(low, high+1, RNG));
}

// @SOURCE: https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
export const rangeNormal = (mean:number, std:number) : number =>
{
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return z * std + mean; // transform to the desired mean and standard deviation
}