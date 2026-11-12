export enum StrokePlacement {
    INSIDE,
    MIDDLE,
    OUTSIDE
}

export enum StrokeType {
    REGULAR = "solid",
    DASHED = "dashed"
}

export enum StrokeAlign
{
    INSIDE,
    MIDDLE,
    OUTSIDE
}

export type RepeatValueTwoAxis = { x: RepeatValue, y: RepeatValue };
export enum RepeatValue
{
    NONE,
    REPEAT,
    MIRROR
}