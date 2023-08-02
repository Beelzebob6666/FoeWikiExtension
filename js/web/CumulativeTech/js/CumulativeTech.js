CummulativeTechs = {
	WikiTranslate: {
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
	},
	Output:{},
	
	createOutput:() => {
		if (!Technologies.AllTechnologies) return;
		if (!MainParser.CityEntities) return;
		if (!GoodsData) return;
		let numberWithCommas = (x) => {
			if (!x) return ""
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		};
		let trans = (x) => {
			if (CummulativeTechs.WikiTranslate[x]) return CummulativeTechs.WikiTranslate[x];
			return x;
		}
		let techs = {};
		let eras = {}
		for (let tech of Technologies.AllTechnologies) {
			techs[tech.id] = tech.name;
			eras[tech.id] = tech.era;
		}
		for (let tech of Technologies.AllTechnologies) {
			if (!CummulativeTechs.Output[tech.era]) CummulativeTechs.Output[tech.era] = [`<div class="flex-container">`] 
			let wiki = "{{TechBoxNew|" + tech.name + "|" + tech.id;
			if (tech.maxSP) wiki += "|FP=" + numberWithCommas(tech.maxSP);
			if (tech.requirements.resources.money) wiki += "|Coins=" + numberWithCommas(tech.requirements.money);
			if (tech.requirements.resources.supplies) wiki += "|Supplies=" + numberWithCommas(tech.requirements.supplies);
			wiki += "|Age=" + trans(tech.era);
			wiki += "\n|Goods="
			for (let g in tech.requirements.resources) {
				if (!tech.requirements.resources[g]) continue;
				if (g == "supplies" || g=="money") continue;
				wiki += `{{${GoodsData[g].name}}} ` + numberWithCommas(tech.requirements.resources[g]) + " "
			}
			wiki += "\n|Requires="
			let req=[]
			for (let t of tech.parentTechnologies) {
				req.push (`{{ITEC}} [[${tech.era != eras[t] ? trans(eras[t]) + " Technologies":""}#${techs[t]}|${techs[t]}]]`)
			}
			wiki += req.join("<br>")
			wiki += "\n|LeadsTo="
			let lead=[]
			for (let t of tech.childTechnologies) {
				lead.push (`{{ITEC}} [[${tech.era != eras[t] ? trans(eras[t]) + " Technologies":""}#${techs[t]}|${techs[t]}]]`)
			}
			wiki += lead.join("<br>")
			wiki += "\n|Unlocks="
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
			wiki += unl.join(" <br> ")	
			}
			wiki += "}}"
			CummulativeTechs.Output[tech.era].push(wiki).push(`</div`)
		}	
	},
	CSS:"",
	CSSCreate: (XML) => {
		if (!XML.responseURL.includes("technology_icons_0")) return
		let x=JSON.parse(XML.response);
		console.log(x);
		
		let out=[];
		out.push(`.tech_img {\n\theight:90px;\n\twidth:90px;\n\tmargin:auto;\n\ttext-align:left;\n\t& img {\n\t\tposition:absolute;\n\t}\n\t& p {\n\t\tmargin:0;\n\t}\n}\n\n`);
		for (let img of x.frames) {
			out.push(`.tech_img .${img[0].replace("technology_icon_","")}{`)
			out.push(`\tclip-path:polygon(${img[1]}px ${img[2]}px,${img[1]+img[3]-1}px ${img[2]}px,${img[1]+img[3]-1}px ${img[2]+img[4]-1}px,${img[1]}px ${img[2]+img[4]-1}px);`)
			out.push(`\ttransform: translate(-${img[1]}px, -${img[2]}px);`)
			out.push(`}\n`)
		}
		console.log("CSS:\n",out.join(`\n`))
		FoEproxy.removeRawHandler(CummulativeTechs.CSS)
	}
}

FoEproxy.addRawHandler(CummulativeTechs.CSSCreate)

