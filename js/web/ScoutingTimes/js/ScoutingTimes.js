
ScoutingToWiki = {

    data: null,
    init: () => {
        WikiBox.tabs["getScoutingTimes"]={title: "Scouting Times", html: () => {return ScoutingToWiki.createHtml()}};
    },

    createHtml :() => {
        if (Object.keys(scoutingTimes.Provinces).length == 0) return "Open Map first!";
        if (!ScoutingToWiki.data) ScoutingToWiki.getTimes();
        let h=`<select onchange="ScoutingToWiki.updateOut(event)">`;
        for (let P in ScoutingToWiki.data) {
            if (!ScoutingToWiki.data[P]) continue;
            h += `<option value="${P}">${P}</option>`
        }
        h += `</select><div><textarea id="ScoutingToWikiOut" style="width: 502px;height: 200px;"></textarea></div>`
        return h
    },

    updateOut:(e)=>{
        $('#ScoutingToWikiOut').html(ScoutingToWiki.data[e.target.value]);
        helper.str.copyToClipboard(ScoutingToWiki.data[e.target.value]);
    },

    getTimes: () => {
        let format2 = (time) => {
    
            let min = Math.floor(time/60);
            let hours = Math.floor(min/60);
            let days = Math.floor(hours/24);
            min = min % 60;
            hours = hours % 24;
    
            let timestring = `${days}:`;
            timestring += (hours<10) ? `0${hours}:` : `${hours}:`;
            timestring += (min<10) ? `0${min}` : `${min}`;
    
            return timestring
        }
        for (let i in scoutingTimes.Provinces) {
            if (!scoutingTimes.Provinces[i]) continue;
            if (!scoutingTimes.Provinces[i].children) continue;
            if (scoutingTimes.Provinces[i].children.length < 1) continue;
            for (j in scoutingTimes.Provinces[i].children) {
                if (!scoutingTimes.Provinces[i].children[j]) continue;
                let x = scoutingTimes.Provinces[i].children[j]
                if (!scoutingTimes.Provinces[x.targetId].ScoutingTime || scoutingTimes.Provinces[x.targetId].ScoutingTime > x.travelTime) {
                    scoutingTimes.Provinces[x.targetId].ScoutingTime = x.travelTime;
                    scoutingTimes.Provinces[x.targetId].From = i;
                }
            }
        }
        ScoutingToWiki.data = {};
        for (let i in scoutingTimes.Provinces) {
            let rew="";
            let reward = scoutingTimes.Provinces[i]?.reward?.type;
            switch (reward) {
                case "expansion":
                    rew= "{{IEXP}}"
                    break;
                case "tower":
                    rew= "{{IMED}} [[PvP Tournaments|PvP Tower]]";
                    break;
                case "exlorationSite":
                    rew= "ExplorationSite";
                    break;
                case "goods":
                    rew="{{Goods}} Good Deposit"
                    break;
                case "loot":
                    break;
                default:
                    break;
            }

            
            let string=""
            string += `*Owner: [[${scoutingTimes.Provinces[i]?.owner?.name}]]\n`;
            string += `*Scouting Cost: {{ICOI}} ${scoutingTimes.numberWithCommas(scoutingTimes.Provinces[i]?.scoutingCost||0)}\n`;
            string += `*Scouting Time: {{ITIM}} ${format2(scoutingTimes.Provinces[i].ScoutingTime||0)} from [[${scoutingTimes.Provinces[scoutingTimes.Provinces[i].From].name}]]"\n`;
            string += `*Sectors: ???\n`;
            string += `*Infiltration Cost: {{ICOI}} ??? per sector\n`;
            string += `*Owners Battle Bonus: {{IDEB}} ???%\n`;
            string += `*Total Loot: ???\n`;
            string += `*Province Reward: ${rew}`;

            ScoutingToWiki.data[scoutingTimes.Provinces[i].name]=string;
        }
    }
}
ScoutingToWiki.init()

FoEproxy.addHandler("CampaignService","start",()=>{
	setTimeout(() => {
        WikiBox.update()
    }, 100);
})