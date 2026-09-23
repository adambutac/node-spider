import os from 'os';
import fs from 'fs';
import url from 'url';
import http from 'http';
import https from 'https';
import sqlite3 from 'sqlite3';

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

async function initDb(hostname) {
  const db = new sqlite3.Database(`${hostname}.db`);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("CREATE TABLE IF NOT EXISTS map (url TEXT PRIMARY KEY, status TEXT, path TEXT)", (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
  });
}

function saveToDb(db, url, status, path) {
  db.run("INSERT OR REPLACE INTO map (url, status, path) VALUES (?, ?, ?)", [url, status, path]);
}

function scrape(map, home, target, db) {
  const homeUrl = url.parse(home);
  const targetUrl = url.parse(url.resolve(home, target));

  const currentPath = map.path || '';
  const path = `${currentPath} => ${targetUrl.href}`;

  saveToDb(db, targetUrl.href, 'unresolved', path);
  map[targetUrl.href] = {
    status: 'unresolved',
    path: path
  };

  if(VISITED_LINKS[targetUrl.href]) {
    map[targetUrl.href].status = 'visited';
    return;
  }

  VISITED_LINKS[targetUrl.href] = map[targetUrl.href];

  if(!(targetUrl.hostname == null || targetUrl.hostname === homeUrl.hostname)) {
    saveToDb(db, targetUrl.href, 'external site', map[targetUrl.href].path);
    map[targetUrl.href].status = 'external site';
    return;
  }

  let protocol = null;
  if(targetUrl.protocol === 'https:') protocol = https;
  else if(targetUrl.protocol === 'http:') protocol = http;
  else return;

  protocol.get(targetUrl.href, res => {
    map[targetUrl.href].status = res.statusCode;
    saveToDb(db, targetUrl.href, res.statusCode, map[targetUrl.href].path);
    switch(res.statusCode) {
      case 200:
        let data = '';
        res.on('data', d => data+=d);
        res.on('end', () => {
          const links = data.match(/href=(\'|\")\S*(\'|\")/ig);
          if(links) {
            links.forEach(link => {
              link = link.split(/(\"|\')/ig)[2];
              scrape(map[targetUrl.href], home, link, db);
            });
          }
        });
        break;
      case 301:
      case 302:
        scrape(map[targetUrl.href], home, res.headers.location, db);
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
    if(map[targetUrl.href].status === 'unresolved') scrape(map, home, target, db);
    else {
    }
  }).on('error', e => {
    switch(e.code){
      case 'ECONNRESET':
        console.log('Connection reset');
      case 'ETIMEDOUT':
        console.log('Connection timed out')
        console.log(`retrying ${targetUrl.href}...`);
        scrape(map, home, target, db);
        break;
      default:
        console.log(e);
    }
  });
}

async function main() {
  console.log('> This spider climbs the web B^)')
  const site = process.argv[2];
  const siteUrl = url.parse(site);
  const hostname = siteUrl.hostname;
  const db = await initDb(hostname);
  const map = {};
  scrape(map, site, '', db);
  const interval = setInterval(() => {
    console.log(`Connections: ${OPEN_CONNECTIONS}`);
    console.log(`MEM: ${process.memoryUsage().rss/1000000}MB`);
    if(OPEN_CONNECTIONS === 0){
      fs.writeFileSync(`${hostname}.json`, JSON.stringify(map, null, 4));
      clearInterval(interval);
      db.close();
    }
  }, 2000);
}

main();
