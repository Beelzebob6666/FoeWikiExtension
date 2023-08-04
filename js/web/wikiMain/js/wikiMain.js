


wiki_proxy_detect ()

async function wiki_proxy_detect () {
	
	const proxyloaded = new Promise(resolve => {
		window.addEventListener('foe-helper#loaded', evt => {
			resolve();
		}, {capture: false, once: true, passive: true});
	});
	
	while (typeof FoEproxy == "undefined") await new Promise((resolve) => {
		// @ts-ignore
		requestIdleCallback(resolve);
	});

	window.dispatchEvent(new CustomEvent('foe-wiki#proxyloaded'));
	
	await proxyloaded;	
	
	div = document.createElement("div");
	div.id = "WikiOpenButton";
	div.title = "Open Wiki Helper Box";
	div.onclick = WikiBox.show;
	$("#game_body").append(div);
}

WikiBox = {
	tabs: {
		"CumulativeTech":{title: "Cumulative Tech", callback: () => {return CumulativeTech.display()}}
	},
	selected: "CumulativeTech",

	show: () => {
		if ($('#WikiBox').length < 1) {

            HTML.Box({
                'id': 'WikiBox',
                'title': 'Helper for extracting data from Game to wiki',
                'auto_close': true,
                'dragdrop': true,
                'minimize': true,
                'resize': true,
            });

			body='<div id="WikiTabber">'
			for (tab in WikiBox.tabs) {
				if (!WikiBox.tabs[tab]) continue;
				body += `<div class="WikiTab btn-default ${tab==WikiBox.selected?'btn-active':''}" data-tab="${tab}" onclick="WikiBox.update(event)">${WikiBox.tabs[tab].title}</div>`
			}			
			body+='<input type="checkbox" id="OpenWiki" checked>Open link to Wiki</input></div><div id="WikiOutput"></div>'
			$("#WikiBoxBody").html(body)

            WikiBox.update();

        } else {
            HTML.CloseOpenBox('WikiBox');
        }
	},
	update: (evt) => {
		let tab="";
		if (evt) {
			WikiBox.selected = evt.target.dataset.tab;
			$('.WikiTab').removeClass('btn-active');
			evt.target.classList.add('btn-active');
		}
		tab = WikiBox.selected;
		
		$('#WikiOutput').html(WikiBox.tabs[tab].callback());
	},
	test:()=>{
		return "test"
	}

}