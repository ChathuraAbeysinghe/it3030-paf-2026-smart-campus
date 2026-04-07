// backend/src/main/java/com/smartcampus/backend/service/ResourceService.java
package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.ResourceRequest;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ResourceService {

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
        Resource resource = new Resource();
        applyRequest(resource, request);

        Instant now = Instant.now();
        resource.setCreatedAt(now);
        resource.setUpdatedAt(now);

        return resourceRepository.save(resource);
    }

    public Resource update(String id, ResourceRequest request) {
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

    private void applyRequest(Resource resource, ResourceRequest request) {
        resource.setName(request.getName().trim());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation().trim());
        resource.setDescription(request.getDescription().trim());
        resource.setStatus(request.getStatus());
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
}