


wiki_proxy_detect ()

async function wiki_proxy_detect () {
	while (typeof FoEproxy == "undefined") await new Promise((resolve) => {
		// @ts-ignore
		requestIdleCallback(resolve);
	});

	window.dispatchEvent(new CustomEvent('foe-wiki#proxyloaded'));
	
}

