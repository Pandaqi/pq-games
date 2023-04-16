import seedrandom from "./seedrandom";
import shuffle from "./shuffle"
import range from "./range"
import rangeInteger from "./rangeInteger"
import getTotalForKey from "./getTotalForKey"
import getWeighted from "./getWeighted"

export default {
    seedRandom(seedString) { return seedrandom(seedString); },
    shuffle: shuffle,
    range: range,
    rangeInteger: rangeInteger,
    getTotalForKey: getTotalForKey,
    getWeighted: getWeighted,
}