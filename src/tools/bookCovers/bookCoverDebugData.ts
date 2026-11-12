interface BookCoverDebugData
{
    noPDF: boolean, // @DEBUGGING (should be false); if true, creates no PDFs
    noImage: boolean, // @DEBUGGING (should be false); if true, creates no images
    noCover: boolean, // @DEBUGGING (should be false); whether to also create a standalone cover (not wraparound)
    targets: string[], // @DEBUGGING (should be empty); if has elements, only creates those targets
}

export default BookCoverDebugData