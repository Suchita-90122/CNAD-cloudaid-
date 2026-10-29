
package com.cloudaid.backend.emergency.repository;

import com.cloudaid.backend.emergency.model.Emergency;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmergencyRepository extends JpaRepository<Emergency, Long> {
}
