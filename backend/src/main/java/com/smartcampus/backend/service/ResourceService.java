package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.ResourceRequest;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private static final Set<String> ALLOWED_FACILITIES = Set.of(
            "PROJECTOR",
            "WIFI",
            "AIRCON",
            "WHITEBOARD",
            "SMART_BOARD",
            "SPEAKER_SYSTEM"
    );

    private final ResourceRepository resourceRepository;

    public List<Resource> findAllFiltered(
            String type,
            Integer minCapacity,
            Integer maxCapacity,
            String location,
            String status,
            String search) {

        String typeValue = normalize(type);
        String locationValue = normalize(location);
        String statusValue = normalize(status);
        String searchValue = normalize(search);

        return resourceRepository.findAll().stream()
                .filter(resource -> typeValue == null
                        || (resource.getType() != null
                        && resource.getType().name().equalsIgnoreCase(typeValue)))
                .filter(resource -> minCapacity == null
                        || (resource.getCapacity() != null
                        && resource.getCapacity() >= minCapacity))
                .filter(resource -> maxCapacity == null
                        || (resource.getCapacity() != null
                        && resource.getCapacity() <= maxCapacity))
                .filter(resource -> locationValue == null
                        || containsIgnoreCase(resource.getLocation(), locationValue))
                .filter(resource -> statusValue == null
                        || (resource.getStatus() != null
                        && resource.getStatus().name().equalsIgnoreCase(statusValue)))
                .filter(resource -> searchValue == null
                        || containsIgnoreCase(resource.getName(), searchValue)
                        || containsIgnoreCase(resource.getLocation(), searchValue)
                        || containsIgnoreCase(resource.getDescription(), searchValue))
                .sorted(Comparator.comparing(Resource::getName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    public Resource getByIdOrThrow(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
    }

    public Resource create(ResourceRequest request) {
        validateAvailabilityWindow(request);

        String hallId = buildHallId(
            request.getBuildingName(),
            request.getBlock(),
            request.getFloor(),
            request.getHallNumber()
        );
        ensureHallIdUniqueForCreate(hallId);

        Resource resource = new Resource();
        applyRequest(resource, request);

        Instant now = Instant.now();
        resource.setCreatedAt(now);
        resource.setUpdatedAt(now);

        return resourceRepository.save(resource);
    }

    public Resource update(String id, ResourceRequest request) {
        validateAvailabilityWindow(request);

        String hallId = buildHallId(
            request.getBuildingName(),
            request.getBlock(),
            request.getFloor(),
            request.getHallNumber()
        );
        ensureHallIdUniqueForUpdate(hallId, id);

        Resource existing = getByIdOrThrow(id);
        applyRequest(existing, request);
        existing.setUpdatedAt(Instant.now());

        return resourceRepository.save(existing);
    }

    public void delete(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        resourceRepository.deleteById(id);
    }

    public Resource updateStatus(String id, String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status is required"
            );
        }

        Resource existing = getByIdOrThrow(id);
        try {
            existing.setStatus(com.smartcampus.backend.model.ResourceStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid status. Must be ACTIVE or OUT_OF_SERVICE"
            );
        }
        existing.setUpdatedAt(Instant.now());

        return resourceRepository.save(existing);
    }

    private void applyRequest(Resource resource, ResourceRequest request) {
        validateBuildingBlock(request);

        String hallId = buildHallId(
                request.getBuildingName(),
                request.getBlock(),
                request.getFloor(),
                request.getHallNumber()
        );

        resource.setName(request.getName().trim());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation().trim());
        resource.setDescription(request.getDescription() == null ? "" : request.getDescription().trim());
        resource.setAvailableFrom(request.getAvailableFrom().trim());
        resource.setAvailableTo(request.getAvailableTo().trim());

        resource.setBuildingName(request.getBuildingName().trim().toUpperCase(Locale.ROOT));
        resource.setBlock(request.getBlock().trim().toUpperCase(Locale.ROOT));
        resource.setFloor(request.getFloor());
        resource.setHallNumber(request.getHallNumber());
        resource.setHallId(hallId);
        resource.setFacilities(normalizeFacilities(request.getFacilities()));

        resource.setStatus(request.getStatus());
    }

    private void validateBuildingBlock(ResourceRequest request) {
        String building = request.getBuildingName().trim().toUpperCase(Locale.ROOT);
        String block = request.getBlock().trim().toUpperCase(Locale.ROOT);

        if ("MAIN".equals(building) && !Set.of("A", "B").contains(block)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MAIN building only allows block A or B");
        }
        if ("NEW".equals(building) && !Set.of("F", "G").contains(block)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "NEW building only allows block F or G");
        }
    }

    private String buildHallId(String building, String block, Integer floor, Integer hallNumber) {
        String b = building.trim().toUpperCase(Locale.ROOT);
        String bl = block.trim().toUpperCase(Locale.ROOT);
        String floorPart = String.format("%02d", floor);
        String hallPart = String.format("%03d", hallNumber);
        return b + "-" + bl + "-" + floorPart + "-" + hallPart;
    }

    private List<String> normalizeFacilities(List<String> facilities) {
        if (facilities == null || facilities.isEmpty()) {
            return new ArrayList<>();
        }

        return facilities.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> v.trim().toUpperCase(Locale.ROOT).replace(' ', '_'))
                .filter(ALLOWED_FACILITIES::contains)
                .distinct()
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private void validateAvailabilityWindow(ResourceRequest request) {
        try {
            LocalTime from = LocalTime.parse(request.getAvailableFrom().trim());
            LocalTime to = LocalTime.parse(request.getAvailableTo().trim());

            if (!from.isBefore(to)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Available from time must be earlier than available to time"
                );
            }
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time format must be HH:mm");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty() || "ALL".equalsIgnoreCase(trimmed)) {
            return null;
        }
        return trimmed;
    }

    private boolean containsIgnoreCase(String source, String target) {
        if (source == null || target == null) {
            return false;
        }
        return source.toLowerCase(Locale.ROOT).contains(target.toLowerCase(Locale.ROOT));
    }

    private void ensureHallIdUniqueForCreate(String hallId) {
        if (resourceRepository.existsByHallId(hallId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource with the same hall ID already exists");
        }
    }

    private void ensureHallIdUniqueForUpdate(String hallId, String id) {
        if (resourceRepository.existsByHallIdAndIdNot(hallId, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource with the same hall ID already exists");
        }
    }
}