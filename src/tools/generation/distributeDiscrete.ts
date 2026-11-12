export const distributeDiscrete = (value:number, numParts:number, bucketMin = 1, bucketMax = Infinity) : number[] => 
{
    const dist = new Array(numParts).fill(bucketMin);
    value -= bucketMin*numParts;

    const openBuckets = [];
    for(let i = 0; i < numParts; i++)
    {
        openBuckets.push(i);
    }

    const maxPossibleSum = bucketMax * numParts;
    if(value > maxPossibleSum) { 
        console.error("Can't distribute " + value + " over " + numParts + " parts, with bucketMax set to " + bucketMax);
        return [];
    }

    let runningSum = 0;
    while(runningSum < value)
    {
        let openBucketIndex = Math.floor(Math.random() * openBuckets.length);
        let bucketIndex = openBuckets[openBucketIndex];
        dist[bucketIndex] += 1;
        runningSum += 1;

        const isFull = dist[bucketIndex] >= bucketMax;
        if(isFull)
        {
            openBuckets.splice(openBucketIndex, 1);
        }
    }

    return dist;

}