# low-poly

A browser experiment: three low-poly floating islands rendered with Three.js,
with live controls for lighting, time of day, and per-island motion.

Everything is plain HTML, CSS, and JavaScript. There is no build step and no
package manager. Three.js r128 loads from a CDN.

## Installation

Clone the repo. That is the whole install.

```bash
git clone https://github.com/BryanZaneee/low-poly.git
cd low-poly
```

## Usage

Serve the directory and open `islands.html`. Any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/islands.html
```

Opening `islands.html` directly from the filesystem also works, since the
only external resource is the CDN script.

Once it loads:

- Drag to orbit the camera; click an island to focus on it.
- **Scene Controls** adjusts sun intensity, ambient light, and how fast the
  first island bobs.
- **Island Dev Tools** adjusts time of day and per-island rotation.

## Contributing

This is a personal experiment, not an active project. Fork it and do what you
like.

## License

No license file is included, so this is "all rights reserved" by default.
Open an issue if you want that changed.
