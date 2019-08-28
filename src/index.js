import os from 'os';
import fs from 'fs';
import url from 'url';
import http from 'http';
import https from 'https';

const VISITED_LINKS = {};
let OPEN_CONNECTIONS = 0;

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

function log(res, target) {
  console.log({
    link: target,
    statusCode: res.statusCode,
    headers: res.headers
  });
}

function scrape(map, home, target) {
  const homeUrl = url.parse(home);
  const targetUrl = url.parse(url.resolve(home, target));

  map[targetUrl.href] = {
    status: 'unresolved',
    path: `${map.path} => ${targetUrl.href}`
  };

  if(VISITED_LINKS[targetUrl.href]) {
    map[targetUrl.href].status = 'visited';
    return;
  }

  VISITED_LINKS[targetUrl.href] = map[targetUrl.href];

  if(!(targetUrl.hostname == null || targetUrl.hostname === homeUrl.hostname)) {
    map[targetUrl.href].status = 'external site';
    return;
  }

  let protocol = null;
  if(targetUrl.protocol === 'https:') protocol = https;
  else if(targetUrl.protocol === 'http:') protocol = http;
  else return;

  protocol.get(targetUrl.href, res => {
    map[targetUrl.href].status = res.statusCode;
    switch(res.statusCode) {
      case 200:
        let data = '';
        res.on('data', d => data+=d);
        res.on('end', () => {
          const links = data.match(/href=(\'|\")\S*(\'|\")/ig);
          if(links) {
            links.forEach(link => {
              link = link.split(/(\"|\')/ig)[2];
              scrape(map[targetUrl.href], home, link);
            });
          }
        });
        break;
      case 301:
      case 302:
        scrape(map[targetUrl.href], home, res.headers.location);
      break;
      default:
      //log(res, targetUrl.href);
    }
  }).on('abort', () => {
    console.log('abort');
  }).on('connect', () => {
    console.log('connect');
  }).on('continue', () => {
    console.log('continue');
  }).on('response', () => {
  }).on('socket', () => {
    OPEN_CONNECTIONS++;
  }).on('timeout', () => {
    console.log('timeout');
  }).on('close', () => {
    OPEN_CONNECTIONS--;
    if(map[targetUrl.href].status === 'unresolved') scrape(map, home, target);
    else {
    }
  }).on('error', e => {
    switch(e.code){
      case 'ECONNRESET':
        console.log('Connection reset');
      case 'ETIMEDOUT':
        console.log('Connection timed out')
        console.log(`retrying ${targetUrl.href}...`);
        scrape(map, home, target);
        break;
      default:
        console.log(e);
    }
  });
}

function main() {
  const site = process.argv[2];
  const siteUrl = url.parse(site);
  const map = {};
  scrape(map, site, '');
  const interval = setInterval(() => {
    console.log(`Connections: ${OPEN_CONNECTIONS}`);
    console.log(`MEM: ${process.memoryUsage().rss/1000000}MB`);
    if(OPEN_CONNECTIONS === 0){
      fs.writeFileSync(`${siteUrl.hostname}.json`, JSON.stringify(map, null, 4));
      clearInterval(interval);
    }
  }, 2000);
}

main();
