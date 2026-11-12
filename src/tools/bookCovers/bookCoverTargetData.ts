import { Vector2 } from "../../geometry/vector2";

interface BookCoverTargetData
{
    key: string, // unique ID for referencing target
    bleed: Vector2, // bleed around edges
    pageThickness: number, // the thickness of each individual page
    pageThicknessConstant?: number, // a base thickness for spine, mostly relevant for thick hardcover wrap
    colorModifiers?: Record<string,number> // any effects to apply
    spineExpansion?: number, // offset covers further away from spine, needed for hardcover
    noPDF?: boolean,
    noImage?: boolean
}

export default BookCoverTargetData