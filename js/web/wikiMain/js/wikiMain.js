
const WikiMayRun = new Promise(resolve => {
	window.addEventListener('foe-helper#loaded', evt => {
		resolve();
	}, {capture: false, once: true, passive: true});
});

let WikiProxy = {}
wiki_proxy_detect ()

async function wiki_proxy_detect () {
	
	
	while (typeof FH.proxy == "undefined" && typeof FH?.proxy == "undefined") await new Promise((resolve) => {
		// @ts-ignore
		requestIdleCallback(resolve);
	});
	if (typeof FH.proxy == "undefined") {
		WikiProxy = FH.proxy;
	} else {
		WikiProxy = FH.proxy;
	}

	window.dispatchEvent(new CustomEvent('foe-wiki#proxyloaded'));
	
	await WikiMayRun;	
	
	div = document.createElement("div");
	div.id = "WikiOpenButton";
	div.title = "Open Wiki Helper Box";
	div.onclick = WikiBox.show;
	$("#game_body").append(div);
}

WikiBox = {
	tabs: {},
	selected: "CumulativeTech",

	show: () => {
		if ($('#WikiBox').length < 1) {

           FH.HTML.Box({
                'id': 'WikiBox',
                'title': 'Helper for extracting data from Game to wiki',
                'auto_close': true,
                'dragdrop': true,
                'minimize': true,
                'resize': true,
            });

			body='<div id="WikiTabber" class="btn-group">'
			for (tab in WikiBox.tabs) {
				if (!WikiBox.tabs[tab]) continue;
				body += `<div class="WikiTab btn ${tab==WikiBox.selected?'btn-active':''}" data-tab="${tab}" onclick="WikiBox.update(event)">${WikiBox.tabs[tab].title}</div>`
			}			
			body+='<input type="checkbox" id="OpenWiki" checked>Open link to Wiki</input></div><div id="WikiOutput"></div>'
			$("#WikiBoxBody").html(body)

            WikiBox.update();

        } else {
           FH.HTML.CloseOpenBox('WikiBox');
        }
	},
	update: async (evt) => {
		let tab="";
		if (evt) {
			WikiBox.selected = evt.target.dataset.tab;
			$('.WikiTab').removeClass('btn-active');
			evt.target.classList.add('btn-active');
		}
		tab = WikiBox.selected;
		
		$('#WikiOutput').html(await WikiBox.tabs[tab].html());
		if (WikiBox.tabs[tab].callback) WikiBox.tabs[tab].callback()
	},
	test:()=>{
		return "test"
	}

}