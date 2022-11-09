import { dvi2html } from 'dvi2html';
import { Writable } from 'stream';
import * as library from './library';
import pako from 'pako';
import fetchStream from 'fetch-readablestream';

// document.currentScript polyfill
if (document.currentScript === undefined) {
  var scripts = document.getElementsByTagName('script');
  document.currentScript = scripts[scripts.length - 1];
}

// Determine where we were loaded from; we'll use that to find a
// tikzwolke server that can handle our POSTing tikz code
var url = new URL(document.currentScript.src);
// host includes the port
var host = url.host;
var urlRoot = url.protocol + '//' + host;

let pages = 1000;
var coredump;
var code;

async function load() {
  let tex = await fetch(urlRoot + '/tex.wasm');
  code = await tex.arrayBuffer();

  let response = await fetchStream(urlRoot + '/core.dump.gz');
  const reader = response.body.getReader();
  const inf = new pako.Inflate();
  
  try {
    while (true) {
      const {done, value} = await reader.read();
      inf.push(value, done);
      if (done) break;
    }
  }
  finally {
    reader.releaseLock();
  }

  coredump = new Uint8Array( inf.result, 0, pages*65536 );
}

function copy(src)  {
  var dst = new Uint8Array(src.length);
  dst.set(src);
  return dst;
}

async function tex(input) {
  if (input.match('\\\\begin *{document}') === null) {
    input = '\\begin{document}\n' + input;
  }
  input = input + '\n\\end{document}\n';

  library.deleteEverything();
  library.writeFileSync( "sample.tex", Buffer.from(input) );

  let memory = new WebAssembly.Memory({initial: pages, maximum: pages});
  
  let buffer = new Uint8Array( memory.buffer, 0, pages*65536 );
  buffer.set( copy(coredump) );
  
  library.setMemory( memory.buffer );
  library.setInput( " sample.tex \n\\end\n" );
  
  let results = await WebAssembly.instantiate(code, { library: library,
                                                      env: { memory: memory }
                                                    });

  return library.readFileSync( "sample.dvi" );
}

export async function TikZJax(root){
  await load();
  
  async function process(elt){
    var text = elt.childNodes[0].nodeValue;

    var div = document.createElement('div');    
    
    let dvi = await tex(text);
    
    let html = "";  
    const page = new Writable({
      write(chunk, _, callback) {
        html = html + chunk.toString();
        callback();
      }
    });

    async function* streamBuffer() {
      yield Buffer.from(dvi);
      return;
    }  

    let machine = await dvi2html( streamBuffer(), page );
    div.style.display = 'flex';
    div.style.width = machine.paperwidth.toString() + "pt";
    div.style.height = machine.paperheight.toString() + "pt";
    div.style['align-items'] = 'center';
    div.style['justify-content'] = 'center';        

    div.innerHTML = html;
    let svg = div.getElementsByTagName('svg');
    svg[0].setAttribute("width", machine.paperwidth.toString() + "pt");
    svg[0].setAttribute("height", machine.paperheight.toString() + "pt");
    svg[0].setAttribute("viewBox", `-72 -72 ${machine.paperwidth} ${machine.paperheight}`);

    elt.parentNode.replaceChild(div, elt);
  };

  var scripts = root.getElementsByTagName('script');
  var tikzScripts = Array.prototype.slice.call(scripts).filter(
    (e) => (e.getAttribute('type') === 'text/tikz'));

  tikzScripts.reduce( async (promise, element) => {
    await promise;
    return process(element);
  }, Promise.resolve());
};