// backend/src/main/java/com/smartcampus/backend/repository/ResourceRepository.java
package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
	boolean existsByHallId(String hallId);

	boolean existsByHallIdAndIdNot(String hallId, String id);
}