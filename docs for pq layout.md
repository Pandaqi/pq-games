# Documentation

PQ Layout is basically a simplified version of the CSS box model, but designed so you can use _JavaScript_ to create intricate designs on an HTML _canvas_. I use it to randomly generate physical material for my games (such as playing cards) on the website.

Many parts are not available, because they are pretty useless when it comes to _physical material_ with a _fixed size_. On the other hand, more advanced functionality is built in (if I really need a lot).

In this documentation, I'll use _playing cards_ as the example. Each playing card is one _canvas_ on which this layout is drawn.

## A layout

Any design is a tree of **containers** (or "boxes"). The first container will simply be one that's the size of your entire area ( = the playing card).

Containers can take any number of containers as children. They can only have one parent.

A layout is drawn in two phases.

* Calculate the proper values (dimensions, position, border, ...).
* Display the final tree.

When calculating, we use all the rules and properties (set on the containers) to find the right size and placement for them.

{{% example %}}
If a container says their width is `50%`, then it must calculate their _actual_ width by taking the size of their parent and multiplying by `0.5`
{{% /example %}}

Once calculated, displaying is rather simple.

* Each container draws its children. (Who draw their children, who draw their children, ...)
* Every container has some default properties it can always apply. (Such as a fill for the whole background or a border around its box.)
* Only "leaf nodes" (with no more children) draw actual content. These are your images, text, shapes, etcetera.

Dimensions are fully known. These operations just draw the right thing at the right location and size.

### Containers

The available containers are

* `Container` (base class extended by all)
* `ContainerImage` (needs a ResourceImage to show, maintains ratio by default)
* `ContainerText` (takes text parameter and an optional TextConfig with how to display it)
* `ContainerShape` (@TODO)

### How values are calculated

Every container has four big properties: **Box**, **Props**, **Flow** and **Background**. These come in pairs; e.g. `BoxInput` and `BoxOutput`.

The first one collects all the parameters and properties in their raw form. (Wrapped inside classes and enums.)

When it comes time to calculate/draw the layout, it _converts_ this input to the output class. It turns all the settings and properties into actual values. As such, when displaying, it should _only_ use the "output" variants and they should be correct.

* Box: for position and dimensions.
* Props: for any other visual properties
* Flow: everything related to flow layouts
* Background: everything related to the background for this element

### Content Box

Each box has several important dimensions with slight differences. These are calculated automatically and stored in `boxOutput` (with all other calculated values for dimensions and position).

* `size`: the full size of this container (including padding and border)
* `sizeContent`: the full size of what's _inside_ our container (excluding padding)
* `offsetTop` and `offsetBottom`: these include the padding of our _parent_ and our _margin_. (Also our border _if_ it's placed to outside or middle.) This decides the **top left origin** of this container.
* `anchorTop` and `anchorBottom`: these include our own padding. This decides the **top left origin** of the content of our container. (Padding is always empty whitespace, so our "content box" always starts from anchor.)
* `usableParentSize`: when properties depend on parent dimensions, they shouldn't use their "actual" dimensions. A size of "100%" should mean our container is exactly as large as the maximum _content_ the parent can handle. This value is equal to that.

Any positions calculated by the system are "local" by default. (The origin `(0,0)` is the top left origin of the container, not of the entire canvas.)

As such, any location calculated by the system needs the `anchor` position added to it. To offset it to its rightful position. (When drawing, we traverse the tree to get our _global_ position, and add that to all positions.)

### Flow layouts

These work as follows.

* The parent moves through its children and calculates how much space is available.
* It distributes this available space over the children (listening to their dimensions and grow/shrink parameters), by setting `resizeAbsolute` on their `flowInput`.
* With the new dimensions calculated, it now aligns the children. It does so by setting `position` on their `flowInput`
* When it comes time for such a child to calculate itself, it reads those settings and resizes/moves accordingly.

Currently, this works for most cases, but not all (yet).

### Ghost

Any element can set `ghost` to true. This will ...

* Skip it when calculating the raw size of a container's _content_.
* Skip it when calculating a flow layout.

In other words, the element is on a lone island and doesn't influence the rest of the layout. This allows it to move around and resize freely, with no other elements affected.

### Anchor

Set the `anchor` property to align an item inside their parent. 

* TOP_LEFT
* TOP_CENTER
* TOP_RIGHT
* CENTER_LEFT
* CENTER_CENTER
* CENTER_RIGHT
* BOTTOM_LEFT
* BOTTOM_CENTER
* BOTTOM_RIGHT

This overrides any position set or calculated.

## Calculating

Calculation has up to three phases.

* **FIXED**: each container calculates its own size based on what it already _knows_ (for sure), then asks its children to do the same.
* **DYNAMIC**: now that we now the size of our _children_ (our content), calculate anything we didn't know yet. Then ask your children to update as well.
* **FLOW**: now that all sizes are known, any flex layouts will do their magic, updating themselves and their children one more time.

Later phases are skipped if possible. (None of our children depend have a dynamic size and/or no flow layout is in play.)

{{% example %}}
Say we have an image inside a container. We want it to display full size, but aligned to the right.

* **FIXED (1)** The container has no predefined size: we want it to grow naturally with the image. 
* **DYNAMIC (2)** So we ask our image to calculate its dimensions, which means it gives back its original size
* **FIXED (1)** Now that we know the size of our content, we set the container to the same thing.
* **FIXED (2)** Now that the container has the right size, we know what "align to the right" means, so the image moves to the right spot. (Width of container - Image width)
{{% /example %}}

### Certain Information

Dimensions have four properties: `x`, `y`, `width`, `height`.

All of these can be ...

* Unset (grow with content)
* Fixed (an absolute value)
* Dynamic (percentage of parent container)

In the first case, we need that POST phase to get our dimensions. In the other cases, they don't depend on our children, so we don't.

NOTE: There's also `offset` which is a custom offset that is added to the position _after_ all the calculations. (For precise or manual adjustments.)

NOTE: There's also `keepRatio` which is a number (the desired ratio). This can only be calculated once we know at least _one_ of our sides.

### Boundaries

Each dimension can also be bounded. For example, `x` has `xMin` and `xMax` properties.

The calculated number for a dimension is always clamped within this range. These never depend on our children, only our parent, and are thus always calculated (at the END of the whole calculation).

### Margin, Padding, Stroke

The familiar CSS properties: `margin`, `padding`, and `stroke` (or border).

* Margin is empty space _around_ the container.
* Padding is empty space _within_ the container.
* And the border is what separates the two.

The dimensions of a container are always **including padding and border**, but **without margin**.

For example, say a container has padding 10 and its child margin 5. Then the position of its child will be offset by 10 + 5 = 15 from the parent container's top-left position (on both axes).

Margin and Padding are a `FourSideValue`: you can set each side separately or one for all. These are just numbers.

The Stroke is more complicated. It needs a `StrokeValue` with four properties.

* `placement`: inside, middle, or outside
* `width`: thickness of the stroke
* `color`: color of the stroke
* `style`: for dotted or image strokes

## Flow & Grid

By default, it places all children separately, ignoring each other. (If you don't set a different position or anchor, they'll all stack on top of each other.)

This can be changed with the `flow` property. Set it to `grid` to get something similar to a flexbox in CSS.

* `dir` sets the flow direction (horizontal or vertical)
* `wrap`: whether to force everything on the same line, or to allow wrapping
* `gap` sets the amount of space between children
* `alignFlow`: how to align the items in the flow direction
* `alignStack`: how to align items in the other direction

## Display

### Canvases on Canvases

For each container, a new canvas is created. (For increased performance, set `useFullSizeCanvas` in the config to false. This disallows drawing anything outside a container's bounds, however.)

The container _clips_ this canvas, if given a `clipPath`. (You can also set `clipBox` to true to clip anything outside the bounding box of a container by default.)

Then it asks its children to create their own canvas. Each canvas received is drawn on the bigger one.

As such, one `draw` call on the root container creates a chain of canvases until all containers are drawn, and then the chain bubbles back up and stamps all these results onto the final canvas.

### Common Properties

Each container has a `fill` color. It will simply fill its entire dimensions with that color. (Transparent by default. Same as _background color_ in css.)

The `alpha` parameter determines how transparent or opaque the _whole_ thing is.

The `z` (or `zIndex`) determines drawing order. This is just a number---higher values means things are drawn _on top_ of anything with a lower value.

The `borderRadius` allows for rounded corners.

# HTML2CANVAS

After struggling through implementing the box model myself, I relented and switched to using the power of browsers anyway.

With `toHTML`, the entire tree can be converted to an HTML + CSS format. (All properties, values, etcetera stay the same. In a sense, PQ Layout is now just a convenient wrapper for creating styled webpages.)

How does this work?

* Each container creates a `<div>` element
* A simple function on its properties (such as box and flow) copies their settings to this `<div>` as valid CSS.
* Then it ass its children to do the same, append their HTML element as a child to itself
* It returns the element it created. (Which, if called from the root container, now has the entire layout attached as a DOM tree.)

NOTE: This setting can be changed with the `config` property you can give to the (root) container, which is a `ContainerConfig` class. Nothing's stopping you from setting `renderEngine` back to Pandaqi, or from drawing parts of the canvas in a custom way _before_ stamping the rest of the tree on top of it.

NOTE: Currently, it uses the [modern screenshot](https://github.com/qq15725/modern-screenshot) library, as it's the most recent, well-supported and easiest to include.

## The easy properties

Many properties can be directly copied. I simply put the value (perhaps with `px` behind it or as a specific string) into a CSS value.

## Text

Text is simply drawn in a `<span>` node that's added as a child to the `ContainerText`. All text properties have direct CSS equivalents that work without issue.

## Images

Images can be directly drawn onto a canvas, which made this part very easy in my custom approach. 

In CSS, however, we have two options.

* An `<img>` or `<canvas>` element. (My ResourceLoader automatically chops a spritesheet into separate images.)
* The `background-image` property on any element. (With the "CSS sprite" trick I can display one specific frame from the entire spritesheet)

Both have advantages and disadvantages, so I supported both. Set the `displayMethod` parameter in a `ContainerImage` to either _image_ or _background_.

In either case, these are _sub elements_ of the container. They display at 100% width and height, and thus take over the size of the container.

## Anchor

To allow anchoring, we need more tricks. (Precisely why I built this system, because anchoring is something I need _a lot_, but isn't easily doable with raw CSS.)

* The container is added inside a "wrapper element"
* This wrapper is a `flexbox`, with the properties set in such a way that it leads to the correct anchor. (For example, a flexbox can align things to the _end_ by ... setting that property.)
* This wrapper is positioned `absolute`, to take it out of the page flow and allow it to be positioned anywhere.
* To allow centering (even if content is bigger than wrapper), I use the transform trick. (Example: `left:50%`, then `transform: translateX(-50%)`)

Whenever a wrapper is created, _that_ is returned from `toHTML()` (while the actual content div is given to children to append to).

NOTE: Set flex items to `shrink: 0` if you never want them to resize. Set the stack axis to `stretch` (and the corresponding dimension to rely on CONTENT) if you want it to fill the entire space. (Setting it to `100%` somehow doesn't always work.)

## Background

Even though _any_ element can be made a "ghost element", the range of background properties in CSS is just too powerful and useful not to support.

@TODO







# TODO: SVG support

* Elements are `<span>` by default if size is set to AUTO, otherwise `<div>`? => Should find an easy solution for text positioning and scaling

* Allow using an SVG image as a spritesheet. (When used, it places itself inside an SVG element and uses a clipPath to get the right frame.)
* Easily create and re-use gradients.
  * Create a Mask and Clip _effect_? 


# TODO: RenderEngine Pandaqi

## Bugs

* Flex resize. How to deal with things having relative sizes? => Wait, it SHOULD already handle that
* Test SPACE_AROUND align
* Test WRAP functionality
* The keepRatio thing is heavily bugged. (Only works in ideal scenarios.) => need to reconsider how such a thing works and how to approach it anyway

## Yet to implement

* In CSS, most units are relative to FONT SIZE (not parent container size). For example, padding can't be relative to that (as it would cause an infinite loop when calculating dimensions) => Copy this system in some way, perhaps by allowing a `baseSize` parameter (because my layout system rarely actually uses fonts)
* A PIVOT system. (Which allows me to mark any place on an element as its origin, not just top-left, so positioning becomes a lot more flexible and easy.)
* Create a suite of tests/debug layouts.
* ContainerShape
* Implement BORDER RADIUS + fully implement the border
  => Use `.lineCap = "round"` and `.lineJoin = "round"` (miterLimit?). Add a property to control this as well?
* Create native support for Heart Shape?
* Make sure masking works + all special properties you might need (such as scaling/moving the mask itself)
* Text => support stroke and shadow, letter-spacing/word-spacing, direction (vertical text, for example), text on a path?
* zIndex
  * Instead of drawing directly, simply return a "ContainerDraw" class (with location + thing we want to draw)
  * This list is sorted, then drawn in order.

# TODO: RenderEngine HTML2CANVAS

* A `background` object containing all relevant properties from CSS
* Allow _distorting_ image resolution/ratio on purpose.
* Unique text properties (see above)
* BorderImage
* Mask images
* (Offset is currently ignored, though I think I'll remove that in its entirety anyway?)

