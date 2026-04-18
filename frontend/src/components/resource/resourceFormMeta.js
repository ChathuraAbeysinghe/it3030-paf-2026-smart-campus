export var BUILDING_OPTIONS = ["MAIN", "NEW"];

export var BLOCK_OPTIONS_BY_BUILDING = {
  MAIN: ["A", "B"],
  NEW: ["F", "G"]
};

export var FACILITY_OPTIONS = [
  "PROJECTOR",
  "WIFI",
  "AIRCON",
  "WHITEBOARD",
  "SMART_BOARD",
  "SPEAKER_SYSTEM"
];

export function formatFacilityName(value) {
  return String(value || "").split("_").join(" ");
}

export function generateHallId(buildingName, block, floor, hallNumber) {
  var b = String(buildingName || "").trim().toUpperCase();
  var bl = String(block || "").trim().toUpperCase();
  var f = Number(floor);
  var h = Number(hallNumber);

  if (!b || !bl || !Number.isInteger(f) || f < 0 || !Number.isInteger(h) || h < 1) {
    return "";
  }

  var floorPart = String(f).padStart(2, "0");
  var hallPart = String(h).padStart(3, "0");
  return b + "-" + bl + "-" + floorPart + "-" + hallPart;
}
