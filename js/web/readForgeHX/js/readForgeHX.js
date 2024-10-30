
let readForgeHX = {
    gameVersion: localStorage.getItem("gameVersion")|| "",
    versionDate:"",
    DB: null,
    containerActive:false,
    Container:null,
    mousedrag:false,
    selected:false,

    database : {
        open: async () => {
            const db = readForgeHX.DB = new Dexie('HX-DB');
            
            db.version(1).stores({
                files: 'id,hash,added,updated,removed',
                strings: 'id,added,removed',
            });
            db.version(2).stores({
                buildings: 'id,rawJSON,added,updated,removed,oldJSON',
            });
            db.version(3).stores({
                buildings: 'id,JSON,added,updated,removed,oldJSON',
            });
            
            await db.open()
        }
    },
    init: async () => {
        WikiBox.tabs["readForgeHXFiles"]={title: "Forge HX - Files", html: () => {return readForgeHX.displayFiles()}, callback: () => {readForgeHX.activateFiles()}};
		WikiBox.tabs["readForgeHXStrings"]={title: "Forge HX - Strings", html: () => {return readForgeHX.displayStrings()}, callback: () => {readForgeHX.activateStrings()}};
		WikiBox.tabs["readBuildings"]={title: "Buildings List", html: () => {return readForgeHX.displayBuildings()}, callback: () => {readForgeHX.activateBuildings()}};
	
        // wait for DB loaded

        await WikiMayRun;
        await readForgeHX.database.open();
        // wait for ForgeHX is loaded, then read the full script url
        const isElementLoaded = async () => {
            while (!srcLinks.raw) {
                await new Promise( resolve => requestAnimationFrame(resolve))
            }
            return true;
        };

        const HXloaded = await isElementLoaded()
        if (!HXloaded) return;
        if (!readForgeHX.newVersion()) return;
        
        await readForgeHX.files();
        await readForgeHX.strings();
        await readForgeHX.buildings();
    },
    files: async () => {
        let HXscript = srcLinks.raw+"";
        let startString = "baseUrl,";
        let start = HXscript.indexOf(startString) + startString.length;
        HXscript = HXscript.substring(start);

        let end = HXscript.indexOf("}")+1;
        HXscript = HXscript.substring(0, end);

        let New = JSON.parse(HXscript);
        let OldA = await readForgeHX.DB.files.where("removed").equals("").toArray();
        let Old={};
        OldA.forEach(a => Old[a.id] = a.hash);

        let toUpdate = {};

        if (Object.keys(Old).length > 0) {
            for (let N of Object.keys(New)) {
                if (Old[N]) {
                    if (Old[N] != New[N]) {
                        toUpdate[N] = New[N];
                    } 
                    delete New[N];
                    delete Old[N];
                }
            }
        } 
        let toAdd = [];
        for (let N of Object.keys(New)) {
            toAdd.push({id:N,hash:New[N],added:readForgeHX.versionDate,updated:readForgeHX.versionDate,removed:""})
        }

        let info = "";
        if (toAdd.length > 0) {
            await readForgeHX.DB.files.bulkPut(toAdd);
            info += toAdd.length + " added\n";
        }
        if (Object.keys(toUpdate).length > 0) {
            
            let updated = await readForgeHX.DB.files.bulkGet(Object.keys(toUpdate))
            for (let s of updated) {
                s.updated = readForgeHX.versionDate;
                s.hash = toUpdate[s.id];
            }       
            await readForgeHX.DB.files.bulkPut(updated);
            info += Object.keys(toUpdate).length + " updated\n";
        }
        if (Object.keys(Old).length > 0) {
            let toRemove = await readForgeHX.DB.files.bulkGet(Object.keys(Old))
            for (let s of toRemove) {
                s.removed=readForgeHX.versionDate;
            }       
            await readForgeHX.DB.files.bulkPut(toRemove);
            info += toRemove.length + " removed";
        }
        if (info !="") {
            HTML.ShowToastMsg({
                head: 'Files',
                text: info,
                type: 'info',
                hideAfter: 60000,
            })
        }
    },

    strings: async () => {
        let contents = srcLinks.raw+"";
        let strings = [...contents.matchAll(/.*?gettext\("(.*?)"/gms)].map(x=>x[1])
        let New = {};
        strings.forEach(s => {New[s]=s} )
        let OldA = await readForgeHX.DB.strings.where("removed").equals("").toArray();
        let Old={};
        OldA.forEach(a => Old[a.id] = a.id);

        if (Object.keys(Old).length > 0) {
            for (let N of Object.keys(New)) {
                if (Old[N]) {
                    delete New[N];
                    delete Old[N];
                }
            }
        } 
        let toAdd = [];
        for (let N of Object.keys(New)) {
            toAdd.push({id:N,added:readForgeHX.versionDate,removed:""});
        }
        
        let info="";
        if (toAdd.length > 0) {
            await readForgeHX.DB.strings.bulkPut(toAdd);
            info += toAdd.length + " added\n";
        }
        if (Object.keys(Old).length > 0) {
            let toRemove = await readForgeHX.DB.strings.bulkGet(Object.keys(Old))
            for (let s of toRemove) {
                s.removed=readForgeHX.versionDate;
            }       
            await readForgeHX.DB.strings.bulkPut(toRemove);
            info += toRemove.length + " removed";
        }
        if (info !="") {
            HTML.ShowToastMsg({
                head: 'Strings',
                text: info,
                type: 'info',
                hideAfter: 60000,
            })
        }
    },

    buildings: async () => {
        
        let OldB = await readForgeHX.DB.buildings.where("removed").equals("").toArray();
        let Old={};
        OldB.forEach(a => Old[a.id] = a.JSON);

        let New = {};
        for (let i in MainParser.CityEntities) {
            New[i]=JSON.stringify(MainParser.CityEntities[i]);
        }
        
        let toUpdate = {};

        if (Object.keys(Old).length > 0) {
            for (let N of Object.keys(New)) {
                if (Old[N]) {
                    if (Old[N] != New[N]) {
                        toUpdate[N] = New[N];
                    } 
                    delete New[N];
                    delete Old[N];
                }
            }
        } 
        let toAdd = [];
        for (let N of Object.keys(New)) {
            toAdd.push({id:N,JSON:New[N],oldJSON:"",added:readForgeHX.versionDate,updated:readForgeHX.versionDate,removed:""})
        }

        let info = "";
        if (toAdd.length > 0) {
            await readForgeHX.DB.buildings.bulkPut(toAdd);
            info += toAdd.length + " added\n"
        }
        if (Object.keys(toUpdate).length > 0) {
            
            let updated = await readForgeHX.DB.buildings.bulkGet(Object.keys(toUpdate))
            for (let s of updated) {
                s.updated = readForgeHX.versionDate;
                s.oldJSON = s.JSON;
                s.JSON = toUpdate[s.id];

            }       
            await readForgeHX.DB.buildings.bulkPut(updated);
            info += Object.keys(toUpdate).length + " updated\n";
        }
        if (Object.keys(Old).length > 0) {
            let toRemove = await readForgeHX.DB.buildings.bulkGet(Object.keys(Old))
            for (let s of toRemove) {
                s.removed=readForgeHX.versionDate;
            }       
            await readForgeHX.DB.buildings.bulkPut(toRemove);
            info += toRemove.length + " removed";
        }
        if (info !="") {
            HTML.ShowToastMsg({
                head: 'Buildings',
                text: info,
                type: 'info',
                hideAfter: 60000,
            })
        }
    },

    newVersion:()=>{
        let v = srcLinks.raw.match(/this._systemInfo=\["(.*?)"/)[1]
        readForgeHX.versionDate = moment(v.match(/\((.*?)\)/)[1],'DD.MM.YYYY hh:mm').format("YYYY-MM-DD");
        if (readForgeHX.gameVersion != v) {
            readForgeHX.gameVersion = v;
            localStorage.setItem("gameVersion",readForgeHX.gameVersion)
            HTML.ShowToastMsg({
                head: 'New Version',
                text: readForgeHX.gameVersion,
                type: 'info',
                hideAfter: 60000,
            })
            return true;
        } else {
            return false;
        }
    },

    displayFiles: async () => {
        let dates = await readForgeHX.DB.files.orderBy('updated').reverse().uniqueKeys();
        
        let out = '<div id="imageList" style="display:none""></div>';

        out += '<table id="HXTable" class="foe-table" ><thead><tr>'
        out += `<th><span id=HXUpdatedRemoved>updated</span><br/>
                    <input type="date" id="HXstartUpdate" value="${dates[0]}"></input><br/> 
                    - <input type="date" id="HXendUpdate" value="${dates[0]}"></input></th>`
        out += `<th>path<br/>
                    <input id= HXfilter type="text" size="20">
                    <button class="btn-default" onclick="readForgeHX.copyLinks()">Copy Links</button>
                    <button class="btn-default" onclick="readForgeHX.copyLinks(true)">Copy Links for Forum</button>
                    <button class="btn-default" onclick="readForgeHX.download()">Download Images</button></th>`
        out += '<th>added</th>'
        out += `</tr></thead><tbody></tbody></table>`;
        return out

    },
    activateFiles: () => {
        $('#HXstartUpdate').on("change",()=>{
            readForgeHX.updateFiles()
        });
        $('#HXendUpdate').on("change",()=>{
            readForgeHX.updateFiles()
        });
        $('#HXfilter').on("keyup",(e)=>{
            if (e.key!="Enter") return
            readForgeHX.updateFiles()
        });
        $('#HXUpdatedRemoved').on("click",(e)=>{
            if (e.target.innerHTML == "updated") {
                e.target.innerHTML = "removed" 
            } else {
                e.target.innerHTML = "updated"
            }
            readForgeHX.updateFiles()
        });
        let container = document.createElement("div");
        container.style = "z-index:1000; background:white; position: absolute; display: none; max-width: 300px; max-height: 300px; pointer-events: none;"
        $('#game_body').append(container);
        readForgeHX.Container = container;
        readForgeHX.updateFiles();
    },
    updateFiles: async () =>{
        let filter = new RegExp($('#HXfilter')[0].value,"i");
        let startDate = $('#HXstartUpdate')[0].value;
        let endDate = $('#HXendUpdate')[0].value;
        let ur = $('#HXUpdatedRemoved')[0].innerHTML;
        let files = await readForgeHX.DB.files.where(ur).between(startDate,endDate,true,true).filter(file => filter.test(file.id)).toArray();
        let table = files.map(file => {
            if (ur=="updated" && file.removed != "") return "";
            if (ur!="updated" && file.removed == "") return "";
            line=`<tr class="clickToSelect" id="${file.id}">`;
            line+=`<td>${ur=="updated" ? file.updated : file.removed}</td>`;
            if (ur=="updated") {
                line+=`<td class="showImage"><a href="${srcLinks.get(file.id,true)}" target="_blank">${file.id}</a></td>`;
            } else {
                line+=`<td>${file.id}</td>`;
            }
            line+=`<td>${file.added}</td>`;
            line+=`</tr>`;
            return line;
        })
        $('#HXTable tbody').html(table.join())
        $('.showImage').on("pointerenter",(e)=>{
            let h=e.target.firstChild.href;
            if (!h) h= e.target.href;
            let split= h.split(".");
            let type= split[split.length-1]
            let img="";
            if (["jpg","png"].includes(type)) img= `<img src="${h}" style="max-width: 300px;max-height: 300px;">`
            readForgeHX.Container.innerHTML=img;
            if (!readForgeHX.containerActive) {
                readForgeHX.containerActive = true;
                readForgeHX.Container.style.display = "block";
                window.addEventListener("pointermove", readForgeHX.followMouse);
              }
        })
        $('.showImage').on("pointerleave",(e)=>{
            readForgeHX.containerActive = false;
            readForgeHX.Container.style.display = "none";
            window.removeEventListener("pointermove", readForgeHX.followMouse);
        })

        $('.clickToSelect').on("mousedown",(e)=> {
            let el = e.target.parentElement;
            if (el.tagName != "TR") el = el.parentElement;
            el.classList.toggle("selected");
            readForgeHX.selected = el.classList.contains("selected");
            readForgeHX.mousedrag = true;
        });     
        $('.clickToSelect').on("mouseup",(e)=> {
            readForgeHX.mousedrag = false;
        });     
        $('.clickToSelect').on("mousemove",(e)=> {
            if (!readForgeHX.mousedrag) return;
            let el = e.target.parentElement;
            if (el.tagName != "TR") el = el.parentElement;
            if (el.classList.contains("selected") == readForgeHX.selected) return;
            el.classList.toggle("selected");
        });     

    },
    displayStrings: async () => {
        let dates = await readForgeHX.DB.strings.orderBy('added').reverse().uniqueKeys();
        
        let out = '<div id="stringList" style="display:none""></div>';

        out += '<table id="HXTable" class="foe-table" ><thead><tr>'
            out += `<th><span id="HXAddedRemoved">added</span><br/>
                        <input type="date" id="HXstartUpdate" value="${dates[0]}"></input><br/> 
                        - <input type="date" id="HXendUpdate" value="${dates[0]}"></input></th>`
            out += `<th>string <br/>
                        <input id= HXfilter type="text" size="20">
                        <button class="btn-default" onclick="readForgeHX.copy()">Copy</button></th>`
        out += `</tr></thead><tbody></tbody></table>`
        return out

    },
    activateStrings: () => {
        $('#HXstartUpdate').on("change",()=>{
            readForgeHX.updateStrings()
        });
        $('#HXendUpdate').on("change",()=>{
            readForgeHX.updateStrings()
        });
        $('#HXfilter').on("keyup",(e)=>{
            if (e.key!="Enter") return
            readForgeHX.updateStrings()
        });
        $('#HXAddedRemoved').on("click",(e)=>{
            if (e.target.innerHTML == "added") {
                e.target.innerHTML = "removed" 
            } else {
                e.target.innerHTML = "added"
            }
            readForgeHX.updateStrings()
        });
        
        readForgeHX.updateStrings();
    },
    updateStrings: async () =>{
        let filter = new RegExp($('#HXfilter')[0].value,"i");
        let startDate = $('#HXstartUpdate')[0].value;
        let endDate = $('#HXendUpdate')[0].value;
        let ar = $('#HXAddedRemoved')[0].innerHTML;
        let strings = await readForgeHX.DB.strings.where(ar).between(startDate,endDate,true,true).filter(string => filter.test(string.id)).toArray();

        let table = strings.map(string => {
            if (ar=="added" && string.removed != "") return "";
            if (ar!="added" && string.removed == "") return "";
            line=`<tr class="clickToSelect">`;
            line+=`<td>${string.added}</td>`;
            line+=`<td id="${string.id}">${string.id}</td>`;
            line+=`</tr>`;
            return line;
        })
        $('#HXTable tbody').html(table.join())

        $('.clickToSelect').on("mousedown",(e)=> {
            let el = e.target.parentElement;
            if (el.tagName != "TR") el = el.parentElement;
            el.classList.toggle("selected");
            readForgeHX.selected = el.classList.contains("selected");
            readForgeHX.mousedrag = true;
        });     
        $('.clickToSelect').on("mouseup",(e)=> {
            readForgeHX.mousedrag = false;
        });     
        $('.clickToSelect').on("mousemove",(e)=> {
            if (!readForgeHX.mousedrag) return;
            let el = e.target.parentElement;
            if (el.tagName != "TR") el = el.parentElement;
            if (el.classList.contains("selected") == readForgeHX.selected) return;
            el.classList.toggle("selected");
        });     

    },
    displayBuildings: async () => {
        let dates = await readForgeHX.DB.buildings.orderBy('updated').reverse().uniqueKeys();
        
        let out = '<div id="buildingList" style="display:none""></div>';

        out += '<table id="HXTable" class="foe-table" ><thead><tr>'
        out += `<th><span id=HXUpdatedRemoved>updated</span><br/>
                    <input type="date" id="HXstartUpdate" value="${dates[0]}"></input><br/> 
                    - <input type="date" id="HXendUpdate" value="${dates[0]}"></input></th>`
        out += `<th>Name<br/>
                    <input id= HXfilter type="text" size="20">`
        out += '<th>added</th>'
        out += `</tr></thead><tbody></tbody></table>`;
        return out

    },
    activateBuildings: () => {
        $('#HXstartUpdate').on("change",()=>{
            readForgeHX.updateBuildings()
        });
        $('#HXendUpdate').on("change",()=>{
            readForgeHX.updateBuildings()
        });
        $('#HXfilter').on("keyup",(e)=>{
            if (e.key!="Enter") return
            readForgeHX.updateBuildings()
        });
        $('#HXUpdatedRemoved').on("click",(e)=>{
            e.target.innerHTML = e.target.innerHTML == "updated" ? "removed" : "updated";
            readForgeHX.updateBuildings()
        });
        readForgeHX.updateBuildings();
    },

    updateBuildings: async () =>{
        let filter = new RegExp($('#HXfilter')[0].value,"i");
        let startDate = $('#HXstartUpdate')[0].value;
        let endDate = $('#HXendUpdate')[0].value;
        let ur = $('#HXUpdatedRemoved')[0].innerHTML;
        let buildings = await readForgeHX.DB.buildings.where(ur).between(startDate,endDate,true,true).filter(building => filter.test(building.JSON)).toArray();
        let table = buildings.map(b => {
            building= JSON.parse(b.JSON);
            if (ur=="updated" && b.removed != "") return "";
            if (ur!="updated" && b.removed == "") return "";
            line=`<tr id="${b.id}">`;
            line+=`<td>${ur=="updated" ? b.updated : b.removed}</td>`;
            if (ur=="updated") {
                line+=`<td class="showStats">${building.name}</td>`;
            } else {
                line+=`<td>${building.name}</td>`;
            }
            line+=`<td>${b.added}</td>`;
            line+=`</tr>`;
            return line;
        })
        $('#HXTable tbody').html(table.join())
        
        $('.showStats').on("click", async (e) =>{
            
            let el = e.target
            while (!el.id) {
                el= el.parentElement
            }
            if (el.id == "wikiBuildingJSON") return;
            if ($(el).find("#wikiBuildingJSON").length>0) {
                $("#wikiBuildingJSON").remove();
                return;
            }
            $("#wikiBuildingJSON").remove();
            
            let b = await(readForgeHX.DB.buildings.get(el.id))

            if (!b) return;

            let meta=JSON.parse(b.JSON)

            let text = document.createElement("div");
            text.id="wikiBuildingJSON";
            text.style="width: 100%;white-space: pre-wrap;";
            let h = `<table style="width: 100%;"><tr><td style="width:200px; text-align:right; vertical-align:top"><img src="${srcLinks.get("/city/buildings/"+meta.asset_id.replace(/^(\D_)(.*?)/,"$1SS_$2")+".png",true)}" style="max-width:200px"></td><td style="width:100%; vertical-align:top"">Current Version:`;
            h += readForgeHX.BuildingProd(meta);
            if (b.oldJSON != "") {
                meta = JSON.parse(b.oldJSON)
                h += '</td><td style="width:100%; vertical-align:top"">Previous Version:';
                h += readForgeHX.BuildingProd(meta);
            }
            h += "</td></tr></table>"
            text.innerHTML=h;
            e.target.append(text);

            $(".handleOverflow").each((index,e)=>{
                let w= ((e.scrollWidth - e.parentNode.clientWidth) || 0)
                if (w<0)
                    e.style["animation-name"]="unset"
                else 
                    e.style.width = w + "px";
            })
            

        })
    },
    
    followMouse:(event)=>{
        readForgeHX.Container.style.left = event.x + "px";
        readForgeHX.Container.style.top = event.y + "px";
    },
    reset: async ()=> {
        localStorage.removeItem("gameVersion");
        x= readForgeHX.DB.delete();
    },
    copyLinks:(forum=false)=>{
        let links = $('.clickToSelect.selected a')
        if (links.length == 0) return

        let l=[]
        for (x=0;x<links.length;x++) {
            l.push(forum ? "[IMG]" + links[x].href + "[/IMG]" : links[x].href)
        }
        helper.str.copyToClipboard(l.join("\n"))
    },
    copy:()=>{
        let strings = $('.clickToSelect.selected td:nth-child(2)')
        if (strings.length == 0) return
        let s=[]
        for (x=0;x<strings.length;x++) {
            s.push(strings[x].id)
        }
        helper.str.copyToClipboard(s.join("\n"))
    },

    download: async ()=>{
        urlToPromise = (url) => {
            return new Promise(function(resolve, reject) {
                JSZipUtils.getBinaryContent(url, function (err, data) {
                    if(err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        }
        var zip = new JSZip();
        let links = $('.clickToSelect.selected a');

        if (links.length > 0) {
            for (let l = 0; l<links.length;l++) {
                let p = links[l].href.split("/")                
                zip.file(p[p.length-1], urlToPromise(links[l].href), {binary:true});
            }
        }
        zip.generateAsync({type:"blob"})
        .then(function callback(blob) {
            saveAs(blob, "FoE - Images.zip");
        });
    },

    JSdiff: (o,n) => {
        for (i in n) {
            if (!n[i]) continue
            if (!o[i]) continue
            if (JSON.stringify(o[i])==JSON.stringify(n[i])) {
                delete o[i];
                delete n[i];
            } else {
                if (typeof n[i]==="string" || typeof n[i]=== "number" || typeof n[i] === "boolean") continue
                if (typeof o[i]==="string" || typeof o[i]=== "number" || typeof o[i] === "boolean") continue
                readForgeHX.JSdiff(o[i],n[i])
            }
        }

    },
  

    BuildingProd:(meta)=>{
        let numberWithCommas = (x) => {
			if (!x) return ""
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		};
        
        let maxEra = Technologies.EraNames[Technologies.getMaxEra()]
        let goodsList = ["era_goods","random_good_of_age","all_goods_of_age", "random_good_of_age","random_good_of_age_1","random_good_of_age_2","random_good_of_age_3"]
    
        let span = (x,withHighlight=false) => `<span ${withHighlight ? `class="${x>0 ? "positive" : "negative"}"`:''}>${numberWithCommas(x)}</span>`;
        let longSpan = (x) => `<div class="overflowBox"><span class="handleOverflow">${x}</span></div>`
        let range = (x,y,withHighlight=false) => span(x,withHighlight) + (x!=y ?` - `+ span(y,withHighlight):``);
        let formatTime = (x) => {
            let min=Math.floor(x/60)
            let hour=Math.floor(min/60)
            let sec = x-min*60
            min = min-hour*60
            let time= sec + "s"
            if (min>0) {
                time= min+(sec>0?":"+(sec>9?sec:"0"+sec):"")+"m"
                }
            if (hour>0) {
                time = hour+(sec+min>0 ? ":"+(min>9?min:"0"+min)+(sec>0?":"+(sec>9?sec:"0"+sec):""):"")+"h"
            }
            return time
        }
        let src=(x)=>{
            if (!x) return ""
            x=x.replace(/(.*?)_[0-9]+/gm,"$1");
            let link = srcLinks.get(`/shared/icons/${x}.png`,true,true);
            if (link.includes("antiquedealer_flag")) link = srcLinks.get(`/shared/icons/reward_icons/reward_icon_${x}.png`,true);
            if (link.includes("antiquedealer_flag")) link = srcLinks.get(`/city/buildings/${x.replace(/(\D*?)_(.*)/,"$1_SS_$2")}.png`,true);
            return link
        }
        
        let icons = (x) => `<img src=${src(x)}>`;// ${y ? `style="background: url(${src(y)}); background-size: contain; background-repeat: no-repeat;"`:""}>`;
        
        let genericEval = (rew) => {
            let [x1,amount,name] = rew.name.match(/^([+\-]?\d*)x? (.*)$/)||["",1,rew.name]
            amount = Number(amount)
            let icon = ""
            let fragment = ""
            if (rew.iconAssetName=="icon_fragment") {
                icon = icons(rew.assembledReward?.iconAssetName||rew.assembledReward?.subType)
                name = name.replace(/Fragments? of/,"")
                fragment = icons("icon_tooltip_fragment")
            } else if (rew.type=="unit") {

                name = /nextera/i.test(rew.id)? "of next era" : ""
                
                icon = icons(rew.subType=="rogue"?"rogue":(
                    rew.subType.includes("champion")?"chivalry":
                    Unit.Types.filter(x=>x.unitTypeId==rew.subType)[0].unitClass
                    ))
            } else
                icon = icons(rew.iconAssetName)
            
            return {icon:icon,amount:amount,name:name,fragment:fragment}
        }    
        

        
        let capFirsts = (s) => {
            return s.replace("_"," ").replace(/(\b[a-z](?!\s))/g, function(x){return x.toUpperCase();});
        }

        let feature = {
            "all":"",
            "battleground":"_gbg",
            "guild_expedition":"_gex",
            "guild_raids":"_gr"
        }
        let percent = (x) => {
            return [
                "diplomacy",
                "guild_raids_action_points_collection",
                "guild_raids_goods_start",
                "guild_raids_units_start",
                "guild_raids_supplies_start",
                "guild_raids_coins_start",
            ].includes(x) ? "" : "%"
        }
        let out='<table class="HXBuilding">';        

        if (meta.components) {
            
            let levels=meta.components
            if (levels.BronzeAge) {
                maxEra = Technologies.EraNames[Math.max(...Object.keys(levels).map(x=>Technologies.Eras[x]))]
            }
            let era="",
                ally="",
                traits = "",
                motMod = "",
                polMod = "",
                ifMot = `<span class="ifMot">${icons("when_motivated")}</span>`

            if (levels?.AllAge?.socialInteraction?.interactionType) {
                if (levels?.AllAge?.socialInteraction?.interactionType == "motivate") {
                    motMod = `<span class="ifMot">${icons("reward_x2")+"when"+icons("when_motivated")}</span>`
                    traits+=`<tr><td><span>${icons("when_motivated")}</span>can be polished</td></tr>`
                }
                else if (levels?.AllAge?.socialInteraction?.interactionType == "polish") {
                    polMod = `<span class="ifMot">${icons("reward_x2")+"when"+icons("when_motivated")}</span>`
                    traits+=`<tr><td><span>${icons("when_motivated")}</span>can be motivated</td></tr>`
                }
            }
            for (let a of meta.abilities||[]) {
                if (a.__class__=="BuildingPlacementAbility") {
                    if (a.gridId == "cultural_outpost") {
                        era=`<img src=${srcLinks.get(`/outpost/gui/${a.content}/shared/reward_chest_badge_${a.content}.png`,true)}> ${capFirsts(a.content)}`
                    }
                    if (a.gridId == "era_outpost") {
                        era=`<img src=${srcLinks.get(`/shared/icons/achievements/achievement_icons_space_age_${a.content}.png`,true)}> ${capFirsts(a.content)}`
                    }
                }
                if (a.__class__=="AffectsEnvironmentAbility" && a.action?.type=="add_unique_inhabitant") 
                    traits += `<tr><td><img class="inhabitant" src="${srcLinks.get(`/city/inhabitants/${a.action.animationId}/${a.action.animationId}_south_00.png`,true)}">◄ Add unique inhabitant (${capFirsts(a.action.animationId)})</td></tr>`
            }

            for (r of levels.AllAge?.ally?.rooms || []) {
                ally += '<tr><td>'+icons("historical_allies_slot_tooltip_icon_empty") + capFirsts(r.allyType) +" ("+capFirsts(r.rarity.value)+")"+`</td></tr>`
            }

            if (levels.AllAge.eraRequirement?.era && era =="") {
                era = `${icons("era") + " " + i18n("Eras."+(Technologies.Eras[levels.AllAge.eraRequirement?.era]))}`
            }
            
            if (era != "") out += "<tr><td>" + era + "</td></tr>"

            let provides=""

            for ([resource,amount] of Object.entries(levels.AllAge?.staticResources?.resources?.resources||{})) {
                provides+=`<tr><td>${icons(resource)+" "+ span(amount,true)}</td></tr>`
            }
            for ([resource,amount] of Object.entries(levels.BronzeAge?.staticResources?.resources?.resources||{})) {
                provides+=`<tr><td>${icons(resource)+" "+ range(amount,levels[maxEra]?.staticResources?.resources?.resources?.[resource],true)}</td></tr>`
            }
            if (levels.AllAge?.happiness?.provided) {
                provides+=`<tr><td>${icons("happiness")+" "+ span(levels.AllAge?.happiness?.provided,true) + polMod}</td></tr>`
            } 
            if (levels.BronzeAge?.happiness?.provided && levels[maxEra]?.happiness?.provided) {
                provides+=`<tr><td>${icons("happiness") + " " + range(levels.BronzeAge?.happiness?.provided,levels[maxEra]?.happiness?.provided,true) + polMod}</td></tr>`
            }
            for (let [i,b] of Object.entries(levels.AllAge?.boosts?.boosts||[])){
                provides+=`<tr><td>${icons(b.type+feature[b.targetedFeature]) + " " + span(b.value) + percent(b.type)}</td></tr>`
            }
            
            for (let [i,b] of Object.entries(levels.BronzeAge?.boosts?.boosts||[])){
                provides+=`<tr><td>${icons(b.type+feature[b.targetedFeature]) + " " + range(b.value,levels[maxEra]?.boosts?.boosts[i].value) + percent(b.type)}</td></tr>`
            }
            
            let prods=""
            let pCount = levels.AllAge?.production?.options?.length || levels.BronzeAge?.production?.options?.length || 0
            
            for (let [oIndex,option] of Object.entries(levels.AllAge.production?.options||[])) {
                let t = pCount>1 ? " in " + formatTime(option.time): ""
                for (let [pIndex,product] of Object.entries(option.products)) {
                    if (product.type == "resources") {
                        for (let [res,amount] of Object.entries(product.playerResources?.resources||{})) {
                            if (amount !=0) 
                                prods+=`<tr><td>${icons(goodsList.includes(res)?"goods":res) + span(amount)+t  + ((["supplies","coins","money"].includes(res) && !product.onlyWhenMotivated) ? motMod : "") + (product.onlyWhenMotivated?ifMot:"")}</td></tr>`
                        }
                    }
                    if (product.type == "guildResources") {
                        for (let [res,amount] of Object.entries(product.guildResources?.resources||{})) {
                            if (amount !=0) 
                                prods+=`<tr><td>${icons(goodsList.includes(res)?"treasury_goods":res) + span(amount)+t + (product.onlyWhenMotivated?ifMot:"")}</td></tr>`
                        }
                    }
                    if (product.type == "unit") {
                        if (product.amount !=0) {
                            let iconId= (product.unitTypeId=="rogue"?"rogue":(
                                         product.unitTypeId.includes("champion")?"chivalry":
                                         Unit.Types.filter(x=>x.unitTypeId==product.unitTypeId)[0].unitClass
                                         ))
                            prods+=`<tr><td>${icons(iconId) + span(product.amount)+t + (product.onlyWhenMotivated?ifMot:"")}</td></tr>`
                        }
                    }
                    if (product.type == "genericReward") {
                        let rew = genericEval(levels.AllAge.lookup.rewards[product.reward.id])
                        prods+=`<tr><td class="isGeneric">${rew.icon + span(rew.amount) + rew.fragment + longSpan(rew.name) + t + (product.onlyWhenMotivated ? ifMot : "")}</td></tr>`
                    }
                    if (product.type=="random") {
                        prods+=`<tr><td><table class="randomProductions">`
                        for (let [rIndex,random] of Object.entries(product.products)){
                            prods+=`<tr><td>`
                            if (random.product.type == "resources") {
                                for (let [res,amount] of Object.entries(random.product.playerResources?.resources||{})) {
                                    if (amount !=0) 
                                        prods+=icons(goodsList.includes(res)?"goods":res) + span(amount)
                                }
                            }
                            if (random.product.type == "guildResources") {
                                for (let [res,amount] of Object.entries(random.product.guildResources?.resources||{})) {
                                    if (amount !=0) 
                                        prods+=icons(goodsList.includes(res)?"treasury_goods":res) + span(amount)
                                }
                            }
                            if (random.product.type == "unit") {
                                if (random.product.amount !=0) {
                                    let iconId= (random.product.unitTypeId=="rogue"?"rogue":(
                                                random.product.unitTypeId.includes("champion")?"chivalry":
                                                Unit.Types.filter(x=>x.unitTypeId==random.product.unitTypeId)[0].unitClass
                                                ))
                                    prods+=icons(iconId) + span(random.product.amount)
                                }
                            }
                            if (random.product.type == "genericReward") {
                                let rew=genericEval(levels.AllAge.lookup.rewards[random.product.reward.id])
                                prods += rew.icon + span(rew.amount) + rew.fragment + longSpan(rew.name)
                            }
                            prods+=`<span class="dropChance">${Math.floor(random.dropChance*100)}%</span></td></tr>`
                        }
                        prods+=`</table>${(product.onlyWhenMotivated ? ifMot : "")}</td></tr>`
                    }                    
                }
            }
            for (let [oIndex,option] of Object.entries(levels.BronzeAge?.production?.options||[])) {
                let t = pCount>1 ? " in " + formatTime(option.time): ""
                for (let [pIndex,product] of Object.entries(option.products)) {
                    if (product.type == "resources") {
                        for (let [res,amount] of Object.entries(product.playerResources?.resources||{})) {
                            if (amount !=0) 
                                prods+=`<tr><td>${icons(goodsList.includes(res)?"goods":res) + range(amount,levels?.[maxEra]?.production?.options?.[oIndex]?.products?.[pIndex]?.playerResources?.resources?.[res])+t  + ((["supplies","coins","money"].includes(res) && !product.onlyWhenMotivated) ? motMod : "") + (product.onlyWhenMotivated?ifMot:"")}</td></tr>`
                        }
                    }
                    if (product.type == "guildResources") {
                        for (let [res,amount] of Object.entries(product.guildResources?.resources||{})) {
                            if (amount !=0) 
                                prods+=`<tr><td>${icons(goodsList.includes(res)?"treasury_goods":res) + range(amount,levels?.[maxEra]?.production?.options?.[oIndex]?.products?.[pIndex]?.guildResources?.resources?.[res])+t + (product.onlyWhenMotivated?ifMot:"")}</td></tr>`
                        }
                    }
                    if (product.type == "unit") {
                        if (product.amount !=0) {
                            let iconId= (product.unitTypeId=="rogue"?"rogue":(
                                         product.unitTypeId.includes("champion")?"chivalry":
                                         Unit.Types.filter(x=>x.unitTypeId==product.unitTypeId)[0].unitClass
                                         ))
                            prods+=`<tr><td>${icons(iconId) + range(product.amount,levels?.[maxEra]?.production?.options?.[oIndex]?.products?.[pIndex].amount)+t + (product.onlyWhenMotivated?ifMot:"")}</td></tr>`
                        }
                    }
                    if (product.type == "genericReward") {
                        let rewBA=genericEval(levels.BronzeAge.lookup.rewards[product.reward.id])
                        let rewMax=genericEval(levels[maxEra].lookup.rewards[levels[maxEra]?.production?.options?.[oIndex]?.products?.[pIndex]?.reward?.id])
                        
                        if (rewBA.icon+rewBA.name==rewMax.icon+rewMax.name) {
                            prods+=`<tr><td class="isGeneric">${rewBA.icon + range(rewBA.amount,rewMax.amount) + rewBA.fragment + longSpan(rewBA.name) + t + (product.onlyWhenMotivated ? ifMot : "")}</td></tr>`
                        } else {
                            prods+=`<tr><td class="isGeneric">${rewBA.icon + span(rewBA.amount) + rewBA.fragment + longSpan(rewBA.name) + " - " + rewMax.icon + span(rewMax.amount) + rewMax.fragment + longSpan(rewMax.name) + t + (product.onlyWhenMotivated ? ifMot : "")}</td></tr>`
                        }
                    }
                    if (product.type=="random") {
                        prods+=`<tr><td><table class="randomProductions">`
                        for (let [rIndex,random] of Object.entries(product.products)){
                            prods+=`<tr><td>`
                            if (random.product.type == "resources") {
                                for (let [res,amount] of Object.entries(random.product.playerResources?.resources||{})) {
                                    if (amount !=0) 
                                        prods+=icons(goodsList.includes(res)?"goods":res) + range(amount,levels?.[maxEra]?.production?.options?.[oIndex]?.products?.[pIndex]?.products?.[rIndex]?.product?.playerResources?.resources?.[res])
                                }
                            }
                            if (random.product.type == "guildResources") {
                                for (let [res,amount] of Object.entries(random.product.guildResources?.resources||{})) {
                                    if (amount !=0) 
                                        prods+=icons(goodsList.includes(res)?"treasury_goods":res) + range(amount,levels?.[maxEra]?.production?.options?.[oIndex]?.products?.[pIndex]?.products?.[rIndex]?.product?.guildResources?.resources?.[res])
                                }
                            }
                            if (random.product.type == "unit") {
                                if (random.product.amount !=0) {
                                    let iconId= (random.product.unitTypeId=="rogue"?"rogue":(
                                                random.product.unitTypeId.includes("champion")?"chivalry":
                                                Unit.Types.filter(x=>x.unitTypeId==random.product.unitTypeId)[0].unitClass
                                                ))
                                    prods+=icons(iconId) + range(random.product.amount,levels?.[maxEra]?.production?.options?.[oIndex]?.products?.[pIndex?.products?.[rIndex]?.product].amount)
                                }
                            }
                            if (random.product.type == "genericReward") {
                                let rewBA=genericEval(levels.BronzeAge.lookup.rewards[random.product.reward.id])
                                let rewMax=genericEval(levels[maxEra].lookup.rewards[levels[maxEra]?.production?.options?.[oIndex]?.products?.[pIndex]?.products?.[rIndex]?.product?.reward?.id])
                                
                                if (rewBA.icon+rewBA.name==rewMax.icon+rewBA.name) {
                                    prods+=rewBA.icon + range(rewBA.amount,rewMax.amount) + rewBA.fragment + longSpan(rewBA.name)
                                } else {
                                    prods+=rewBA.icon + span(rewBA.amount) + rewBA.fragment + longSpan(rewBA.name) + " - " + rewMax.icon + span(rewMax.amount) + rewMax.fragment + longSpan(rewMax.name)
                                }
                            }
                            prods+=`<span class="dropChance">${Math.floor(random.dropChance*100)}%</td></tr>`
                        }
                        prods+=`</table>${(product.onlyWhenMotivated ? ifMot : "")}</td></tr>`
                    }
                }
            }
            
            let costs = ""
            for ([resource,amount] of Object.entries(levels.AllAge?.buildResourcesRequirement?.cost?.resources||{})) {
                if (amount>0) costs += `<div>${icons(resource) + " " + span(amount)}</div>`
            }
            
            if (ally!="") out+=`<tr><th>Historical Ally Rooms</th></tr>`+ally
            if (provides!="") out+=`<tr><th>Provides</th></tr>`+provides
            if (prods!="") out+=`<tr><th>Produces ${pCount==1 ? "(in "+formatTime(levels.AllAge.production?.options?.[0].time || levels.BronzeAge.production?.options?.[0].time)+")":""}</th></tr>`+prods
            if (costs !="") out+=`<tr><th>Costs</th></tr><tr><td class="multiCol">`+costs+`</td></tr>`
            
            out+=`<tr><th>Size and Building Time</th></tr>`
            out+=`<tr><td class="multiCol"><div>${icons("size")} ${levels.AllAge.placement.size.y+"x"+levels.AllAge.placement.size.x}</div><div>${icons("icon_time")}${formatTime(levels.AllAge.constructionTime.time)}</div>`
            if (levels.AllAge.streetConnectionRequirement?.requiredLevel) {
                if (levels.AllAge.streetConnectionRequirement?.requiredLevel == 2)
                    out+=`<div>${icons("street_required")}2-lane road required</div>`
                else if (levels.AllAge.streetConnectionRequirement?.requiredLevel == 1)
                    out+=`<div>${icons("road_required")}road required</div>`
                    
            }
            out+=`</td></tr>`
            
            if (traits != "") out+=`<tr><th>Traits</th></tr>`+traits
 
        } else {
            
            
            let levels = Object.assign({},...(meta?.entity_levels?.map(x=>({[x.era]:x}))||[]))
            
            if (levels.BronzeAge) {
                maxEra = Technologies.EraNames[Math.max(...Object.keys(levels).map(x=>Technologies.Eras[x]))]
            }
            let era="",
                set="",
                traits = "",
                motMod = "",
                polMod = "",
                info = "",
                boosts="",
                abilityList={},
                ifMot = `<span class="ifMot">${icons("when_motivated")}</span>`
                 
            for (let a of meta.abilities||[]) {
                if (a.__class__=="BuildingPlacementAbility") {
                    if (a.gridId == "cultural_outpost") {
                        era=`<img src=${srcLinks.get(`/outpost/gui/${a.content}/shared/reward_chest_badge_${a.content}.png`,true)}> ${capFirsts(a.content)}`
                    }
                    if (a.gridId == "era_outpost") {
                        era=`<img src=${srcLinks.get(`/shared/icons/achievements/achievement_icons_space_age_${a.content}.png`,true)}> ${capFirsts(a.content)}`
                    }
                }
                if (a.__class__=="ChainStartAbility") {
                    set =icons(a.chainId) + MainParser.BuildingChains[a.chainId].name + "</td></tr><tr><td>" + a.description
                }
                if (a.__class__=="ChainLinkAbility") {
                    set =icons(a.chainId) + MainParser.BuildingChains[a.chainId].name
                }
                if (a.__class__=="BuildingSetAbility") {
                    set =icons(a.setId) + MainParser.BuildingSets[a.setId].name
                }
                if (a.__class__=="PolishableAbility") {
                    traits+=`<tr><td><span>${icons("when_motivated")}</span>can be polished</td></tr>`
                    polMod = `<span class="ifMot">${icons("reward_x2")+"when"+icons("when_motivated")}</span>`
                }
                if (a.__class__ == "MotivatableAbility") {
                    traits+=`<tr><td><span>${icons("when_motivated")}</span>can be motivated</td></tr>`
                    motMod = `<span class="ifMot">${icons("reward_x2")+"when"+icons("when_motivated")}</span>`
                }
                if (a.__class__ == "AddCoinsToSupplyProductionWhenMotivatedAbility") {
                    motMod = `<span class="ifMot">${"+"+icons("money")+"when"+icons("when_motivated")}</span>`
                }
                if (a.__class__=="NotPlunderableAbility") {
                    traits+=`<tr><td>`+icons("eventwindow_plunder_repel") + `can not be plundered</td></tr>`                   
                }
                if (a.__class__=="AffectedByLifeSupportAbility") {
                    traits+=`<tr><td>`+icons("life_support") + `is affected by life support</td></tr>`                   
                }
                if (a.__class__=="DisplayInfoTextAbility") {
                    info += a.text
                }
                if (a.__class__=="AffectsEnvironmentAbility" && a.action?.type=="add_unique_inhabitant") 
                    traits += `<tr><td><img class="inhabitant" src="${srcLinks.get(`/city/inhabitants/${a.action.animationId}/${a.action.animationId}_south_00.png`,true)}">◄ Add unique inhabitant (${capFirsts(a.action.animationId)})</td></tr>`
                if (a.boostHints){
                    for (let b of a.boostHints||[]){
                        if (b.boostHintEraMap?.AllAge) {
                            boosts+=`<tr><td>${icons(b.boostHintEraMap.AllAge.type+feature[b.boostHintEraMap.AllAge.targetedFeature]) + " " + span(b.boostHintEraMap.AllAge.value) + percent(b.boostHintEraMap.AllAge.type)}</td></tr>`
                        }
                        if (b.boostHintEraMap?.BronzeAge && b.boostHintEraMap?.[maxEra]) {
                            boosts+=`<tr><td>${icons(b.boostHintEraMap.BronzeAge.type+feature[b.boostHintEraMap.BronzeAge.targetedFeature]) + " " + range(b.boostHintEraMap.BronzeAge.value,b.boostHintEraMap[maxEra].value) + percent(b.boostHintEraMap.BronzeAge.type)}</td></tr>`
                        }
                    }
                }
                if (!abilityList[a.__class__]) abilityList[a.__class__]=[]
                abilityList[a.__class__].push(a)                
            }

            if (meta?.requirements?.min_era && meta?.requirements?.min_era != "MultiAge" && era =="") {
                era = `${icons("era") + " " + i18n("Eras."+(Technologies.Eras[meta.requirements.min_era]))}`
            }
            
            if (era != "") out += "<tr><td>" + era + "</td></tr>"
            if (set != "") out += "<tr><td>" + set + "</td></tr>"
            if (info != "") out += "<tr><td>" + info + "</td></tr>"            
            
            let provides=""
            if (meta.provided_population || meta.required_population) {
                provides+=`<tr><td>${icons("population")+" "+ span((meta.provided_population||0) - (meta.required_population||0),true)}</td></tr>`
            } else if ((levels?.BronzeAge?.provided_population && levels?.[maxEra]?.provided_population)||(levels?.BronzeAge?.required_population && levels?.[maxEra]?.required_population)) {
                provides+=`<tr><td>${icons("population") + " " + range((levels?.BronzeAge.provided_population||0)-(levels?.BronzeAge.required_population||0),(levels?.[maxEra].provided_population||0)-(levels?.[maxEra].required_population||0),true)}</td></tr>`
            }
            if (meta.provided_happiness || meta.demand_for_happiness) {
                provides+=`<tr><td>${icons("happiness")+" "+ span((meta.provided_happiness||0)-(meta.demand_for_happiness||0),true)}</td></tr>`
            } else if ((levels?.BronzeAge?.provided_happiness && levels?.[maxEra]?.provided_happiness)||(levels?.BronzeAge?.demand_for_happiness && levels?.[maxEra]?.demand_for_happiness)) {
                provides+=`<tr><td>${icons("happiness") + " " + range((levels?.BronzeAge.provided_happiness||0)-(levels?.BronzeAge.demand_for_happiness||0),(levels?.[maxEra].provided_happiness||0)-(levels?.[maxEra].demand_for_happiness||0),true) + polMod}</td></tr>`
            }

            if (levels?.BronzeAge?.ranking_points && levels?.[maxEra]?.ranking_points) {
                provides+=`<tr><td>${icons("rank") + " " + range(levels?.BronzeAge.ranking_points,levels?.[maxEra].ranking_points)}</td></tr>`
            }

            for ([resource,amount] of Object.entries(meta?.static_resources?.resources||{})) {
                if (amount>0) provides+=`<tr><td>${icons(resource)+" "+ span(amount)}</td></tr>`
            }
            
            let prods=""
            if (meta.available_products) {
                if (levels?.BronzeAge?.produced_money && levels?.[maxEra]?.produced_money) {
                    prods+=`<tr><td>${icons("money") + range(levels?.BronzeAge.produced_money,levels?.[maxEra].produced_money) + motMod}</td></tr>`
                }
                if (levels?.BronzeAge?.clan_power && levels?.[maxEra]?.clan_power) {
                    prods+=`<tr><td>${icons("clan_power") + range(levels?.BronzeAge.clan_power,levels?.[maxEra].clan_power) + motMod}</td></tr>`
                }

                for (let p of meta.available_products) {
                    for (let [res,amount] of Object.entries(p.product?.resources||{})) {
                        if (res=="money" && levels?.BronzeAge?.produced_money) continue
                        let t=(meta?.available_products?.length!=1) ? " in "+formatTime(p.production_time): ""
                        
                        if (goodsList.includes(res)) res="goods"
                        if (amount !=0) 
                            prods+=`<tr><td>${icons(res) + span(amount)+t + motMod}</td></tr>`
                        else
                            prods+=`<tr><td>${icons(res) + range(levels?.BronzeAge.production_values[p.production_option-1].value,levels?.[maxEra].production_values[p.production_option-1].value)+t + motMod}</td></tr>`
                    }
                    if (p.unit_class) {
                        prods+=`<tr><td>${icons(p.unit_class) + p.name}</td></tr>`
                    }
                }
                for (let a of abilityList.AddResourcesAbility||[]) {
                    for (let [res,amount] of Object.entries(a.additionalResources?.BronzeAge?.resources||{})) {
                        if (amount !=0) 
                            prods+=`<tr><td>${icons(goodsList.includes(res)?"goods":res) + range(a.additionalResources.BronzeAge.resources[res],a.additionalResources[maxEra].resources[res])}</td></tr>`
                    }
                    for (let [res,amount] of Object.entries(a.additionalResources?.AllAge?.resources||{})) {
                        if (amount !=0) 
                            prods+=`<tr><td>${icons(goodsList.includes(res)?"goods":res) + span(amount)}</td></tr>`
                        }
                }
                for (let a of abilityList.AddResourcesToGuildTreasuryAbility||[]) {
                    for (let [res,amount] of Object.entries(a.additionalResources?.BronzeAge?.resources||{})) {
                        if (amount !=0) 
                            prods+=`<tr><td>${icons(goodsList.includes(res)?"treasury_goods":res) + range(a.additionalResources.BronzeAge.resources[res],a.additionalResources[maxEra].resources[res])}</td></tr>`
                    }
                    for (let [res,amount] of Object.entries(a.additionalResources?.AllAge?.resources||{})) {
                        if (amount !=0) 
                            prods+=`<tr><td>${icons(goodsList.includes(res)?"treasury_goods":res) + span(amount)}</td></tr>`
                        }
                }
                for (let a of abilityList.AddResourcesWhenMotivatedAbility||[]) {
                    for (let [res,amount] of Object.entries(a.additionalResources?.BronzeAge?.resources||{})) {
                        if (amount !=0) 
                            prods+=`<tr><td>${icons(goodsList.includes(res)?"goods":res) + range(a.additionalResources.BronzeAge.resources[res],a.additionalResources[maxEra].resources[res])+ifMot}</td></tr>`
                    }
                    for (let [res,amount] of Object.entries(a.additionalResources?.AllAge?.resources||{})) {
                        if (amount !=0) 
                            prods+=`<tr><td>${icons(goodsList.includes(res)?"goods":res) + span(amount)+ifMot}</td></tr>`
                        }
                }
                for (let a of abilityList.RandomUnitOfAgeWhenMotivatedAbility||[]) {
                        prods+=`<tr><td>${icons("military")+(a.amount||1)+ifMot}</td></tr>`
                }
                for (let a of abilityList.RandomBlueprintWhenMotivatedAbility||[]) {
                        prods+=`<tr><td>${icons("blueprint")+(a.amount||1)+ifMot}</td></tr>`
                }
                for (let a of abilityList.RandomChestRewardAbility||[]) {
                    prods+=`<tr><td><table class="randomProductions">`
                    for (let [id,rew] of Object.entries(a.rewards?.BronzeAge?.possible_rewards)) {
                        prods+=`<tr><td style="width:100%">`
                        let asset = rew?.reward?.type=="resource" ? rew.reward.subType : rew.reward.iconAssetName
                        amountBA=rew.reward?.totalAmount||rew.reward?.amount
                        amountMax=a.rewards?.[maxEra]?.possible_rewards?.[id]?.reward?.totalAmount||a.rewards?.[maxEra]?.possible_rewards?.[id]?.reward.amount
                        if (rew.reward.type=="chest" && rew.reward?.possible_rewards?.[0]?.reward?.type=="good") {
                            asset = "goods"
                            amountBA = rew.reward?.possible_rewards?.[0]?.reward?.amount||amountBA
                            amountMax = a.rewards?.[maxEra]?.possible_rewards?.[id]?.reward?.possible_rewards?.[0]?.reward?.amount||amountMax
                        }
                        prods+=icons(asset) + range(amountBA,amountMax)                    
                        prods+=`</td><td style="width:50px">${rew.drop_chance}%</td></tr>`

                    }
                    prods+=`</table></td></tr>`
                }
                
            }
            for (let a of abilityList.BonusOnSetAdjacencyAbility||[]) {
                for (let b of a.bonuses) {
                    if (Object.values(b.boost).length>0) {
                        boosts+=`<tr><td>${b.level + "x" + icons(a.setId)} ► `
                        if (b.boost.AllAge) {
                            boosts+=icons(b.boost.AllAge.type+feature[b.boost.AllAge.targetedFeature]) + " " + span(b.boost.AllAge.value) + percent(b.boost.AllAge.type)
                        }
                        if (b.boost.BronzeAge && b.boost[maxEra]) {
                            boosts+=icons(b.boost.BronzeAge.type+feature[b.boost.BronzeAge.targetedFeature]) + " " + range(b.boost.BronzeAge.value,b.boost[maxEra].value) + percent(b.boost.BronzeAge.type)
                        }
                        boosts+=`</td></tr>`
                    } else {
                        prods+=`<tr><td>${b.level + "x" + icons(a.setId)} ► `
                        if (b.revenue?.AllAge) {
                            let [res,amount] = Object.entries(b.revenue?.AllAge?.resources)[0]
                            prods+=icons(goodsList.includes(res)?"goods":res) + span(amount)
                        }
                        if (b.revenue?.BronzeAge && b.revenue?.[maxEra]) {
                            let [res,amount] = Object.entries(b.revenue?.BronzeAge?.resources)[0]
                            prods+=icons(goodsList.includes(res)?"goods":res) + range(amount,b.revenue?.[maxEra].resources[res])
                        }
                        prods+=`</td></tr>`
                    }
                }
            }
            first=true
            for (let a of abilityList.ChainLinkAbility||[]) {
                for (let b of a.bonuses) {
                    if (Object.values(b.boost).length>0) {
                        if (first) {
                            boosts+="<tr><td>" + a.description+"</td></tr>"
                            first=false
                        }
                        boosts+=`<tr><td>${b.level + "x" + icons(a.chainId)} ► `
                        if (b.boost.AllAge) {
                            boosts+=icons(b.boost.AllAge.type+feature[b.boost.AllAge.targetedFeature]) + " " + span(b.boost.AllAge.value) + percent(b.boost.AllAge.type)
                        }
                        if (b.boost.BronzeAge && b.boost[maxEra]) {
                            boosts+=icons(b.boost.BronzeAge.type+feature[b.boost.BronzeAge.targetedFeature]) + " " + range(b.boost.BronzeAge.value,b.boost[maxEra].value) + percent(b.boost.BronzeAge.type)
                        }
                        boosts+=`</td></tr>`

                    } else {
                        if (first) {
                            prods+="<tr><td>" + a.description+"</td></tr>"
                            first=false
                        }
                        prods+=`<tr><td>${b.level + "x" + icons(a.chainId)} ► `
                        if (b.revenue?.AllAge) {
                            let [res,amount] = Object.entries(b.revenue?.AllAge?.resources)[0]
                            prods+=icons(goodsList.includes(res)?"goods":res) + span(amount)
                        }
                        if (b.revenue?.BronzeAge && b.revenue?.[maxEra]) {
                            let [res,amount] = Object.entries(b.revenue?.BronzeAge?.resources)[0]
                            prods+=icons(goodsList.includes(res)?"goods":res) + range(amount,b.revenue?.[maxEra].resources[res])
                        }
                        prods+=`</td></tr>`
                    }
                }
            }
        
            
            let costs = ""
            for ([resource,amount] of Object.entries(meta?.requirements?.cost?.resources||{})) {
                if (amount>0) costs += `<div>${icons(resource) + " " + span(amount)}</div>`
            }
            provides=provides+boosts
            if (provides!="") out+=`<tr><th>Provides</th></tr>`+provides
            if (prods!="") out+=`<tr><th>Produces ${meta?.available_products?.length==1 ? "(in "+formatTime(meta.available_products[0].production_time)+")":""}</th></tr>`+prods
            if (costs !="") out+=`<tr><th>Costs</th></tr><tr><td class="multiCol">`+costs+`</td></tr>`
            
            out+=`<tr><th>Size and Building Time</th></tr>`
            out+=`<tr><td class="multiCol"><div>${icons("size")} ${meta.width+"x"+meta.length}</div><div>${icons("icon_time")}${formatTime(meta.construction_time)}</div>`
            if (meta?.requirements.street_connection_level) {
                if (meta.street_connection_level == 2)
                    out+=`<div>${icons("street_required")}2-lane road required</div>`
                else 
                    out+=`<div>${icons("road_required")}road required</div>`
                    
            }
            out+=`</td></tr>`
            
            if (traits != "") out+=`<tr><th>Traits</th></tr>`+traits
            
        }
        out+=`</table>`
        return out;
    }


}

readForgeHX.init()