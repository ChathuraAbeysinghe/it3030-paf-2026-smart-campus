package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.ResourceRequest;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceStatus;
import com.smartcampus.backend.model.ResourceType;
import com.smartcampus.backend.repository.ResourceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private ResourceService resourceService;

    @Test
    void createShouldRejectDuplicateHallId() {
        ResourceRequest request = validRequest();
        when(resourceRepository.existsByHallId("MAIN-A-02-105")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> resourceService.create(request));

        assertEquals(409, ex.getStatusCode().value());
        assertEquals("Resource with the same hall ID already exists", ex.getReason());
    }

    @Test
    void updateShouldRejectDuplicateHallIdOfAnotherResource() {
        ResourceRequest request = validRequest();
        Resource existing = Resource.builder()
                .id("res-1")
                .name("Old Hall")
                .type(ResourceType.LECTURE_HALL)
                .capacity(100)
                .location("MAIN-A-01-001")
                .description("old")
                .availableFrom("08:00")
                .availableTo("16:00")
                .buildingName("MAIN")
                .block("A")
                .floor(1)
                .hallNumber(1)
                .hallId("MAIN-A-01-001")
                .status(ResourceStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(resourceRepository.existsByHallIdAndIdNot("MAIN-A-02-105", "res-1")).thenReturn(true);
        when(resourceRepository.findById("res-1")).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> resourceService.update("res-1", request));

        assertEquals(409, ex.getStatusCode().value());
        assertEquals("Resource with the same hall ID already exists", ex.getReason());
    }

    @Test
    void findAllFilteredShouldApplyTypeLocationCapacityAndStatusFilters() {
        Resource hall = Resource.builder()
                .id("1")
                .name("Main Hall A")
                .type(ResourceType.LECTURE_HALL)
                .capacity(120)
                .location("MAIN-A-01-101")
                .description("Lecture hall")
                .availableFrom("08:00")
                .availableTo("18:00")
                .status(ResourceStatus.ACTIVE)
                .build();

        Resource lab = Resource.builder()
                .id("2")
                .name("Lab F")
                .type(ResourceType.LAB)
                .capacity(45)
                .location("NEW-F-02-205")
                .description("Computer lab")
                .availableFrom("08:00")
                .availableTo("18:00")
                .status(ResourceStatus.ACTIVE)
                .build();

        when(resourceRepository.findAll()).thenReturn(List.of(hall, lab));

        List<Resource> results = resourceService.findAllFiltered(
                "LECTURE_HALL",
                100,
                150,
                "main-a",
                "ACTIVE",
                "hall"
        );

        assertEquals(1, results.size());
        assertEquals("Main Hall A", results.get(0).getName());
    }

    @Test
    void updateStatusShouldRejectInvalidStatus() {
        Resource existing = Resource.builder()
                .id("1")
                .name("Hall")
                .type(ResourceType.LECTURE_HALL)
                .capacity(100)
                .location("MAIN-A-01-001")
                .description("desc")
                .availableFrom("08:00")
                .availableTo("16:00")
                .buildingName("MAIN")
                .block("A")
                .floor(1)
                .hallNumber(1)
                .hallId("MAIN-A-01-001")
                .status(ResourceStatus.ACTIVE)
                .build();

        when(resourceRepository.findById("1")).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> resourceService.updateStatus("1", "BROKEN"));

        assertEquals(400, ex.getStatusCode().value());
        assertEquals("Invalid status. Must be ACTIVE or OUT_OF_SERVICE", ex.getReason());
    }

    @Test
    void createShouldPersistResourceAndBuildHallId() {
        ResourceRequest request = validRequest();
        when(resourceRepository.existsByHallId("MAIN-A-02-105")).thenReturn(false);
        when(resourceRepository.save(any(Resource.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Resource created = resourceService.create(request);

        assertNotNull(created.getCreatedAt());
        assertNotNull(created.getUpdatedAt());
        assertEquals("MAIN-A-02-105", created.getHallId());
        assertEquals("Main Hall 105", created.getName());
        assertTrue(created.getFacilities().contains("PROJECTOR"));
    }

    private ResourceRequest validRequest() {
        ResourceRequest request = new ResourceRequest();
        request.setName("Main Hall 105");
        request.setType(ResourceType.LECTURE_HALL);
        request.setCapacity(120);
        request.setLocation("MAIN-A-02-105");
        request.setDescription("Large hall");
        request.setAvailableFrom("08:00");
        request.setAvailableTo("18:00");
        request.setBuildingName("MAIN");
        request.setBlock("A");
        request.setFloor(2);
        request.setHallNumber(105);
        request.setFacilities(List.of("PROJECTOR", "WIFI"));
        request.setStatus(ResourceStatus.ACTIVE);
        return request;
    }
}
