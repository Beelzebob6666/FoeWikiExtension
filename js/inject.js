// separate code from global scope
{
let scripts = {
	vendor: ["once", "primed"],
	internal: ["once", "primed"]
};
	
function scriptLoaded (src, base) {
	scripts[base].splice(scripts[base].indexOf(src),1);
	if (scripts.internal.length == 1) {
		scripts.internal.splice(scripts.internal.indexOf("once"),1);
		window.dispatchEvent(new CustomEvent('foe-wiki#loaded'));
	}
	if (scripts.vendor.length == 1) {
		scripts.vendor.splice(scripts.vendor.indexOf("once"),1);
		window.dispatchEvent(new CustomEvent('foe-wiki#vendors-loaded'));
	}
};


inject();


function inject (extUrl = chrome.runtime.getURL('')) {
	/**
	 * Loads a JavaScript in the website. The returned promise will be resolved once the code has been loaded.
	 * @param {string} src the URL to load
	 * @returns {Promise<void>}
	 */
	 function promisedLoadCode(src, base="base") {
		return new Promise(async (resolve, reject) => {
			let sc = document.createElement('script');
			sc.src = src;
			if (scripts[base]) {
				scripts[base].push(src);
			}
			sc.addEventListener('load', function() {
				if (scripts[base]) scriptLoaded(src, base);
				this.remove();
				resolve();
			});
			sc.addEventListener('error', function() {
				console.error('error loading script '+src);
				this.remove();
				reject();
			});
			(document.head || document.documentElement).appendChild(sc);
		});
	}
	
	async function loadJsonResource(file) {
		const response = await fetch(file);
		if (response.status !== 200) {
			throw "Error loading json file "+file;
		}
		return response.json();
	}

	const proxyloaded = new Promise(resolve => {
		window.addEventListener('foe-wiki#proxyloaded', evt => {
			resolve();
		}, {capture: false, once: true, passive: true});
	});

	const v = chrome.runtime.getManifest().version;

	InjectCode(extUrl);

	let tid = setInterval(InjectCSS, 0);
	function InjectCSS() {
		// Document loaded
		if(document.head !== null){
			
			let cssFiles = [
			];

			// insert stylesheet
			for(let i in cssFiles)
			{
				if(!cssFiles.hasOwnProperty(i)) {
					break;
				}
				let css = document.createElement('link');
				css.href = extUrl + `css/web/${cssFiles[i]}.css?v=${v}`;
				css.rel = 'stylesheet';
				document.head.appendChild(css);
			}

			clearInterval(tid);
		}
	}

	async function InjectCode(extUrl) {
				
		await promisedLoadCode(`${extUrl}js/web/proxydetect/js/proxydetect.js?v=${v}`, "proxy");
		await proxyloaded;
		// start loading both script-lists
		const vendorListPromise = loadJsonResource(`${extUrl}js/vendor.json`);
		const scriptListPromise = loadJsonResource(`${extUrl}js/internal.json`);
		
		// load all vendor scripts first (unknown order)
		const vendorScriptsToLoad = await vendorListPromise;
		await Promise.all(vendorScriptsToLoad.map(vendorScript => promisedLoadCode(`${extUrl}vendor/${vendorScript}.js?v=${v}`,"vendor")));
		
		scriptLoaded("primed", "vendor");
		
		// load scripts (one after the other)
		const internalScriptsToLoad = await scriptListPromise;

		for (let i = 0; i < internalScriptsToLoad.length; i++){
			await promisedLoadCode(`${extUrl}js/web/${internalScriptsToLoad[i]}/js/${internalScriptsToLoad[i]}.js?v=${v}`, "internal");
		}
				
		scriptLoaded("primed", "internal");
	}

}
	// End of the separation from the global scope
}
