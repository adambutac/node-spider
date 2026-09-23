# node-spider
A nodejs link crawler written a very long time ago...

It builds a json map/DAG of a website quickly by visiting links in parallel

One-liner:

`npm install && npm src/index.js <https://target>`

See [example output](www.runescape.com.json)

## Build
`npm install` Init project

(optional) `npm run build` Minify into ./build/index.js 

## Usage
`npm run start <target>` to run the minified or simply `npm src/index.js`