var RESOURCE_VISUALS = {
  LECTURE_HALL: {
    icon: "🏛️",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=500&fit=crop",
    label: "Lecture Hall"
  },
  LAB: {
    icon: "🧪",
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=900&h=500&fit=crop",
    label: "Lab"
  },
  SEMINAR_ROOM: {
    icon: "🗣️",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&h=500&fit=crop",
    label: "Seminar Room"
  },
  AUDITORIUM: {
    icon: "🎤",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&h=500&fit=crop",
    label: "Auditorium"
  },
  MEETING_ROOM: {
    icon: "📋",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=900&h=500&fit=crop",
    label: "Meeting Room"
  },
  STUDY_AREA: {
    icon: "📚",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&h=500&fit=crop",
    label: "Study Area"
  },
  EQUIPMENT: {
    icon: "🛠️",
    image: "https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=900&h=500&fit=crop",
    label: "Equipment"
  },
  DEFAULT: {
    icon: "🏢",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&h=500&fit=crop",
    label: "Resource"
  }
};

function normalizeType(type) {
  if (!type) return "";
  return String(type).trim().toUpperCase();
}

export function getResourceVisual(type) {
  var key = normalizeType(type);
  if (RESOURCE_VISUALS[key]) {
    return RESOURCE_VISUALS[key];
  }
  return RESOURCE_VISUALS.DEFAULT;
}

export function formatResourceType(type) {
  var key = normalizeType(type);
  if (!key) return "Unknown";
  return key.split("_").join(" ");
}