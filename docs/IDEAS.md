# Next steps and future feature ideas

- Color contrast manager that compares foreground verses background hues, tones, tints and shades to ensure `WCAG 2.2 AA` compliance.
- Review the current state of this library and find quality of life improvements for `CLI` users via preset parameters and arguments.
- Create all necessary markdown files to accommodate the preset `GitHub` documents that detail the library specifications and intent.
- Update all `**/README.md` files with any context for the library or directory that is not yet encapsulated in the provided content.
- Update filenames so they are always unique, use the current date and time in a `MM-DD-YYYY-24_HourTime` format after a "-" character.
- For the graph legend, only show colors and shapes that are available in the outputted chart/diagram.
- Create a separate generation flow for `<canvas>` element creation for raster image outputs that will be more performant for lerger projects.
- Change markers to be outlined (stroke), instead of solid (fill), if there are no direct file descendants.
- Create coordinate "deadzones" or "blacklist" regions in the SVG canvas that never have a node placed within their dimensions.
- Create commands that generates each type of chart output over all the provided `test/models`.
- Print the generated SVG directory hierarchy with Lines/Box/Draw characters that represent the file/folder structure.
- In package.json add a script command that generates all charts with all chart type possibilities over each test/models directory.
- Add feature flags around each parameter and all their tests/references, do this for all features so areas of the library can be enabled / disabled at will.
- Add store to track the dimensions and positioning of all nodes in the SVG output.
