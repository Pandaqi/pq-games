# PQ Games

This library powers Pandaqi Games. Over time, it has become a vast array of features and tools for working with _games_, _visuals_ and _printing_ on the web.

It's highly tailored to _my_ website. You won't be able to use the system directly, like plug-n-play. I'm sharing it for those interested and those who might want to nab parts of the code for their own project.

In the future, I hope to separate this into tools that anyone can readily use. (Believe it or not, a year or two ago I didn't even _have_ a unified toolchain and had lots of duplicate code across all my games.)

## What's inside?

PQ_CANVAS itself can simply create new canvases, do simple operations on them (like draw an image, maybe rotated or tinted), or get properties from them.

Most interesting is the large collection of subtools.

* PDF => provides a PdfBuilder class. Feed it images (of the entire page), then ask it for the PDF when done.
* GridMapper => feed it canvases/images, and it will neatly lay them out on _pages_. (Which you can then feed into the PdfBuilder to get the final PDF.)
* ResourceLoader => asynchronously loads images and can cut them into spritesheets, for easy drawing on a canvas. (Which you can give to the GridMapper when done.)
* Color => to manage simple HSL colors, lightening/darkening them.
* PHASER => for starting my board generators that use Phaser, and putting the output into a PDF
* SETTINGS => collects setting boxes on the page into a nice JavaScript object, which is passed along when you use the settings box
* TOOLS =>
  * `random`: a collection of functions for randomness, such as shuffling arrays or drawing elements with weighted probabilities
  * `geom`: geometric classes and functionality (points, lines, checking intersection, ...)

Quite often, this library works in tandem with my PQ_TOOLS. This supplies all sorts of handy functions, such as shuffling a list, seeded random number generators, or essential vector math for points and lines.

But I've separated them, because they do not need each other and fulfill different purposes. Only about 75% of my games only use PQ_CANVAS (and not PQ_TOOLS).

## TO DO (before it can go public)

* Probably separate jsPDF from this library again. (Also because that import somehow reveals personal information?)
* Completely remove dependency on Phaser?
* Write some solid documentation, add some example images
* I probably need some dependency for proper text management. I don't feel like writing it myself, and I really need nice text wrapping and stuff in the future.
* More "solidified" API

@TODO

## Roadmap for CANVAS

* Seperate all the functionality in main into their own submodules. (Like I did with Tools > Random )

## Roadmap (for TOOLS)

Finish the shapes (triangle, rectangle, hexagon, circle)

* Different ways to present (if applicable, such as a rectangle saved at center or by top left)
* Automatically calculate _points_ and _edges = lines_ (from whatever is given)
* Which should allow easy drawing (stroke or fill) on canvas
* Add a "polygon" class for general polygons

Add support for grids by default

* Creating a grid
* Smoothing / Relaxation of points
* Algorithms for creating a graph (perhaps even with pathfinding)

Probably want to move Color over here as well? (And add some helpers, like "give me X equidistant colors", or "give me a colorscheme", or "change color from format A to B")

Add SIGNALS/EVENTS support. Way cleaner coding than direct links and function calls.

## Documentation

@TODO


