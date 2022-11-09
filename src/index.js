import { TikZJax } from "./TikZJax";

window.TikZJax = TikZJax;
if (!window.TikZJaxNoAutostart) {
    window.onload = TikZJax(document);
}