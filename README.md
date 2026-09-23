# node-spider

A high-performance, lightweight Node.js web crawler designed to map the internal structure of a website.

## Overview

`node-spider` recursively crawls a target website, following internal links to build a JSON map (Directed Acyclic Graph) of the site's architecture. It leverages Node.js's asynchronous nature to visit pages in parallel, making it efficient for quickly analyzing site structures.

## Features

- **Recursive Crawling**: Automatically follows links to discover new pages.
- **Parallel Processing**: Visits multiple links simultaneously for faster mapping.
- **Domain Locking**: Only crawls links within the same hostname to avoid leaving the target site.
- **Cycle Prevention**: Keeps track of visited URLs to prevent infinite loops.
- **Redirect Handling**: Supports HTTP 301 and 302 redirects.
- **Fault Tolerance**: Includes basic retry logic for connection timeouts and resets.

## Installation

```bash
npm install
```

## Usage

### Running from Source
You can run the crawler directly using the source file:
```bash
node src/index.js <https://target-url>
```

### Running the Minified Version
First, build the project to generate a minified version:
```bash
npm run build
```
Then, start the crawler:
```bash
npm run start <https://target-url>
```

## Build Process

The project uses `terser` to minify the source code for distribution:
- `npm run build`: Minifies `src/index.js` into `build/index.mjs`.

## Example Output

The crawler generates a JSON object where keys are URLs and values contain the status of the page and the path taken to reach it. See [www.runescape.com.json](www.runescape.com.json) for a sample output.