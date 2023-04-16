export default function getTotalForKey(obj, key)
{
    let sum = 0;
    for(const [elem, val] of Object.entries(obj))
    {
        if(!(key in val)) { val[key] = 1.0; }
        sum += val[key];
    }
    return sum;
}