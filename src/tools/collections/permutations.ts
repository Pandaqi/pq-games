export const getAllPossibleCombinations = (options:string[], spaceLeft:number) =>
{
    if(spaceLeft <= 0) { return [[]]; } // this is the point of return in this recursive chain
    if(options.length <= 0) { return null; } // we have space left, but no options? Invalid combo!

    options = options.slice();
    const option = options.pop();

    const results = [];
    for(let i = 0; i <= spaceLeft; i++)
    {
        const arr = [];
        for(let a = 0; a < i; a++)
        {
            arr.push(option);
        }

        const newSpaceLeft = spaceLeft - i;
        const remainder = getAllPossibleCombinations(options, newSpaceLeft);
        if(!remainder) { continue; }

        for(const elem of remainder)
        {
            let arrCopy = arr.slice();
            arrCopy.push(elem);
            results.push(arrCopy.flat());
        }
    }

    return results;
}

export const getAllPossibleCombinationsRaw = <T>(set:T[]) =>
{
    const num = set.length;
    const possibleCombos = Math.pow(2, num);
    const allCombos:T[][] = [];
    for (var i = 0; i < possibleCombos; i++){

        let combo:T[] = [];
        for (var j = 0; j < num; j++) {
            if (!(i & Math.pow(2,j))) { continue; } // not part of this combination
            combo.push(set[j]);
        }
        if(combo.length <= 0) { continue; }

        allCombos.push(combo);
    }
    return allCombos;
}