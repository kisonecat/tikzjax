import { dvi2html } from "dvi2html";
import { Writable } from "stream";
import * as library from "./library";
import pako from "pako";
import fetchStream from "fetch-readablestream";

const pages = 1000;

export async function load(wasmUrl, coredumpUrl) {
	const tex = await fetch(wasmUrl);
	const code = await tex.arrayBuffer();

	const response = await fetchStream(coredumpUrl);
	const reader = response.body.getReader();
	const inf = new pako.Inflate();

	try {
		while (true) {
			const { done, value } = await reader.read();
			inf.push(value, done);
			if (done) break;
		}
	}
	finally {
		reader.releaseLock();
	}

	const coredump = new Uint8Array(inf.result, 0, pages*65536);
	return async (input) => {
		if (input.match("\\\\begin *{document}") === null) {
			input = "\\begin{document}\n" + input;
		}
		input = input + "\n\\end{document}\n";

		library.deleteEverything();
		library.writeFileSync("sample.tex", Buffer.from(input));

		const memory = new WebAssembly.Memory({ initial: pages, maximum: pages });

		const buffer = new Uint8Array(memory.buffer, 0, pages*65536);
		buffer.set(copy(coredump));

		library.setMemory(memory.buffer);
		library.setInput(" sample.tex \n\\end\n");

		await WebAssembly.instantiate(code, {
			library: library,
			env: { memory: memory }
		});

		const dvi = library.readFileSync("sample.dvi");

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
		const machine = dvi2html(streamBuffer(), page);

		return { machine, html };
	};
}

function copy(src)  {
	const dst = new Uint8Array(src.length);
	dst.set(src);
	return dst;
}
