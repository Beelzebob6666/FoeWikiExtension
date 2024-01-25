
let readForgeHX = {
    gameVersion: localStorage.getItem("gameVersion")|| "",
    versionDate:"",
    DB: null,
    imageActive:false,
    imageContainer:null,
    mousedrag:false,
    selected:false,

    database : {
        open: async () => {
            const db = readForgeHX.DB = new Dexie('HX-DB');
            
            db.version(1).stores({
                files: 'id,hash,added,updated,removed',
                strings: 'id,added,removed',
            });
            
            await db.open()
        }
    },
    init: async () => {
        WikiBox.tabs["readForgeHXFiles"]={title: "Forge HX - Files", html: () => {return readForgeHX.displayFiles()}, callback: () => {readForgeHX.activateFiles()}},
		WikiBox.tabs["readForgeHXStrings"]={title: "Forge HX - Strings", html: () => {return readForgeHX.displayStrings()}, callback: () => {readForgeHX.activateStrings()}},
	
        // wait for DB loaded

        await readForgeHX.database.open();
        // wait for ForgeHX is loaded, then read the full script url
        await WikiMayRun;
        const isElementLoaded = async () => {
            while (!srcLinks.raw) {
                await new Promise( resolve => requestAnimationFrame(resolve))
            }
            return true;
        };

        const HXloaded = await isElementLoaded()
        if (!HXloaded) return;
        if (!readForgeHX.newVersion()) return;
        readForgeHX.getDateFromVersion();
        await readForgeHX.files();
        await readForgeHX.strings();
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

        let info = ""
        if (toAdd.length > 0) {
            await readForgeHX.DB.files.bulkPut(toAdd);
            info += toAdd.length + " added\n"
        }
        if (Object.keys(toUpdate).length > 0) {
            
            let updated = await readForgeHX.DB.files.bulkGet(Object.keys(toUpdate))
            for (let s of updated) {
                s.updated = readForgeHX.versionDate
                s.hash = toUpdate[s.id];
            }       
            await readForgeHX.DB.files.bulkPut(updated);
            info += Object.keys(toUpdate).length + " updated\n"
        }
        if (Object.keys(Old).length > 0) {
            let toRemove = await readForgeHX.DB.files.bulkGet(Object.keys(Old))
            for (let s of toRemove) {
                s.removed=readForgeHX.versionDate;
            }       
            await readForgeHX.DB.files.bulkPut(toRemove);
            info += toRemove.length + " removed"
        }
        if (info !="") {
            HTML.ShowToastMsg({
                head: 'Files',
                text: info,
                type: 'info',
                hideAfter: 20000,
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
            toAdd.push({id:N,added:readForgeHX.versionDate,removed:""})
        }
        
        let info="";
        if (toAdd.length > 0) {
            await readForgeHX.DB.strings.bulkPut(toAdd);
            info += toAdd.length + " added\n"
        }
        if (Object.keys(Old).length > 0) {
            let toRemove = await readForgeHX.DB.strings.bulkGet(Object.keys(Old))
            for (let s of toRemove) {
                s.removed=readForgeHX.versionDate;
            }       
            await readForgeHX.DB.strings.bulkPut(toRemove);
            info += toRemove.length + " removed"
        }
        if (info !="") {
            HTML.ShowToastMsg({
                head: 'Strings',
                text: info,
                type: 'info',
                hideAfter: 20000,
            })
        }
    },

    newVersion:()=>{
        let copy = srcLinks.raw+"";
        let startString = 'this._systemInfo=["';
        let start = copy.indexOf(startString) + startString.length;
        copy = copy.substring(start);

        let end = copy.indexOf('"');
        let v = copy.substring(0, end);
        if (readForgeHX.gameVersion != v) {
            readForgeHX.gameVersion = v;
            localStorage.setItem("gameVersion",readForgeHX.gameVersion)
            HTML.ShowToastMsg({
                head: 'New Version',
                text: readForgeHX.gameVersion,
                type: 'info',
                hideAfter: 20000,
            })
            return true;
        } else {
            return false;
        }
    },
    getDateFromVersion:()=>{
        startString = '(';
        start = readForgeHX.gameVersion.indexOf(startString) + startString.length;
        v = readForgeHX.gameVersion.substring(start);
        end = v.indexOf(')');
        readForgeHX.versionDate = moment(v.substring(0, end),'DD.MM.YYYY hh:mm').format("YYYY-MM-DD");
    },
    displayFiles: async () => {
        let dates = await readForgeHX.DB.files.orderBy('updated').reverse().uniqueKeys();
        
        let out = '<div id="imageList" style="display:none""></div>';

        out += '<table id="HXTable" class="foe-table" ><thead><tr>'
            out += '<th>updated</th>'
            out += '<th>path</th>'
            out += '<th>added</th>'
        out += '</tr><tr>'
            out += `<th><input type="date" id="HXstartUpdate" value="${dates[0]}"></input><br/> 
                    - <input type="date" id="HXendUpdate" value="${dates[0]}"></input></th>`
            out += '<th><input id= HXfilter type="text" size="20">'
            out += '<button class="btn-default" onclick="readForgeHX.copyLinks()">Copy Links</button>'
            out += '<button class="btn-default" onclick="readForgeHX.copyLinks(true)">Copy Links for Forum</button>'
            out += '<button class="btn-default" onclick="readForgeHX.download()">Download Images</button></th>'
            out += '<th></th>'
        out += `</tr>`
        out += `</thead><tbody></tbody>`
        out += "</table>"
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
        let Image = document.createElement("div");
        Image.id= "HXPreviewImage"
        Image.style = "z-index:1000; background:white; position: absolute; display: none; max-width: 300px; max-height: 300px; pointer-events: none;"
        $('#game_body').append(Image);
        readForgeHX.imageContainer = Image;
        readForgeHX.updateFiles();
    },
    updateFiles: async () =>{
        let filter = new RegExp($('#HXfilter')[0].value);
        let startDate = $('#HXstartUpdate')[0].value;
        let endDate = $('#HXendUpdate')[0].value;
        let files = await readForgeHX.DB.files.where("updated").between(startDate,endDate,true,true).filter(file => filter.test(file.id)).toArray();
        let table = files.map(file => {
            line=`<tr class="clickToSelect" id="${file.id}">`;
            line+=`<td>${file.updated}</td>`;
            line+=`<td class="showImage"><a href="${srcLinks.get(file.id,true)}" target="_blank">${file.id}</a></td>`;
            line+=`<td>${file.added}</td>`;
            line+=`</tr>`;
            return line;
        })
        $('#HXTable tbody').html(table.join())
        $('.showImage').on("pointerenter",(e)=>{
            let h=e.target.firstChild.href;
            if (!h) h= e.target.href;
            readForgeHX.imageContainer.innerHTML=`<img src="${h}" style="max-width: 300px;max-height: 300px;">`            
            if (!readForgeHX.imageActive) {
                readForgeHX.imageActive = true;
                readForgeHX.imageContainer.style.display = "block";
                window.addEventListener("pointermove", readForgeHX.followMouse);
              }
        })
        $('.showImage').on("pointerleave",(e)=>{
            readForgeHX.imageActive = false;
            readForgeHX.imageContainer.style.display = "none";
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
        
        let out = '<div id="imageList" style="display:none""></div>';

        out += '<table id="HXTable" class="foe-table" ><thead><tr>'
            out += '<th>added</th>'
            out += '<th>string</th>'
        out += '</tr><tr>'
            out += `<th><input type="date" id="HXstartUpdate" value="${dates[0]}"></input><br/> 
                    - <input type="date" id="HXendUpdate" value="${dates[0]}"></input></th>`
            out += '<th><input id= HXfilter type="text" size="20">'
            out += '<button class="btn-default" onclick="readForgeHX.copy()">Copy</button>'
            out += '</th>'
        out += `</tr>`
        out += `</thead><tbody></tbody>`
        out += "</table>"
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
        readForgeHX.updateStrings();
    },
    updateStrings: async () =>{
        let filter = new RegExp($('#HXfilter')[0].value);
        let startDate = $('#HXstartUpdate')[0].value;
        let endDate = $('#HXendUpdate')[0].value;

        let strings = await readForgeHX.DB.strings.where("added").between(startDate,endDate,true,true).filter(string => filter.test(string.id)).toArray();

        let table = strings.map(string => {
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
    followMouse:(event)=>{
        readForgeHX.imageContainer.style.left = event.x + "px";
        readForgeHX.imageContainer.style.top = event.y + "px";
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
    }

}

readForgeHX.init()