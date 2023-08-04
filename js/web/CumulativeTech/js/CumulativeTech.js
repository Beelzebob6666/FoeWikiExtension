CumulativeTech = {
	WikiTranslate: {...{
		residential:"{{ReBu}}",
		decoration:	"{{Deco}}",
		culture:	"{{CuBu}}",
		static_provider:	"{{Life Support}}",
		tower:"",
		street:	"{{IROA}}",
		random_production:"",
		production:	"{{PrBu}}",
		military:	"{{MiBu}}",
		goods:	"{{GoBu}}",
		map:	"[[File:ContinentMap.png|20x20px|Continent Map]] [[Continent Maps]]",
		guilds:	"[[File:Guilds.png|20x20px|Guilds]] [[Guild|Guilds]]",
		antiques_dealer:	"[[File:AntiquesDealer.png|20x20px|Antiques Dealer]] [[Antiques Dealer]]",
		friends_tavern:	"[[File:Friends_Tavern.png|20x20px|Friends Tavern]] [[Friends Tavern]]",
		events:	"[[File:Special-Events.png|20x20px|Events]] [[Events]]",
		special_resources:	"Unlocks [[Special Resources]]",
		great_building_contribution:	"[[File:GBContribution.png|20x20px|Great Buildings]] Contribution to [[Great Buildings]]",
		daily_challenges:	"[[File:Daily_Challenge.png|20x20px|Daily Challenges]] [[Daily Challenges]]",
		pvp_fights:	"[[File:PVP Fights.png|20x20px|PvP Fights]] [[PVP Tournaments|PvP Fights]]",
		guild_battlegrounds:	"[[Guild Battlegrounds]]",
		reconstruction_mode:	"[[File:ReconstructionMode.png|20x20px|Reconstruction Mode]] [[Reconstruction Mode]]",
		cultural_outpost:	"[[File:Cultural Settlements.png|20x20px|Cultural Settlements]] [[Cultural Settlements]]",
		cultural_outpost_mughals:	"[[File:Cultural Settlements.png|20x20px|Cultural Settlements]] [[Cultural Settlements|Mughal Settlement]]",
		cultural_outpost_aztecs:	"[[File:Cultural Settlements.png|20x20px|Cultural Settlements]] [[Cultural Settlements|Aztecs Settlement]]",
		pvp_arena: "[[File:PvP Arena Feature.png|20x20px|PvP Arena]] [[PvP Arena]]",
		social_bar: "[[File:Social bar icon.png|20x20px|Social Bar]] [[Friends|Social Bar]]",
		chat: "Unlocks Chat",

		StoneAge:	"Stone Age",
		AllAge: ""	,
		BronzeAge:	"Bronze Age",
		IronAge:	"Iron Age",
		EarlyMiddleAge:	"Early Middle Ages",
		HighMiddleAge:	"High Middle Ages",
		LateMiddleAge:	"Late Middle Ages",
		ColonialAge:	"Colonial Age",
		IndustrialAge:	"Industrial Age",
		ProgressiveEra:	"Progressive Era",
		ModernEra:	"Modern Era",
		PostModernEra:	"Postmodern Era",
		ContemporaryEra:	"Contemporary Era",
		TomorrowEra:	"Tomorrow Era",
		FutureEra:	"Future Era",
		ArcticFuture:	"Arctic Future",
		OceanicFuture:	"Oceanic Future",
		VirtualFuture:	"Virtual Future",
		SpaceAgeMars:	"Space Age Mars",
		SpaceAgeAsteroidBelt:	"Space Age Asteroid Belt",
		SpaceAgeVenus:	"Space Age Venus",
		SpaceAgeJupiterMoon:	"Space Age Jupiter Moon",
		SpaceAgeTitan:	"Space Age Titan",
	},...JSON.parse(localStorage.getItem("WikiCumTechSettings")||"{}")},
	Output:{},
	
	createOutput:() => {
		if (!Technologies.AllTechnologies) return;
		if (!MainParser.CityEntities) return;
		if (!GoodsData) return;
		CumulativeTech.Output = {}

		let numberWithCommas = (x) => {
			if (!x) return ""
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		};
		let trans = (x) => {
			if (CumulativeTech.WikiTranslate[x]) return CumulativeTech.WikiTranslate[x];
			return x;
		}
		let techs = {};
		let eras = {};
		for (let tech of Technologies.AllTechnologies) {
			techs[tech.id] = tech.name;
			eras[tech.id] = tech.era;
		}
		for (let tech of Technologies.AllTechnologies) {
			if (!CumulativeTech.Output[tech.era]) CumulativeTech.Output[tech.era] = [`This is a list of all [[Technology|technologies]] of the [[${trans(tech.era)}]].<div class="flex-container">`] 
			let wiki = "{{TechBoxNew|" + tech.name + "|" + tech.id;
			if (tech.maxSP) wiki += "|FP=" + numberWithCommas(tech.maxSP);
			if (tech.requirements.resources.money) wiki += "|Coins=" + numberWithCommas(tech.requirements.money);
			if (tech.requirements.resources.supplies) wiki += "|Supplies=" + numberWithCommas(tech.requirements.supplies);
			wiki += "|Age=" + trans(tech.era);
			wiki += "\n|Goods=";
			for (let g in tech.requirements.resources) {
				if (!tech.requirements.resources[g]) continue;
				if (g == "supplies" || g=="money") continue;
				wiki += `{{${GoodsData[g].name}}} ` + numberWithCommas(tech.requirements.resources[g]) + " ";
			}
			wiki += "\n|Requires=";
			let req=[];
			for (let t of tech.parentTechnologies) {
				req.push (`{{ITEC}} [[${tech.era != eras[t] ? trans(eras[t]) + " Technologies":""}#${techs[t]}|${techs[t]}]]`)
			}
			wiki += req.join("<br>");
			wiki += "\n|LeadsTo=";
			let lead=[]
			for (let t of tech.childTechnologies) {
				lead.push (`{{ITEC}} [[${tech.era != eras[t] ? trans(eras[t]) + " Technologies":""}#${techs[t]}|${techs[t]}]]`)
			}
			wiki += lead.join("<br>");
			wiki += "\n|Unlocks=";
			let unl=[]
			if (tech.rewards) {
				for (let r of tech.rewards) {
					if (r.type=="building") {
						unl.push (`${trans(MainParser.CityEntities[r.value].type)} [[${MainParser.CityEntities[r.value].name}]]`)
					} else if (r.type=="unlockable_feature") {
						unl.push (trans(r.value))

					} else if (r.type=="expansion") {
						unl.push (`{{Expa}} ${r.amount} Expansion`)

					} else if (r.type=="era_outpost_expansion") {
						unl.push (`{{ISIZ}} ${r.amount} Outpost Expansion`)

					} else if (r.type=="portrait") {
						unl.push (`{{IAVA}} [[Portraits#${r.subType}|Portrait ${r.name ? '"r.name"' : ''}]]`)

					} else if (r.type=="portrait") {
						unl.push (`{{IAVA}} [[Portraits#${r.subType}|Portrait ${r.name ? '"r.name"' : ''}]]`)
					
					} else if (r.type=="hub_upgrade") {
						unl.push (`{{IHAR}} [[${r.title}]]`)

					} else if (r.type=="hub_part") {
						unl.push (`{{HAR}} [[${r.title}]]`)

					} else if (r.type=="unlock_crew_members") {
						unl.push (`{{ICRC}} ${r.description} for the [[${r.title}]]`)

					} else if (r.type=="unlock_hub_slot") {
						unl.push (`{{IHARC}} ${r.description} ([[${r.title}]])`)

					} else if (r.type=="unlock_hub_selection_slot") {
						unl.push (`{{ICRS}} ${r.description} ([[${r.title}]])`)

					} else if (r.type=="terraforming") {
						unl.push (`[[File:Reward icon terraforming mars.png|20px|link=]] ${r.description}`)

					}
				}
			wiki += unl.join(" <br> ");
			}
			wiki += "}}";
			CumulativeTech.Output[tech.era].push(wiki);
		}
		for (let era in CumulativeTech.Output) {
			if (CumulativeTech.Output[era]) CumulativeTech.Output[era].push(`</div>`)
		}
	},

	CSS:"",
	CSSCreate: (XML) => {
		if (!XML?.responseURL?.includes("technology_icons_0")) return
		let x=JSON.parse(XML.response);
		let out=[];
		out.push(`.tech_img {\n\theight:90px;\n\twidth:90px;\n\tmargin:auto;\n\ttext-align:left;\n\t& img {\n\t\tposition:absolute;\n\t}\n\t& p {\n\t\tmargin:0;\n\t}\n}\n\n`);
		for (let img of x.frames) {
			out.push(`.tech_img .${img[0].replace("technology_icon_","")}{`)
			out.push(`\tclip-path:polygon(${img[1]}px ${img[2]}px,${img[1]+img[3]-1}px ${img[2]}px,${img[1]+img[3]-1}px ${img[2]+img[4]-1}px,${img[1]}px ${img[2]+img[4]-1}px);`)
			out.push(`\ttransform: translate(-${img[1]}px, -${img[2]}px);`)
			out.push(`}\n`)
		}
		CumulativeTech.CSS=out.join(`\n`)
		FoEproxy.removeRawHandler(CumulativeTech.CSSCreate);
		setTimeout(WikiBox.update,1000) 
	},

	display: ()=>{
		
		CumulativeTech.createOutput()
		let out='';
		if (CumulativeTech.CSS=="") {
			out+= '<h1 style="color:var(--text-bright)">Open Research first!</h1>'
		} else {
			out +='<h2>Output the Cumulative Tech page for the respective Era</h2><div class="btn-group" style="flex-wrap:wrap">'
			for (era in CumulativeTech.Output) {
				if (!CumulativeTech.Output[era]) continue;
				out += `<div class="btn-default" data-era="${era}" style="flex-grow:1" onclick="CumulativeTech.CopyEra(event)">${CumulativeTech.WikiTranslate[era]}</div>`
			}			
			out+='</div><h2>Output the CSS for the Tech Images</h2>';
			out+='<div class="btn-group" style="flex-wrap:wrap"><div class="btn-default" onclick="CumulativeTech.CopyCSS()">Copy CSS for Tech Icons</div>';
			let link = srcLinks.get("/research/technology_icons/technology_icons_0.jpg",true)
			out+=`<a href="${link}" class="btn-default" target="_blank">Current Tech Image</a></div>`;	
		}
		out+='<h2>Settings for Export</h2>';
		out+=`<textarea width="100%" id="CumulativeTechSettings" onfocusout="CumulativeTech.SaveSettings()">${JSON.stringify(CumulativeTech.WikiTranslate).replace(/,/g,",\n").replace("{","{\n").replace('"}','"\n}')}</textarea>`;
			
		return out;
	},
	CopyEra: (evt)=>{
		let era = evt.target.dataset.era
		let out=CumulativeTech.Output[era].join("\n\n")
		helper.str.copyToClipboard(out)
		let url=`https://forgeofempires.fandom.com/wiki/${CumulativeTech.WikiTranslate[era] + " Technologies"}?veaction=editsource`;
   		if ($('#OpenWiki')[0].checked) window.open(url,'_blank');
    	//$('#WikiLink')[0].href = url;
	},
	CopyCSS: ()=>{
		helper.str.copyToClipboard(CumulativeTech.CSS)
		let url=`https://forgeofempires.fandom.com/wiki/MediaWiki:TechnologyImages.css?veaction=editsource`;
   		if ($('#OpenWiki')[0].checked) window.open(url,'_blank');
    	//$('#WikiLink')[0].href = url;
	},
	SaveSettings:()=>{
		try {
			let j = JSON.parse($('#CumulativeTechSettings').val());
			CumulativeTech.WikiTranslate = j;
			localStorage.setItem("WikiCumTechSettings",JSON.stringify(j));
		} catch {
			alert("Settings have a JSON error - please check Input! Settings not saved!")
		}

	
	}
	
}

FoEproxy.addRawHandler(CumulativeTech.CSSCreate)
FoEproxy.addMetaHandler("research_eras",(response)=>{
	let eras = JSON.parse(response.responseText)
	for (let x of eras) {
		if (!CumulativeTech.WikiTranslate[x.era]) CumulativeTech.WikiTranslate[x.era] = x.name;
	}
})
