import { load } from "./TikZJax";

// document.currentScript polyfill
if (document.currentScript === undefined) {
	const scripts = document.getElementsByTagName("script");
	document.currentScript = scripts[scripts.length - 1];
}
const url = new URL(document.currentScript.src);

window.TikZJax = async function TikZJax(root){

	// Determine where we were loaded from; we"ll use that to find a
	// tikzwolke server that can handle our POSTing tikz code
	// host includes the port
	const host = url.host;
	const urlRoot = url.protocol + "//" + host;

	const tex = await load(urlRoot + "/tex.wasm", urlRoot + "/core.dump.gz");

	async function process(elt){
		const text = elt.childNodes[0].nodeValue;

		const div = document.createElement("div");

		const { machine, html } = await tex(text);

		div.style.display = "flex";
		div.style.width = machine.paperwidth.toString() + "pt";
		div.style.height = machine.paperheight.toString() + "pt";
		div.style["align-items"] = "center";
		div.style["justify-content"] = "center";

		div.innerHTML = html;
		const svg = div.getElementsByTagName("svg");
		svg[0].setAttribute("width", machine.paperwidth.toString() + "pt");
		svg[0].setAttribute("height", machine.paperheight.toString() + "pt");
		svg[0].setAttribute("viewBox", `-72 -72 ${machine.paperwidth} ${machine.paperheight}`);

		elt.parentNode.replaceChild(div, elt);
	};

	const scripts = root.getElementsByTagName("script");
	const tikzScripts = Array.prototype.slice.call(scripts).filter(
		(e) => (e.getAttribute("type") === "text/tikz"));

	tikzScripts.reduce( async (promise, element) => {
		await promise;
		return process(element);
	}, Promise.resolve());
}

window.LoadTikZJax = load;

if (!window.TikZJaxNoAutostart) {
	window.onload = () => TikZJax(document);
}
