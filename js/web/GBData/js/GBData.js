//Not implemented... Does not work due to CORS issue:
//Access to XMLHttpRequest at 'https://api.foe-helper.com/v1/LegendaryBuilding/list' from origin 'https://zz1.forgeofempires.com' has been blocked by CORS policy: Request header field client-identification is not allowed by Access-Control-Allow-Headers in preflight response.
GBData = {

    data: null,
    init: () => {
        WikiBox.tabs["GBData"]={title: "GB Data from Helper API", html: () => {return GBData.createHtml()}, callback:GBData.callback};
        
        GBData.GetLB.readApi();
    },

    createHtml :() => {
        let h=`<select id="LBs">
        </select>
      
        <div class="results">
          <div>
            Max: <span id="max"></span>
          </div>
          <div>
            Missing: <span id="missing"></span>
          </div>
          <div class="tab">
            <button class="tablinks" onclick="GBData.openTab(event, 'Levels')">Data</button>
            <button class="tablinks" onclick="GBData.openTab(event, 'Wiki')">Wiki</button>
            <button class="tablinks" onclick="GBData.openTab(event, 'Contribution')">Contribution</button>
          </div>
          <div id="All">
            <table id="Levels" class="tabcontent">
              <thead>
                <tr>
      
                </tr>
              </thead>
              <tbody></tbody>
            </table>
      
            <textarea style="resize:none; width:100%; height:800px" id="Wiki" class="tabcontent"></textarea>
            <textarea style="resize:none; width:100%; height:800px" id="Contribution" class="tabcontent"></textarea>
          </div>
          <div style="clear:both">
            <br>
            <br>
            <br>
          </div>
        </div>`;
        
        return h
    },

    callback: ()=>{
        GBData.GetLB.readApi();
        $("#LBs").change(function () {
            GBData.LB.id = $(this).children(":selected").attr("value");
            if (GBData.LB.id == "none") {
              $('#Levels').find('thead').find('tr').html('');
              $('#Levels').find('tbody').html('');
              $('#Wiki').html('');
              $('#Contribution').html('');
            } else {
              GBData.GetData.init()
            }
          });
    },

    LB: {
        id: '',
        end: 'bulk', // "get" für einzelnes Level
        from: 1, // wenn "get" dann hier das Level
        to: 199
      },

    GetData: {
  
        api: 'https://api.foe-helper.com/v1/LegendaryBuilding/',
  
        id: null,
        from: 0,
        to: 0,
  
        init: () => {
  
          GBData.GetData.id = GBData.LB.id;
          GBData.GetData.end = GBData.LB.end;
          GBData.GetData.from = GBData.LB.from;
          GBData.GetData.to = GBData.LB.to;
  
          GBData.GetData.compare();
          GBData.GetData.readApi();
        },
        compare: () => {
          let url = `${GBData.GetData.api}compare?id=${GBData.GetData.id}`;
          $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json',
            async: true,
            crossDomain: true,
            headers: {
              'x-api-key': 'v3hjcsjzuq5dcndf3rbswd9f9twj89ku',
              'accept': 'application/json'
            },
            success: function (data) {
              //console.log(data);
              let missing = "none";
              let max = data.response.max;
              for (let i in data.response.missing) {
                if (i == 0) {
                  missing = ""
                } else {
                  missing += ", "
                }
                missing += data.response.missing[i]
              }
  
              $('#max').html(max);
              $('#missing').html(missing);
            }
          })
        },
        readApi: () => {
          let url;
  
          if (GBData.GetData.end === 'bulk') {
            url = `${GBData.GetData.api}bulk?id=${GBData.GetData.id}&level-from=${GBData.GetData.from}&level-to=${GBData.GetData.to}&testing`;
  
          } else {
            url = `${GBData.GetData.api}get?id=${GBData.GetData.id}&level=${GBData.GetData.from}`;
          }
  
          $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json',
            async: true,
            crossDomain: true,
            headers: {
              'x-api-key': 'v3hjcsjzuq5dcndf3rbswd9f9twj89ku',
              'accept': 'application/json'
            },
            success: function (data) {
              //console.log(data);
              function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              }
  
              function lines(x) {
                let line = "|-| Lvl " + x.level
                try {
  
                  line += " = {{Contribution|P1=" + x.patron_bonus[0].forgepoints;
                  line += "|M1=" + x.patron_bonus[0].medals;
                  line += "|BP1=" + x.patron_bonus[0].blueprints;
                  line += "|BP2=" + x.patron_bonus[1].blueprints;
                  line += "|BP3=" + x.patron_bonus[2].blueprints;
                  line += "|BP4=" + x.patron_bonus[3].blueprints;
                  line += "|BP5=" + x.patron_bonus[4].blueprints;
                } catch (err) { }
                line += '}}';
                return line;
              }
  
  
              let resp = data.response,
                html = [],
                htmlwiki = [],
                htmlh = [],
                last = 0,
                line = "",
                contribution = [];
              let htmlhwiki = '! Lvl<br />{{GrB}} \n! Req.<br />{{FP}}';
              let th = "";
              htmlh.push('<th>Lvl</th><th>FP</th>');
  
              if (GBData.GetData.end === 'bulk') {
  
                for (let i in resp) {
  
                  if (Math.ceil(resp[i].level / 10) > last) {
                    last = Math.ceil(resp[i].level / 10);
                    if (i != 0) {
                      line = "</tabber>\n</div></div>";
                      contribution.push(line)
                    }
                    line = '<div class="mw-collapsible mw-collapsed">';
                    contribution.push(line);
                    line = '<div style="font-size:large"> Levels ' + ((last * 10) - 9) + " - " + last * 10 + ' </div>\n<div class="mw-collapsible-content">\n<tabber>';
                    contribution.push(line)
                  }
  
                  contribution.push(lines(resp[i]).replace(/undefined/g, "").replace(/=0/g, "="));
  
                  let tr = '<tr>';
                  let tr2 = '|-\n'
                  tr += '<td>' + resp[i].level + '</td>';
                  tr2 += '|' + resp[i].level;
                  tr += '<td>' + numberWithCommas(resp[i].total_fp + '') + '</td>';
                  tr2 += '||' + numberWithCommas(resp[i].total_fp + '');
                  for (let x in resp[i].rewards) {
                    if (i == 0) {
                      htmlh.push('<th>' + x + '</th>');
                      htmlhwiki += ' \n! ' + headers[x];
                      switch (x) {
                        case 'fierce_resistance':
                          htmlh.push('<th> support_boost </th>')
                          htmlhwiki += '\n! ' + headers.support_boost;
                          break;
                        case 'population':
                          htmlh.push('<th> Eff </th>');
                          htmlhwiki += '\n! ' + headers.pps;
                          break;
                        case 'happiness':
                          htmlh.push('<th> Eff </th>');
                          htmlhwiki += '\n! ' + headers.hps;
                          break;
                        case 'totem_drop':
                          htmlhwiki += '\n! ' + headers.sr;
                          htmlhwiki += '\n! ' + headers.gr;
                          htmlhwiki += '\n! ' + headers.jr;
                          break;
                        case 'mysterious_shards':
                          console.log(resp);
                          break;
                      }
                    }
                    let amount = "";
                    if (trials[x]) {
                      amount = resp[i].trials + "x ";
                    }
                    tr += '<td>' + amount + numberWithCommas(resp[i].rewards[x]) + percent[x] + '</td>';
                    tr2 += '||' + amount + numberWithCommas(resp[i].rewards[x]) + percent[x];
                    switch (x) {
                      case "totem_drop":
                        tr += '<td>' + (resp[i].chances.silver) + '%</td>';
                        tr += '<td>' + (resp[i].chances.gold) + '%</td>';
                        tr += '<td>' + (resp[i].chances.jade) + '%</td>';
                        tr2 += '||' + (resp[i].chances.silver) + '%';
                        tr2 += '||' + (resp[i].chances.gold) + '%';
                        tr2 += '||' + (resp[i].chances.jade) + '%';
                        break;
                      case ('happiness'):
                        tr += '<td>' + numberWithCommas(Math.round(resp[i].rewards[x] / size[GBData.GetData.id])) + '</td>';
                        tr2 += '||' + numberWithCommas(Math.round(resp[i].rewards[x] / size[GBData.GetData.id]));
                        break;
                      case ('population'):
                        tr += '<td>' + numberWithCommas(Math.round(resp[i].rewards[x] / size[GBData.GetData.id])) + '</td>';
                        tr2 += '||' + numberWithCommas(Math.round(resp[i].rewards[x] / size[GBData.GetData.id]));
                        break;
                      case 'fierce_resistance':
                        tr += '<td>' + numberWithCommas(resp[i].rewards[x]) + '</td>';
                        tr2 += '||' + numberWithCommas(resp[i].rewards[x]);
                        break;
                    }
                  }
                  //let tr2 = tr.replace(/<\/td><td>/g, " || ").replace(/<tr>/, '|-\n').replace(/<td>/, '| ').replace(/<\/td>/, '');
  
                  tr += '</tr>';
  
                  html.push(tr.replace(/undefined/g, "??"));
                  htmlwiki.push(tr2.replace(/undefined/g, "??"))
                }
  
              } else {
                let tr = '<tr>';
  
                tr += '<td>' + resp.level + '</td>';
                tr += '<td>' + numberWithCommas(resp.total_fp + '') + '</td>';
  
                tr += '</tr>';
  
                html.push(tr);
              }
  
              $('#Levels').find('thead').find('tr').html(htmlh.join(''));
              $('#Levels').find('tbody').html(html.join(''));
              $('#Wiki').html(htmlhwiki + "\n" + htmlwiki.join('\n'));
              $('#Contribution').html(contribution.join('\n') + "</tabber></div></div>");
            }
          }).fail(function () {
            console.log("Error!");
          });
        }
  
      },
      GetLB: {
  
        api: 'https://api.foe-helper.com/v1/LegendaryBuilding/list',
  
        id: null,
        from: 0,
        to: 0,
  
        readApi: () => {
          let url;
          url = `${GBData.GetLB.api}`;
  
          $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json',
            async: true,
            crossDomain: true,
            headers: {
              'x-api-key': 'v3hjcsjzuq5dcndf3rbswd9f9twj89ku',
              'accept': 'application/json'
            },
            success: function (data) {
              //console.log(data);
  
              let resp = data.response,
                html = [];
              let selectoption = '<option value="none">none selected</option>';
              html.push(selectoption);
              for (let i in resp.buildings) {
                selectoption = ' <option value="';
  
                selectoption += resp.buildings[i].id + '">';
                selectoption += resp.buildings[i].name + '</option>';
  
                html.push(selectoption);
              }
  
              $('#LBs').html(html.join(''));
            }
          }).fail(function () {
            console.log("Error!");
          });
        }
      },

      openTab:(evt, tabName)=> {
        // Declare all variables
        var i, tabcontent, tablinks;
  
        // Get all elements with class="tabcontent" and hide them
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
          tabcontent[i].style.display = "none";
        }
  
        // Get all elements with class="tablinks" and remove the class "active"
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
          tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
  
        // Show the current tab, and add an "active" class to the button that opened the tab
        let tab = document.getElementById(tabName);
  
        tab.style.display = "block";
        evt.currentTarget.className += " active";
  
        if (tab.nodeName == "TEXTAREA") {
          tab.select();
          document.execCommand("copy");
          tab.setSelectionRange(0, 0);
        }
      }
}

GBData.init()

FoEproxy.addHandler("CampaignService","start",()=>{
	setTimeout(() => {
        WikiBox.update()
    }, 100);
})