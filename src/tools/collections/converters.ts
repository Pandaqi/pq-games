import { isObject } from ".";

export const booleanDictToArray = (dict:Record<string,boolean>) =>
{   
    const arr = [];
    for(const [key,val] of Object.entries(dict))
    {
        if(!val) { continue; }
        arr.push(key);
    }
    return arr;
}

export const mergeObjects = (target, source, overwrite = true) => 
{
    if (!source) return target;
  
    if (isObject(target) && isObject(source)) 
    {
      for (const key in source) 
      {
        if (isObject(source[key])) 
        {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeObjects(target[key], source[key], overwrite);
        } 
        else 
        {
          const keepValue = (target[key] != undefined) && !overwrite;
          if(!keepValue)
          {
            Object.assign(target, { [key]: source[key] });
          }
        }
      }
    }
  
    return target;
}