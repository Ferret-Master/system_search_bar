
var searchSelected = ko.computed(function(){
  return model.cShareSystems_selectedTab().key == "system-search"
});

var systemTabs = model.cShareSystems_tabsIndex()

systemTabs["system-search"] = {
  key:"system-search",
  name:"System Search",
  systems: ko.observable([])
}

model.cShareSystems_tabsIndex(systemTabs)


if(localStorage.recentSystems == undefined){
  localStorage.recentSystems = [];
}



// ko.computed(function(){
//   var currentSystem = model.loadedSystem()
//   if(localStorage.recentSystems.length<10){
//     var author = convertToLower(currentSystem.creator)
//     var name = convertToLower(currentSystem.name)
//     localStorage.recentSystems.push(author+name)
//   }
//   else{
//     var newLocalStorage = localStorage.recentSystems.slice(1,localStorage.recentSystems.length);
//     newLocalStorage.push(author+name)
//     localStorage.recentSystems = newLocalStorage
//   }
// })

function setUpSearchTab(){
  var tab = $("a[href='" + "#system-search" +"']");

  if(tab.length == 0){ _.delay(setUpSearchTab,1000); return}

  $("a[href='" + "#system-search" +"']").attr("id","system-search")

  $.get("coui://ui/mods/system_search_bar/system_search_bar.html", function (html) {
    if($("#systems").length == 0){ _.delay(setUpSearchTab,1000); return}
		$("#systems").prepend(html);
    model.cShareSystems_selectedTabKey("system-search")
})
}

setUpSearchTab()

model.maxSystems = ko.observable("100");

model.filterMapSelected = ko.observable(false);
model.filterMapInput = ko.observable("");

model.filterAuthorSelected = ko.observable(false);
model.filterAuthorInput = ko.observable("");


model.planetBiomes = ["none","earth","desert","ice","tropical","metal","lava","moon","gas","asteroid"];
model.selectedBiome = ko.observable("none");

model.minimumRadius = ko.observable("0");
model.maximumRadius = ko.observable("5000");

model.minimumPlanets = ko.observable("0");
model.maximumPlanets = ko.observable("16");

model.minimumPlayers = ko.observable("0");
model.maximumPlayers = ko.observable("32");

model.minimumMetalPerPlayer = ko.observable("0");
model.maximumMetalPerPlayer = ko.observable("2000");

model.shared = ko.observable(false);

model.spawnSetups = ["Any","1v1","2v2","3v3","4v4","5v5"];
model.spawnSetup = ko.observable();

model.highlightRecent = ko.observable(false);

model.includeUnknownPlayers = ko.observable(true);

model.searchSystems = ko.observable([])

var duplicateMap = {}

var mapsLoaded = ko.observable();

model.systemSearch = ko.computed(function(){
  
  duplicateMap = {}
  var tabs = model.cShareSystems_tabs();
  var searchSystems = [];
  var maxSystems = Number(model.maxSystems()) || 100;
  var filterMapInput = model.filterMapInput().toLowerCase();

  
  var filterAuthorInput = model.filterAuthorInput().toLowerCase();


  var selectedBiome = model.selectedBiome();

  var minimumPlanets = Number(model.minimumPlanets()) || 0;
  var maximumPlanets = Number(model.maximumPlanets()) || 16;

  var minimumPlayers = Number(model.minimumPlayers()) || 2;
  var maximumPlayers = Number(model.maximumPlayers()) || 16;

  var minimumMetalPerPlayer = Number(model.minimumMetalPerPlayer())|| 0;
  var maximumMetalPerPlayer = Number(model.maximumMetalPerPlayer())|| 0;

  var minimumRadius =  Number(model.minimumRadius()) || 0;
  var maximumRadius =  Number(model.maximumRadius()) || 5000;

  var shared = ko.observable(false);
  var spawnSetup = model.spawnSetup();
  model.highlightRecent = ko.observable(false);
  if(mapsLoaded() == true){
  _.map(tabs,function(tab){
    _.map(tab.systems(),function(system){
        if(passesFilters(system, filterMapInput,filterAuthorInput,selectedBiome,minimumPlanets,maximumPlanets,minimumPlayers,maximumPlayers,minimumMetalPerPlayer,maximumMetalPerPlayer,shared,spawnSetup, minimumRadius, maximumRadius)){
            // var author = convertToLower(system.creator)
            // var name = convertToLower(system.name)
            // if(_.contains(recentSystems,author+name)){
            //   system.highlight = true;
            // }
            searchSystems.push(system)
        }
      })
  })
}


  model.searchSystems(searchSystems);
  systemTabs["system-search"].systems(model.searchSystems().slice(0,maxSystems)); 

})

function passesFilters(system, mapFilter, authorFilter, biomeFilter, minPlanets, maxPlanets, minPlayers, maxPlayers, minMetal, maxMetal, shared, spawnSetup, minRadius, maxRadius){

    var author = convertToLower(system.creator)
    var description = convertToLower(system.description)
    var name = convertToLower(system.name)
    if(duplicateMap[author + name] == undefined){
      duplicateMap[author + name] = true
    }
    else{return false}
    if(!(_.contains(name, mapFilter) || _.contains(description, mapFilter))){return false}
    if(!(_.contains(author, authorFilter)) && system.author !== undefined){return false}
    if(system.planets.length > maxPlanets || system.planets.length < minPlanets){return false}
    var totalMetal = 0;
    var metalKey = false;
    var biomes = []
    var invalidRadius = false;
    _.map(system.planets, function(planet){
      if(planet.planet.radius < minRadius || planet.planet.radius > maxRadius){invalidRadius = true}
      if(planet.metal_spots !== undefined){totalMetal += planet.metal_spots.length||0;}

      if(planet.planet.metalClusters !== undefined){totalMetal += planet.planet.metalClusters}

      if(planet.metal_spots_key !== undefined){metalKey = true}

      var planetBiome = planet.planet.biome
      if(planetBiome == "earth" && planet.planet.temperature< 0.5){planetBiome = "ice"}
      biomes.push(planetBiome)
    })
    if(invalidRadius == true){return false}
    if(!_.contains(biomes, biomeFilter) && biomeFilter !== "none"){return false}
    if((totalMetal > maxMetal || totalMetal < minMetal) && metalKey == false){return false}
    if(system.players !== undefined){
      if(minPlayers > system.players[0] || maxPlayers < system.players[1]){return false;}
    }
    else{
      if(model.includeUnknownPlayers() == false){return false}
    }
    return true
}
   
function convertToLower(string){
  if(string == undefined){return ""}
  return string.toLowerCase()
}

_.delay(function(){mapsLoaded(true)}, 1500)