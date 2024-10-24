Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("balancedHelpers");

const tPrimary = "temp_grass_long";
const tGrass = ["temp_grass_clovers"];
const tGrassPForest = "temp_plants_bog";
const tGrassDForest = "alpine_dirt_grass_50";
const tCliff = ["temp_cliff_a", "temp_cliff_b"];
const tGrassA = "temp_grass_d";
const tGrassB = "temp_grass_c";
const tGrassC = "temp_grass_clovers_2";
const tHill = ["temp_highlands", "temp_grass_long_b"];
const tRoad = "temp_road";
const tRoadWild = "temp_road_overgrown";
const tGrassPatch = "temp_grass_plants";
const tShore = "medit_sand_wet";
const tWater = "medit_sand_wet";

const oPoplar = "gaia/tree/poplar";
const oPalm = "gaia/tree/cretan_date_palm_short";
const oApple = "gaia/fruit/apple";
const oOak = "gaia/tree/oak";
const oBerryBush = "gaia/fruit/berry_01";
const oDeer = "gaia/fauna_deer";
const oFish = "gaia/fish/generic";
const oGoat = "gaia/fauna_goat";
const oBoar = "gaia/fauna_boar";
const oStoneLarge = "gaia/rock/temperate_large";
const oStoneSmall = "gaia/rock/temperate_small";
const oMetalLarge = "gaia/ore/temperate_large";

const oFruitBush = oBerryBush;
const oMainHuntableAnimal = oDeer;
const oSecondaryHuntableAnimal = oGoat;

const aGrass = "actor|props/flora/grass_soft_large_tall.xml";
const aGrassShort = "actor|props/flora/grass_soft_large.xml";
const aRockLarge = "actor|geology/stone_granite_large.xml";
const aRockMedium = "actor|geology/stone_granite_med.xml";
const aBushMedium = "actor|props/flora/bush_medit_me_lush.xml";
const aBushSmall = "actor|props/flora/bush_medit_sm_lush.xml";

const pForestD = [tGrassDForest + TERRAIN_SEPARATOR + oPoplar, tGrassDForest];
const pForestP = [tGrassPForest + TERRAIN_SEPARATOR + oOak, tGrassPForest];

const heightSeaGround1 = -3;
const heightShore1 = -1.5;
const heightShore2 = 0;
const heightLand = 1;
const heightOffsetBump = 4;
const heightHill = 15;

var g_Map = new RandomMap(heightLand, tPrimary);

const mapCenter = g_Map.getCenter();
const mapBounds = g_Map.getBounds();
const numPlayers = getNumPlayers();

const clPlayer = g_Map.createTileClass();
const clHill = g_Map.createTileClass();
const clForest = g_Map.createTileClass();
const clWater = g_Map.createTileClass();
const clDirt = g_Map.createTileClass();
const clRock = g_Map.createTileClass();
const clMetal = g_Map.createTileClass();
const clFood = g_Map.createTileClass();
const clBaseResource = g_Map.createTileClass();
const clHighlands = g_Map.createTileClass();

const waterPosition = fractionToTiles(0.25)
const highlandsPosition = fractionToTiles(0.75);

const startAngle = randomAngle();
const playerPlacements = placeOpposingTeams(fractionToTiles(0.25), -startAngle, mapCenter)
const [playerIDs, playerPositions] = playerPlacements;

placePlayerBases({
	"PlayerPlacement": playerPlacements,
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
        "StartingAnimal": {
	},
	"Berries": {
		"template": oBerryBush
	},
	"Mines": {
		"types": [
			{ "template": oMetalLarge },
			{ "template": oStoneLarge }
		]
	},
	"Trees": {
		"template": oOak,
		"count": 2
	},
	"Decoratives": {
		"template": aGrassShort
	}
});
Engine.SetProgress(10);

paintRiver({
	"parallel": true,
	"start": new Vector2D(mapBounds.left, mapBounds.top).rotateAround(startAngle, mapCenter),
	"end": new Vector2D(mapBounds.right, mapBounds.top).rotateAround(startAngle, mapCenter),
	"width": (numPlayers === 2 ? 2.5 : 2) * waterPosition,
	"fadeDist": scaleByMapSize(6, 25),
	"deviation": 0,
	"heightRiverbed": heightSeaGround1,
	"heightLand": heightLand,
	"meanderShort": 20,
	"meanderLong": 0,
	"waterFunc": (position, height, riverFraction) => {
		if (height < heightShore2)
			clWater.add(position);

		createTerrain(height < heightShore1 ? tWater : tShore).place(position);
	}
});
Engine.SetProgress(20);

for (let i = 0; i < numPlayers; ++i)
{
  createObjectGroupsByAreas(
    new SimpleGroup([new SimpleObject(oFish, 3, 3, 0, 4)], true, clFood),
    0,
    stayClasses(clWater, 3),
    1, 400,
    [new Area(new DiskPlacer(3, Vector2D.add(playerPositions[i], new Vector2D(scaleByMapSize(46, 90)).rotate(startAngle - Math.PI / 2))).place(new NullConstraint()))]
  );
  Engine.SetProgress(20 + i);
}

const mineralConstraints = avoidClasses(clWater, 3);
placeBalancedMinerals(playerPositions, mineralConstraints);

Engine.SetProgress(30);

Engine.SetProgress(40);

g_Map.log("Marking highlands area");
createArea(
	new ConvexPolygonPlacer(
		[
			new Vector2D(mapBounds.left, mapBounds.top - highlandsPosition),
			new Vector2D(mapBounds.right, mapBounds.top - highlandsPosition),
			new Vector2D(mapBounds.left, mapBounds.bottom),
			new Vector2D(mapBounds.right, mapBounds.bottom)
		].map(pos => pos.rotateAround(startAngle, mapCenter)),
		Infinity),
	new TileClassPainter(clHighlands));

Engine.SetProgress(43);

g_Map.log("Creating fish");
for (let i = 0; i < scaleByMapSize(50, 80); ++i)
	createObjectGroupsDeprecated(
		new SimpleGroup([new SimpleObject(oFish, 2, 3, 0, 2)], true, clFood),
		0,
		[stayClasses(clWater, 8), avoidClasses(clFood, 10)],
		numPlayers,
		50);
Engine.SetProgress(46);

g_Map.log("Creating bumps");
createAreas(
	new ClumpPlacer(scaleByMapSize(10, 60), 0.3, 0.06, Infinity),
	new SmoothElevationPainter(ELEVATION_MODIFY, heightOffsetBump, 3),
	stayClasses(clHighlands, 1),
	scaleByMapSize(300, 600));

Engine.SetProgress(49);

g_Map.log("Creating hills");
createAreas(
	new ClumpPlacer(scaleByMapSize(20, 150), 0.2, 0.1, Infinity),
	[
		new LayeredPainter([tCliff, tHill], [2]),
		new SmoothElevationPainter(ELEVATION_SET, heightHill, 2),
		new TileClassPainter(clHill)
	],
	avoidClasses(clPlayer, 30, clWater, 5, clHill, 20, clHighlands, 5, clRock, 6, clMetal, 6, clFood, 2),
	scaleByMapSize(1, 4) * numPlayers);

Engine.SetProgress(52);

g_Map.log("Creating mainland forests");
var [forestTrees, stragglerTrees] = getTreeCounts(3000, 4000, 0.7);
var types = [
	[[tGrassDForest, tGrass, pForestD], [tGrassDForest, pForestD]]
];
var size = forestTrees * 1.3 / (scaleByMapSize(4,8) * numPlayers);
var num = Math.floor(0.7 * size / types.length);
for (let type of types)
	createAreas(
		new ClumpPlacer(forestTrees / num, 0.1, 1, Infinity),
		[
			new LayeredPainter(type, [2]),
			new TileClassPainter(clForest)
		],
		avoidClasses(clPlayer, 14, clWater, 3, clForest, 24, clHill, 0, clBaseResource, 3, clRock, 2, clMetal, 2),
		num);
Engine.SetProgress(55);

g_Map.log("Creating highland forests");
var types = [
	[[tGrassDForest, tGrass, pForestP], [tGrassDForest, pForestP]]
];
var size = forestTrees / (scaleByMapSize(4,8) * numPlayers);
var num = Math.floor(size / types.length);
for (let type of types)
	createAreas(
		new ClumpPlacer(forestTrees / num, 0.1, 1, Infinity),
		[
			new LayeredPainter(type, [2]),
			new TileClassPainter(clForest)
		],
		avoidClasses(clPlayer, 20, clWater, 3, clForest, 6, clHill, 0, clMetal, 2, clRock, 2),
		num);
Engine.SetProgress(60);

g_Map.log("Creating dirt patches");
for (let size of [scaleByMapSize(3, 48), scaleByMapSize(5, 84), scaleByMapSize(8, 128)])
	createAreas(
		new ClumpPlacer(size, 0.3, 0.06, 0.5),
		[
			new LayeredPainter([[tGrass, tGrassA], [tGrassA, tGrassB], [tGrassB, tGrassC]], [1, 1]),
			new TileClassPainter(clDirt)
		],
		avoidClasses(clWater, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 4),
		scaleByMapSize(15, 45));
Engine.SetProgress(63);

g_Map.log("Creating grass patches");
for (let size of [scaleByMapSize(2, 32), scaleByMapSize(3, 48), scaleByMapSize(5, 80)])
	createAreas(
		new ClumpPlacer(size, 0.3, 0.06, 0.5),
		new LayeredPainter([tGrassC, tGrassPatch], [2]),
		avoidClasses(clWater, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 6, clBaseResource, 6),
		scaleByMapSize(15, 45));

Engine.SetProgress(66);

var group;
g_Map.log("Creating stone mines");
var group = new SimpleGroup([new SimpleObject(oStoneSmall, 0, 2, 0, 4, 0, 2 * Math.PI, 1), new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)], true, clRock);
createObjectGroupsDeprecated(group, 0,
	[avoidClasses(clWater, 0, clForest, 1, clPlayer, 60, clRock, 10, clHill, 2)],
	scaleByMapSize(4,16), 100
);

Engine.SetProgress(69);

g_Map.log("Creating small stone quarries");
group = new SimpleGroup([new SimpleObject(oStoneSmall, 2,5, 1,3)], true, clRock);
createObjectGroupsDeprecated(group, 0,
	[avoidClasses(clWater, 0, clForest, 1, clPlayer, 60, clRock, 10, clHill, 2)],
	scaleByMapSize(4,16), 100
);

Engine.SetProgress(73);

g_Map.log("Creating metal mines");
group = new SimpleGroup([new SimpleObject(oMetalLarge, 1,1, 0,4)], true, clMetal);
createObjectGroupsDeprecated(group, 0,
	[avoidClasses(clWater, 0, clForest, 1, clPlayer, 60, clMetal, 10, clRock, 5, clHill, 2)],
	scaleByMapSize(4,16), 100
);

Engine.SetProgress(76);

g_Map.log("Creating small decorative rocks");
group = new SimpleGroup(
	[new SimpleObject(aRockMedium, 1,3, 0,1)],
	true
);
createObjectGroupsDeprecated(
	group, 0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clHill, 0),
	scaleByMapSize(16, 262), 50
);
Engine.SetProgress(79);

g_Map.log("Creating large decorative rocks");
group = new SimpleGroup(
	[new SimpleObject(aRockLarge, 1,2, 0,1), new SimpleObject(aRockMedium, 1,3, 0,2)],
	true
);
createObjectGroupsDeprecated(
	group, 0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clHill, 0),
	scaleByMapSize(8, 131), 50
);
Engine.SetProgress(82);

g_Map.log("Creating deer");
group = new SimpleGroup(
	[new SimpleObject(oDeer, 5,7, 0,4)],
	true, clFood
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 50, clHill, 0, clFood, 5),
	6 * numPlayers, 50
);
Engine.SetProgress(85);

g_Map.log("Creating sheep");
group = new SimpleGroup(
	[new SimpleObject(oGoat, 2,3, 0,2)],
	true, clFood
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 50, clHill, 0, clFood, 20),
	3 * numPlayers, 50
);
Engine.SetProgress(88);

g_Map.log("Creating berry bush");
group = new SimpleGroup(
	[new SimpleObject(oBerryBush, 5,7, 0,4)],
	true, clFood
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clWater, 6, clForest, 0, clPlayer, 45, clHill, 1, clFood, 10),
	randIntInclusive(1, 4) * numPlayers + 2, 50
);
Engine.SetProgress(92);

g_Map.log("Creating boar");
group = new SimpleGroup(
	[new SimpleObject(oBoar, 2,3, 0,2)],
	true, clFood
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 50, clHill, 0, clFood, 20),
	2 * numPlayers, 50
);

createStragglerTrees(
	[oPoplar, oPalm, oApple],
	avoidClasses(clWater, 1, clForest, 1, clHill, 1, clPlayer, 38, clMetal, 6, clRock, 6, clForest, 6),
	clForest,
	stragglerTrees);


g_Map.log("Creating small grass tufts");
group = new SimpleGroup(
	[new SimpleObject(aGrassShort, 1,2, 0,1, -Math.PI / 8, Math.PI / 8)]
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clWater, 2, clHill, 2, clPlayer, 2, clDirt, 0),
	scaleByMapSize(13, 200)
);

g_Map.log("Creating large grass tufts");
group = new SimpleGroup(
	[new SimpleObject(aGrass, 2,4, 0,1.8, -Math.PI / 8, Math.PI / 8), new SimpleObject(aGrassShort, 3,6, 1.2,2.5, -Math.PI / 8, Math.PI / 8)]
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clWater, 3, clHill, 2, clPlayer, 2, clDirt, 1, clForest, 0),
	scaleByMapSize(13, 200)
);
Engine.SetProgress(95);

g_Map.log("Creating bushes");
group = new SimpleGroup(
	[new SimpleObject(aBushMedium, 1,2, 0,2), new SimpleObject(aBushSmall, 2,4, 0,2)]
);
createObjectGroupsDeprecated(group, 0,
	avoidClasses(clWater, 1, clHill, 1, clPlayer, 1, clDirt, 1),
	scaleByMapSize(13, 200), 50
);

placePlayersNomad(clPlayer, avoidClasses(clWater, 4, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

setSkySet("cirrus");
setWaterColor(0.114, 0.192, 0.463);
setWaterTint(0.255, 0.361, 0.651);
setWaterWaviness(2.0);
setWaterType("ocean");
setWaterMurkiness(0.83);

g_Map.ExportMap();
