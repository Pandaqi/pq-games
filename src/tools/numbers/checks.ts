const EPSILON = 0.00003;

export const isNumber = (input:any) =>
{
    if(typeof input == "number") { return true; }
    if(typeof input == "string")
    {
        // @SOURCE: https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
        // @ts-ignore
        return !isNaN(input) && !isNaN(parseFloat(input));
    }
    return false;
}

export const isZero = (num:number) =>
{
    return Math.abs(num) < EPSILON;
}

export const isBetween = (num:number, min:number, max:number) =>
{
    return num >= min && num <= max;
}

export const isApprox = (num:number, target:number) =>
{
    return isZero(num - target);
}