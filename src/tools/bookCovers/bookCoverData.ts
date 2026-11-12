interface BookCoverData
{
    name?: string, // book name
    subtitle?: string, // book subtitle
    series?: string, // series name
    index?: number, // book index in series
    blurb?: string, // short description on back book
    numPages?: number, // total number of pages (from PDF)
    choiceStory?: boolean, // if it's interactive or not
    forcedSpineSize?: number, // a custom spine y-size, forced/overrules calculations
    custom?: Record<string,any>
}

export default BookCoverData