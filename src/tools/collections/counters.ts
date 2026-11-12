export const countElementsInArray = <T>(arr:T[]) : Record<string, number> =>
{
    const counts:Record<string, number> = {};
    for(const elem of arr)
    {
        counts[elem as string] = (counts[elem as string] ?? 0) + 1;
    }
    return counts;
}