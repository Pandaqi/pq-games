export const arraysAreDuplicates = <T>(a:T[], b:T[]) =>
{
    if(a.length != b.length) { return false; }
    b = b.slice();
    for(const elem of a)
    {
        const idx = b.indexOf(elem);
        if(idx == -1) { return false; }
        b.splice(idx, 1);
    }
    return true;
}

export const anyMatch = <T>(a:T[], b:T[]) : boolean =>
{
    for(const elemA of a)
    {
        for(const elemB of b)
        {
            if(elemA == elemB) { return true; }
        }
    }
    return false;
}

// the item.constructor.name is used to exclude any class instances we want to preserve
export const isObject = (item:any) => 
{
  return (item && typeof item === 'object' && !Array.isArray(item) && item.constructor.name === "Object");
}