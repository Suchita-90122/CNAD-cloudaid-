
package com.cloudaid.backend.emergency.controller;

import com.cloudaid.backend.emergency.model.Emergency;
import com.cloudaid.backend.emergency.repository.EmergencyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergencies")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174"
})
public class EmergencyController {

    private final EmergencyRepository repository;

    public EmergencyController(EmergencyRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Emergency> getAllEmergencies() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Emergency createEmergency(@RequestBody Emergency emergency) {
        emergency.setStatus("Reported");
        return repository.save(emergency);
    }
}
