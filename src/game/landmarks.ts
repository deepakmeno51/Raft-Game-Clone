import * as THREE from 'three';
import { StoryLocationId } from '../types/game';
import { STORY_LOCATIONS } from '../data/storyLandmarks';

export interface StoryInteractable {
  locationId: StoryLocationId;
  name: string;
  pos: THREE.Vector3;
  mesh: THREE.Object3D;
  prompt: string;
  action: string;
  completed: boolean;
}

export interface LandmarkManager {
  group: THREE.Group;
  interactables: StoryInteractable[];
  update: (dt: number, playerPos: THREE.Vector3) => void;
  checkInteraction: (cameraPos: THREE.Vector3 | THREE.Raycaster, lookDir?: THREE.Vector3) => StoryInteractable | null;
  triggerInteractable: (item: StoryInteractable) => boolean;
  interact: (
    item: StoryInteractable,
    onToast: (msg: string, col?: string) => void,
    onReward: (id: any, count: number) => void
  ) => boolean;
  getLandmarkHeightAt: (x: number, z: number) => number;
  getHeightAt: (x: number, z: number) => number;
  getUnlockedLore: () => string[];
  getCompletedLandmarks: () => StoryLocationId[];
  restoreProgress: (loreIds: string[], completedIds: StoryLocationId[]) => void;
  dispose: () => void;
}

// Common PBR Materials
const rustMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85, metalness: 0.4 });
const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.8 });
const cleanWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35, metalness: 0.1 });
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x38bdf8,
  roughness: 0.1,
  metalness: 0.1,
  transmission: 0.8,
  transparent: true,
  opacity: 0.65,
});
const neonGreenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.8 });
const neonCyanMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.8 });
const woodBeamMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
const stoneCastleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.92 });
const iceMat = new THREE.MeshPhysicalMaterial({
  color: 0xa5f3fc,
  roughness: 0.15,
  metalness: 0.05,
  transmission: 0.7,
  transparent: true,
  opacity: 0.75,
});

export function createLandmarkManager(scene: THREE.Scene): LandmarkManager {
  const group = new THREE.Group();
  scene.add(group);

  const interactables: StoryInteractable[] = [];

  // ==========================================
  // 1. THE SUNKEN BEACON (Flooded Lighthouse)
  // ==========================================
  const beaconLoc = STORY_LOCATIONS.sunken_beacon;
  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(beaconLoc.x, 0, beaconLoc.z);

  // Submerged Reef Base
  const reefGeo = new THREE.CylinderGeometry(14, 18, 5, 16);
  const reefMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
  const reef = new THREE.Mesh(reefGeo, reefMat);
  reef.position.set(0, -2.5, 0);
  reef.receiveShadow = true;
  beaconGroup.add(reef);

  // Tilted Flooded Lighthouse Tower (16m tall)
  const towerGeo = new THREE.CylinderGeometry(2.4, 4.2, 18, 12);
  const towerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.set(0, 7.0, 0);
  tower.rotation.z = 0.08; // Subtle weathered lean
  tower.castShadow = true;
  tower.receiveShadow = true;
  beaconGroup.add(tower);

  // Red Spiral Stripes
  const stripeGeo = new THREE.CylinderGeometry(2.8, 3.6, 3.5, 12);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, 9.5, 0);
  stripe.rotation.z = 0.08;
  beaconGroup.add(stripe);

  // Beacon Lantern Glass Chamber & Roof
  const lanternRoom = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 2.5, 10), glassMat);
  lanternRoom.position.set(0.6, 16.5, 0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.8, 10), rustMat);
  roof.position.set(0.6, 18.2, 0);
  beaconGroup.add(lanternRoom, roof);

  // High-Intensity Beacon Lamp (pulses when restored)
  const beaconLightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), neonCyanMat);
  beaconLightMesh.name = 'beaconLamp';
  beaconLightMesh.position.set(0.6, 16.5, 0);
  beaconGroup.add(beaconLightMesh);

  // Submerged Backup Knife Switch / Breaker Terminal at water level
  const terminalGeo = new THREE.BoxGeometry(0.7, 1.1, 0.45);
  const terminalMesh = new THREE.Mesh(terminalGeo, darkSteelMat);
  terminalMesh.position.set(3.2, 0.6, 1.2);
  beaconGroup.add(terminalMesh);

  interactables.push({
    locationId: 'sunken_beacon',
    name: 'Backup Generator Breaker',
    pos: new THREE.Vector3(beaconLoc.x + 3.2, 0.6, beaconLoc.z + 1.2),
    mesh: terminalMesh,
    prompt: '[E] Flip Knife Switch to Ignite The Sunken Beacon & Recover Logs',
    action: 'restore_beacon',
    completed: false,
  });

  group.add(beaconGroup);

  // ==========================================
  // 2. THE LEVIATHAN WRECK (Cracked Cruise Freighter)
  // ==========================================
  const leviLoc = STORY_LOCATIONS.leviathan_wreck;
  const leviGroup = new THREE.Group();
  leviGroup.position.set(leviLoc.x, 0, leviLoc.z);

  // Stern Half (Tilted heavily into water)
  const sternHull = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 38), rustMat);
  sternHull.position.set(0, 1.5, -12);
  sternHull.rotation.set(0.18, 0, 0.22);
  sternHull.castShadow = true;
  sternHull.receiveShadow = true;
  leviGroup.add(sternHull);

  // Bow Half (Cracked split section with exposed decks)
  const bowHull = new THREE.Mesh(new THREE.ConeGeometry(8, 28, 4), rustMat);
  bowHull.rotateX(Math.PI / 2);
  bowHull.rotation.z = 0.25;
  bowHull.position.set(12, 3.5, 26);
  bowHull.castShadow = true;
  leviGroup.add(bowHull);

  // Bridge Deck & Smockstack
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 12), cleanWhiteMat);
  bridge.position.set(2, 8.5, -14);
  bridge.rotation.set(0.18, 0, 0.22);
  const smokestack = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 6, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
  smokestack.position.set(3.5, 12.0, -18);
  leviGroup.add(bridge, smokestack);

  // Bridge Flight Recorder Console
  const recorderMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.6), neonGreenMat);
  recorderMesh.position.set(2.5, 10.5, -14);
  leviGroup.add(recorderMesh);

  interactables.push({
    locationId: 'leviathan_wreck',
    name: 'Leviathan Black Box Flight Recorder',
    pos: new THREE.Vector3(leviLoc.x + 2.5, 10.5, leviLoc.z - 14),
    mesh: recorderMesh,
    prompt: '[E] Download Captain Vane’s Flight Recorder & Extract Redwood Coordinates',
    action: 'restore_leviathan',
    completed: false,
  });

  group.add(leviGroup);

  // ==========================================
  // 3. REDWOOD ATOLL (Dense Volcanic Crater & Ironwood)
  // ==========================================
  const redwoodLoc = STORY_LOCATIONS.redwood_atoll;
  const redwoodGroup = new THREE.Group();
  redwoodGroup.position.set(redwoodLoc.x, 0, redwoodLoc.z);

  // Volcanic Crater Rim (Dark basalt Caldera)
  const calderaGeo = new THREE.TorusGeometry(26, 7, 8, 20);
  calderaGeo.rotateX(Math.PI / 2);
  const calderaMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.95 });
  const caldera = new THREE.Mesh(calderaGeo, calderaMat);
  caldera.position.set(0, 1.2, 0);
  caldera.receiveShadow = true;
  redwoodGroup.add(caldera);

  // Colossal Mutated Ironwood Tree Trunk (Over 24m tall!)
  const giantTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 4.2, 28, 10),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
  );
  giantTrunk.position.set(0, 14, 0);
  giantTrunk.castShadow = true;
  redwoodGroup.add(giantTrunk);

  // Massive Redwood Canopy Foliage
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(9, 12, 8), canopyMat);
  c1.position.set(0, 26, 0);
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(7, 9, 8), canopyMat);
  c2.position.set(0, 31, 0);
  redwoodGroup.add(c1, c2);

  // Wooden Scaffolding Ladder & Canopy Camp
  const treehouseDeck = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 6), woodBeamMat);
  treehouseDeck.position.set(0, 18, 0);
  redwoodGroup.add(treehouseDeck);

  // Harvestable Ironwood Log cache
  const ironwoodCache = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.2), new THREE.MeshStandardMaterial({ color: 0x581c87 }));
  ironwoodCache.position.set(0, 18.6, 1.5);
  redwoodGroup.add(ironwoodCache);

  interactables.push({
    locationId: 'redwood_atoll',
    name: 'Petrified Ironwood Cache',
    pos: new THREE.Vector3(redwoodLoc.x, 18.6, redwoodLoc.z + 1.5),
    mesh: ironwoodCache,
    prompt: '[E] Harvest Petrified Ironwood Timber & Read Botanist’s Field Diary',
    action: 'restore_redwood',
    completed: false,
  });

  group.add(redwoodGroup);

  // ==========================================
  // 4. SCRAP-CITY FLOTILLA (Floating Rust-Town)
  // ==========================================
  const scrapLoc = STORY_LOCATIONS.scrap_city;
  const scrapGroup = new THREE.Group();
  scrapGroup.position.set(scrapLoc.x, 0, scrapLoc.z);

  // Central Fortified Boardwalk Platform
  const boardPlatform = new THREE.Mesh(
    new THREE.BoxGeometry(32, 0.6, 32),
    new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.9 })
  );
  boardPlatform.position.set(0, 0.3, 0);
  boardPlatform.receiveShadow = true;
  scrapGroup.add(boardPlatform);

  // Surrounding lashed rusted boats & shipping containers
  const containerColors = [0x0284c7, 0xdc2626, 0xf59e0b, 0x16a34a];
  const containerOffsets = [
    [-10, 1.8, -10],
    [10, 1.8, -11],
    [-11, 1.8, 10],
    [9, 1.8, 10],
  ];
  containerOffsets.forEach(([cx, cy, cz], idx) => {
    const cMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 3.2, 9.5),
      new THREE.MeshStandardMaterial({ color: containerColors[idx % 4], roughness: 0.7, metalness: 0.5 })
    );
    cMesh.position.set(cx, cy, cz);
    cMesh.castShadow = true;
    scrapGroup.add(cMesh);
  });

  // Central Flotilla Trade Hub Board & Lantern Pole
  const tradePole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 6), darkSteelMat);
  tradePole.position.set(0, 2.5, 0);
  const guildBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.2), woodBeamMat);
  guildBoard.position.set(0, 3.2, 0);
  scrapGroup.add(tradePole, guildBoard);

  interactables.push({
    locationId: 'scrap_city',
    name: 'Scrap-City Guild Bulletin',
    pos: new THREE.Vector3(scrapLoc.x, 3.2, scrapLoc.z),
    mesh: guildBoard,
    prompt: '[E] Barter with Flotilla Merchants & Read Drifter Charter',
    action: 'restore_scrapcity',
    completed: false,
  });

  group.add(scrapGroup);

  // ==========================================
  // 5. THE BIODOME COLONY (Underwater Geodesic Biosphere)
  // ==========================================
  const bioLoc = STORY_LOCATIONS.biodome_colony;
  const bioGroup = new THREE.Group();
  bioGroup.position.set(bioLoc.x, 0, bioLoc.z);

  // Giant Glass Geodesic Dome (Half submerged)
  const domeGeo = new THREE.SphereGeometry(18, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMesh = new THREE.Mesh(domeGeo, glassMat);
  domeMesh.position.set(0, -6, 0);
  bioGroup.add(domeMesh);

  // Surface Air Access Tower & Landing Pier
  const pierMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 10), darkSteelMat);
  pierMesh.position.set(0, 0.35, 0);
  const airShaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 8, 12), cleanWhiteMat);
  airShaft.position.set(0, -2, 0);
  bioGroup.add(pierMesh, airShaft);

  // Airlock Hatch Console with bioluminescent blue glow
  const airlockTerminal = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.6), neonCyanMat);
  airlockTerminal.position.set(0, 1.05, 3.2);
  bioGroup.add(airlockTerminal);

  interactables.push({
    locationId: 'biodome_colony',
    name: 'Biodome Airlock Master Terminal',
    pos: new THREE.Vector3(bioLoc.x, 1.05, bioLoc.z + 3.2),
    mesh: airlockTerminal,
    prompt: '[E] Cycle Airlock & Restore Hydroponic Oxygen Core',
    action: 'restore_biodome',
    completed: false,
  });

  group.add(bioGroup);

  // ==========================================
  // 6. TRENCH-CITY SPIRE (Vertical Cliffside Outpost)
  // ==========================================
  const trenchLoc = STORY_LOCATIONS.trench_spire;
  const trenchGroup = new THREE.Group();
  trenchGroup.position.set(trenchLoc.x, 0, trenchLoc.z);

  // Towering Structural Lattice Girder Spire (32m tall)
  const spirePillars = [
    [-3, -3],
    [3, -3],
    [-3, 3],
    [3, 3],
  ];
  spirePillars.forEach(([px, pz]) => {
    const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 34, 6), darkSteelMat);
    pMesh.position.set(px, 17, pz);
    pMesh.castShadow = true;
    trenchGroup.add(pMesh);
  });

  // Multiple Climbing Staging Decks
  [8, 16, 24, 32].forEach((h) => {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.4, 7.5), darkSteelMat);
    deck.position.set(0, h, 0);
    trenchGroup.add(deck);
  });

  // Summit Broadcast Radar Dish
  const dishGeo = new THREE.SphereGeometry(3.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3);
  const dishMesh = new THREE.Mesh(dishGeo, cleanWhiteMat);
  dishMesh.position.set(0, 34, 0);
  dishMesh.rotation.x = -0.4;
  trenchGroup.add(dishMesh);

  // Summit Transmission Relay Console
  const relayMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.6), neonGreenMat);
  relayMesh.position.set(0, 32.7, 2);
  trenchGroup.add(relayMesh);

  interactables.push({
    locationId: 'trench_spire',
    name: 'Spire Master Frequency Array',
    pos: new THREE.Vector3(trenchLoc.x, 32.7, trenchLoc.z + 2),
    mesh: relayMesh,
    prompt: '[E] Align High-Altitude Frequency Grid with Glacier Station',
    action: 'restore_trench',
    completed: false,
  });

  group.add(trenchGroup);

  // ==========================================
  // 7. GLACIER STATION (Polar Research Outpost)
  // ==========================================
  const glacierLoc = STORY_LOCATIONS.glacier_station;
  const glacierGroup = new THREE.Group();
  glacierGroup.position.set(glacierLoc.x, 0, glacierLoc.z);

  // Massive Iceberg Platform (Chiseled frosted ice)
  const bergGeo = new THREE.CylinderGeometry(24, 28, 12, 10);
  const bergMesh = new THREE.Mesh(bergGeo, iceMat);
  bergMesh.position.set(0, 3.5, 0);
  bergMesh.receiveShadow = true;
  glacierGroup.add(bergMesh);

  // Polar Research Bunker Habitation Modules (Bright rescue orange & white)
  const habMesh1 = new THREE.Mesh(
    new THREE.BoxGeometry(10, 4, 7),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 })
  );
  habMesh1.position.set(0, 11, -3);
  habMesh1.castShadow = true;
  glacierGroup.add(habMesh1);

  // Frozen Geothermal Generator (Defrost switch)
  const genMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.6, 2.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7 })
  );
  genMesh.position.set(0, 10.5, 4.5);
  glacierGroup.add(genMesh);

  interactables.push({
    locationId: 'glacier_station',
    name: 'Sub-Zero Geothermal Defrost Unit',
    pos: new THREE.Vector3(glacierLoc.x, 10.5, glacierLoc.z + 4.5),
    mesh: genMesh,
    prompt: '[E] Start Geothermal Drill & Decrypt The Last Haven Master Key',
    action: 'restore_glacier',
    completed: false,
  });

  group.add(glacierGroup);

  // ==========================================
  // 8. THE LAST HAVEN (Utopian Mountain City)
  // ==========================================
  const havenLoc = STORY_LOCATIONS.last_haven;
  const havenGroup = new THREE.Group();
  havenGroup.position.set(havenLoc.x, 0, havenLoc.z);

  // Mountain Peak Island (Only dry land reaching above clouds)
  const mountainGeo = new THREE.ConeGeometry(38, 22, 16);
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
  const mountain = new THREE.Mesh(mountainGeo, mountainMat);
  mountain.position.set(0, 9.0, 0);
  mountain.receiveShadow = true;
  havenGroup.add(mountain);

  // Walled City Ramparts & Sea Gate Harbor
  const wallGeo = new THREE.TorusGeometry(22, 2.5, 6, 18);
  wallGeo.rotateX(Math.PI / 2);
  const wallMesh = new THREE.Mesh(wallGeo, stoneCastleMat);
  wallMesh.position.set(0, 7.5, 0);
  wallMesh.castShadow = true;
  havenGroup.add(wallMesh);

  // Twin Grand Sea Gate Towers
  const gateL = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 12, 8), stoneCastleMat);
  gateL.position.set(-6, 8, 20);
  const gateR = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 12, 8), stoneCastleMat);
  gateR.position.set(6, 8, 20);
  havenGroup.add(gateL, gateR);

  // Haven Utopian Spire with Golden Beacon Lantern
  const havenSpire = new THREE.Mesh(new THREE.CylinderGeometry(2, 3.5, 16, 8), cleanWhiteMat);
  havenSpire.position.set(0, 24, -4);
  const goldDome = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.15 })
  );
  goldDome.position.set(0, 32, -4);
  havenGroup.add(havenSpire, goldDome);

  // Haven Grand Harbor Docking Console
  const dockGateMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.8), neonCyanMat);
  dockGateMesh.position.set(0, 3.2, 18);
  havenGroup.add(dockGateMesh);

  interactables.push({
    locationId: 'last_haven',
    name: 'The Last Haven Sea Gate Harbor',
    pos: new THREE.Vector3(havenLoc.x, 3.2, havenLoc.z + 18),
    mesh: dockGateMesh,
    prompt: '[E] Open The Last Haven Sea Gates & Complete Shattered Horizons!',
    action: 'restore_haven',
    completed: false,
  });

  group.add(havenGroup);

  // Analytical terrain height helper for landmarks
  const getLandmarkHeightAt = (x: number, z: number): number => {
    let maxH = -Infinity;

    // Check each landmark proximity
    for (const loc of Object.values(STORY_LOCATIONS)) {
      const dx = x - loc.x;
      const dz = z - loc.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (loc.id === 'last_haven' && dist < 36) {
        const t = 1 - dist / 36;
        const h = Math.pow(t, 1.4) * 18.0;
        if (h > maxH) maxH = h;
      } else if (loc.id === 'glacier_station' && dist < 24) {
        const h = 9.5;
        if (h > maxH) maxH = h;
      } else if (loc.id === 'scrap_city' && dist < 16) {
        const h = 0.6;
        if (h > maxH) maxH = h;
      } else if (loc.id === 'redwood_atoll' && dist < 25) {
        const t = 1 - dist / 25;
        const h = Math.pow(t, 1.2) * 8.5;
        if (h > maxH) maxH = h;
      } else if (loc.id === 'sunken_beacon' && dist < 12) {
        const h = 0.5;
        if (h > maxH) maxH = h;
      } else if (loc.id === 'biodome_colony' && dist < 10) {
        const h = 0.6;
        if (h > maxH) maxH = h;
      } else if (loc.id === 'leviathan_wreck' && dist < 18) {
        const h = 3.2;
        if (h > maxH) maxH = h;
      }
    }

    return maxH;
  };

  const update = (dt: number, playerPos: THREE.Vector3) => {
    // Pulse lamps or rotate beacon
    const lamp = beaconGroup.getObjectByName('beaconLamp') as THREE.Mesh;
    if (lamp) {
      const isRestored = STORY_LOCATIONS.sunken_beacon.restored;
      lamp.visible = isRestored || Math.sin(performance.now() * 0.003) > 0;
    }
  };

  const checkInteraction = (
    camOrRay: THREE.Vector3 | THREE.Raycaster,
    lookDirOrPos?: THREE.Vector3
  ): StoryInteractable | null => {
    let cameraPos: THREE.Vector3;
    let lookDir: THREE.Vector3;

    if (camOrRay instanceof THREE.Raycaster) {
      cameraPos = lookDirOrPos || camOrRay.ray.origin;
      lookDir = camOrRay.ray.direction;
    } else {
      cameraPos = camOrRay;
      lookDir = lookDirOrPos || new THREE.Vector3(0, 0, -1);
    }

    let closest: StoryInteractable | null = null;
    let minDist = 4.8; // 4.8m reach for landmark consoles

    for (const item of interactables) {
      if (item.completed) continue;
      const dist = cameraPos.distanceTo(item.pos);
      if (dist < minDist) {
        const toItem = item.pos.clone().sub(cameraPos).normalize();
        const dot = lookDir.dot(toItem);
        if (dot > 0.65) {
          closest = item;
          minDist = dist;
        }
      }
    }
    return closest;
  };

  const triggerInteractable = (item: StoryInteractable): boolean => {
    item.completed = true;
    const loc = STORY_LOCATIONS[item.locationId];
    if (loc) {
      loc.restored = true;
      loc.discovered = true;
    }
    return true;
  };

  const interact = (
    item: StoryInteractable,
    onToast: (msg: string, col?: string) => void,
    onReward: (id: any, count: number) => void
  ): boolean => {
    triggerInteractable(item);
    const loc = STORY_LOCATIONS[item.locationId];
    onToast(`✨ Restored ${item.name}! Objective cleared for ${loc.name}!`, '#10b981');
    if (item.locationId === 'sunken_beacon') {
      onReward('power_cell', 1);
      onToast('⚡ Retrieved Backup Power Cell from the flooded lighthouse!', '#38bdf8');
    } else if (item.locationId === 'leviathan_wreck') {
      onReward('titanium_ingot', 2);
      onReward('salvaged_scrap_block', 3);
    } else if (item.locationId === 'redwood_atoll') {
      onReward('ironwood', 4);
    } else if (item.locationId === 'biodome_colony') {
      onReward('titanium_ingot', 4);
      onReward('power_cell', 1);
    } else {
      onReward('salvaged_scrap_block', 4);
    }
    return true;
  };

  const getHeightAt = (x: number, z: number): number => getLandmarkHeightAt(x, z);

  const getUnlockedLore = (): string[] => {
    const list: string[] = [];
    Object.values(STORY_LOCATIONS).forEach((loc) => {
      if (loc.restored || loc.discovered) {
        loc.loreLogs.forEach((l) => list.push(l.id));
      }
    });
    return list;
  };

  const getCompletedLandmarks = (): StoryLocationId[] => {
    return Object.values(STORY_LOCATIONS)
      .filter((loc) => loc.restored)
      .map((loc) => loc.id);
  };

  const restoreProgress = (loreIds: string[], completedIds: StoryLocationId[]) => {
    completedIds.forEach((id) => {
      const loc = STORY_LOCATIONS[id];
      if (loc) {
        loc.restored = true;
        loc.discovered = true;
      }
      interactables.forEach((item) => {
        if (item.locationId === id) item.completed = true;
      });
    });
  };

  const dispose = () => {
    scene.remove(group);
  };

  return {
    group,
    interactables,
    update,
    checkInteraction,
    triggerInteractable,
    interact,
    getLandmarkHeightAt,
    getHeightAt,
    getUnlockedLore,
    getCompletedLandmarks,
    restoreProgress,
    dispose,
  };
}
