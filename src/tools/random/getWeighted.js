import shuffle from "./shuffle"
import getTotalForKey from "./getTotalForKey"

export default function getWeighted(obj, key = "prob", RNG = Math.random)
{
    const isArray = Array.isArray(obj);
    const typesObject = obj;
    const totalProb = getTotalForKey(typesObject, key);
    const probFraction = 1.0 / totalProb;
    const targetRand = RNG();
    let runningSum = 0.0;
    let counter = 0;
    let lastElem = "";

    let typesList = Object.keys(typesObject);
    if(isArray) { typesList = obj; }

    shuffle(typesList); // to prevent order accidentally playing ANY role
    while(runningSum < targetRand)
    {
        lastElem = typesList[counter];
        if(isArray) { runningSum += lastElem[key] * probFraction; }
        else { runningSum += typesObject[lastElem][key] * probFraction; }
        counter += 1;
    }

    return lastElem;
}