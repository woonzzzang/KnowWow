package com.knowflow.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knowflow.domain.CommentCase;
import com.knowflow.domain.Employee;
import com.knowflow.domain.PersonalKnowledge;

import jakarta.annotation.PostConstruct;

@Service
public class DataStoreService {
    private final ObjectMapper objectMapper;
    private final Path dataPath;
    private final AtomicReference<List<Employee>> employees = new AtomicReference<>(List.of());
    private final AtomicReference<List<CommentCase>> cases = new AtomicReference<>(List.of());
    private final AtomicReference<List<PersonalKnowledge>> knowledge = new AtomicReference<>(List.of());

    public DataStoreService(ObjectMapper objectMapper, @Value("${knowflow.data-path}") String dataPath) {
        this.objectMapper = objectMapper;
        this.dataPath = Path.of(dataPath).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void load() throws IOException {
        employees.set(List.copyOf(read("employees.json", new TypeReference<List<Employee>>() {})));
        cases.set(List.copyOf(read("comment_cases.json", new TypeReference<List<CommentCase>>() {})));
        knowledge.set(List.copyOf(read("personal_knowledge.json", new TypeReference<List<PersonalKnowledge>>() {})));
    }

    private <T> T read(String filename, TypeReference<T> type) throws IOException {
        return objectMapper.readValue(dataPath.resolve(filename).toFile(), type);
    }

    public List<Employee> employees() {
        return employees.get();
    }

    public List<CommentCase> cases() {
        return cases.get();
    }

    public List<PersonalKnowledge> knowledge() {
        return knowledge.get();
    }

    public CommentCase requireCase(String caseId) {
        return cases.get().stream()
                .filter(item -> item.caseId().equals(caseId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
    }

    public synchronized PersonalKnowledge saveKnowledge(PersonalKnowledge item) throws IOException {
        List<PersonalKnowledge> updated = new ArrayList<>(knowledge.get());
        updated.removeIf(existing -> existing.knowledgeId().equals(item.knowledgeId()));
        updated.add(item);
        updated.sort((left, right) -> left.knowledgeId().compareTo(right.knowledgeId()));

        Path target = dataPath.resolve("personal_knowledge.json");
        Path temporary = dataPath.resolve("personal_knowledge.json.tmp");
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(temporary.toFile(), updated);
        Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        knowledge.set(Collections.unmodifiableList(updated));
        return item;
    }

    public String nextKnowledgeId() {
        int next = knowledge.get().stream()
                .map(PersonalKnowledge::knowledgeId)
                .filter(value -> value != null && value.matches("PK-\\d+"))
                .mapToInt(value -> Integer.parseInt(value.substring(3)))
                .max()
                .orElse(0) + 1;
        return "PK-%03d".formatted(next);
    }
}

