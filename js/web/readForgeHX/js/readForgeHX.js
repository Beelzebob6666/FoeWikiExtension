
let readForgeHX = {
    gameVersion: localStorage.getItem("gameVersion")|| "",
    versionDate:"",
    DB: null,
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
        const isBuildingDataLoded = async () => {
            while (!MainParser.CityEntities) {
                await new Promise( resolve => requestAnimationFrame(resolve))
            }
            return true;
        };
        await isBuildingDataLoded()
        
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
                    <button class="btn-default" onclick="readForgeHX.copyLinks('discord')">Copy Links for Discord</button>
                    <button class="btn-default" onclick="readForgeHX.copyLinks('forum')">Copy Links for Forum</button>
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
                line+=`<td ${["jpg","png"].includes(file.id.split(".").pop()) ? 'class="helperTT" data-callback_tt="readForgeHX.ImageTT"':''}><a href="${srcLinks.get(file.id,true)}" target="_blank">${file.id}</a></td>`;
            } else {
                line+=`<td>${file.id}</td>`;
            }
            line+=`<td>${file.added}</td>`;
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

    ImageTT: (e) =>{
        let h=e.target.firstChild.href;
        if (!h) h = e.target.href;
        return  ["jpg","png"].includes(h.split(".").pop()) ? `<img src="${h}" style="max-width: 300px;max-height: 300px;">` : ""
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
                line+=`<td class="helperTT" data-callback_tt="readForgeHX.buildingTT">${building.name}</td>`;
            } else {
                line+=`<td>${building.name}</td>`;
            }
            line+=`<td>${b.added}</td>`;
            line+=`</tr>`;
            return line;
        })
        $('#HXTable tbody').html(table.join())
        
        
    },
    buildingTT: async (e)=>{
        let el = e.target
        while (!el.id) {
            el= el.parentElement
        }
        let b = await(readForgeHX.DB.buildings.get(el.id))
        if (!b) return;

        let meta=JSON.parse(b.JSON)

        let h = `<div style="width:min-content"><table class="foe-table" style="width: 100%;"><tr><td style="min-width:200px;max-width:200px; vertical-align:top">`+
                `<div style="color:var(--text-bright);font-weight:600;text-decoration: underline;">${meta.name}</div>`+
                `<img src="${srcLinks.get("/city/buildings/"+meta.asset_id.replace(/^(\D_)(.*?)/,"$1SS_$2")+".png",true)}" style="max-width:200px"></td>`+
                `<td style="width:100%; vertical-align:top"">Current Version:`;
        h += Tooltips.BuildingData(meta);
        if (b.oldJSON != "") {
            meta = JSON.parse(b.oldJSON)
            h += '</td><td style="width:100%; vertical-align:top"">Previous Version:';
            h += Tooltips.BuildingData(meta);
        }
        h += "</td></tr></table></div>"
        setTimeout(()=>{
            $(".handleOverflow").each((index,e)=>{
                let w= ((e.scrollWidth - e.parentNode.clientWidth) || 0)
                if (w<0)
                    e.style["animation-name"]="unset"
                else 
                    e.style.width = w + "px";
            })
        },100)
        return h
    },
    
    reset: async ()=> {
        localStorage.removeItem("gameVersion");
        x= readForgeHX.DB.delete();
    },
    copyLinks:(type=null)=>{
        let links = $('.clickToSelect.selected a')
        if (links.length == 0) return

        let l=[]
        for (x=0;x<links.length;x++) {
            if (type == "forum") {
                l.push("[IMG]" + links[x].href + "[/IMG]")
            } else if (type == "discord") {
                l.push("- ["+links[x].href.split("/").pop()+"](" + links[x].href + ")")
            } else
                l.push(links[x].href)

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

}

readForgeHX.init()



/* old
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
  
*/