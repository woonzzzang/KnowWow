package com.knowflow.api;

import java.io.IOException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.knowflow.domain.CommentCase;
import com.knowflow.domain.GapResult;
import com.knowflow.domain.OrganizationPattern;
import com.knowflow.domain.PersonalKnowledge;
import com.knowflow.service.AiServiceClient;
import com.knowflow.service.DataStoreService;
import com.knowflow.service.PatternService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api")
public class KnowFlowController {
    private final DataStoreService dataStore;
    private final PatternService patternService;
    private final AiServiceClient aiService;

    public KnowFlowController(DataStoreService dataStore, PatternService patternService, AiServiceClient aiService) {
        this.dataStore = dataStore;
        this.patternService = patternService;
        this.aiService = aiService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@RequestParam(defaultValue = "EMP-001") String employeeId) {
        List<CommentCase> employeeCases = dataStore.cases().stream()
                .filter(item -> item.employeeId().equals(employeeId))
                .toList();
        long gaps = employeeCases.stream().map(patternService::gapFor).filter(GapResult::requiresInterview).count();
        long employeeKnowledge = dataStore.knowledge().stream()
                .filter(item -> item.employeeId().equals(employeeId))
                .count();
        long stablePatterns = patternService.patterns().stream().filter(OrganizationPattern::stable).count();
        return Map.of(
                "employee_id", employeeId,
                "my_case_count", employeeCases.size(),
                "my_knowledge_count", employeeKnowledge,
                "stable_pattern_count", stablePatterns,
                "pending_interview_count", gaps,
                "total_case_count", dataStore.cases().size()
        );
    }

    @GetMapping("/employees")
    public Object employees() {
        return dataStore.employees();
    }

    @GetMapping("/cases")
    public List<CommentCase> cases(@RequestParam(required = false) String employeeId) {
        if (employeeId == null || employeeId.isBlank()) {
            return dataStore.cases();
        }
        return dataStore.cases().stream().filter(item -> item.employeeId().equals(employeeId)).toList();
    }

    @GetMapping("/cases/{caseId}")
    public CommentCase caseDetail(@PathVariable String caseId) {
        return dataStore.requireCase(caseId);
    }

    @GetMapping("/cases/{caseId}/pattern")
    public OrganizationPattern pattern(@PathVariable String caseId) {
        CommentCase item = dataStore.requireCase(caseId);
        return patternService.patternFor(item)
                .orElseThrow(() -> new IllegalArgumentException("Pattern not found for: " + caseId));
    }

    @GetMapping("/cases/{caseId}/gap")
    public GapResult gap(@PathVariable String caseId) {
        return patternService.gapFor(dataStore.requireCase(caseId));
    }

    @PostMapping("/cases/{caseId}/micro-question")
    public Map<String, Object> microQuestion(@PathVariable String caseId) {
        CommentCase item = dataStore.requireCase(caseId);
        OrganizationPattern pattern = requireInterviewable(item);
        return aiService.post("/ai/micro-question", Map.of(
                "current_case", item,
                "matched_pattern", pattern
        ));
    }

    @PostMapping("/cases/{caseId}/knowledge/extract")
    public Map<String, Object> extractKnowledge(
            @PathVariable String caseId,
            @Valid @RequestBody ExtractRequest request
    ) {
        CommentCase item = dataStore.requireCase(caseId);
        OrganizationPattern pattern = requireInterviewable(item);
        return aiService.post("/ai/extract-knowledge", Map.of(
                "current_case", item,
                "matched_pattern", pattern,
                "question", request.question(),
                "answer", request.answer()
        ));
    }

    @PostMapping("/cases/{caseId}/knowledge/confirm")
    public PersonalKnowledge confirmKnowledge(
            @PathVariable String caseId,
            @Valid @RequestBody ConfirmRequest request
    ) throws IOException {
        CommentCase item = dataStore.requireCase(caseId);
        OrganizationPattern pattern = requireInterviewable(item);
        PersonalKnowledge saved = dataStore.saveKnowledge(new PersonalKnowledge(
                dataStore.nextKnowledgeId(),
                item.employeeId(),
                List.of(item.caseId()),
                new PersonalKnowledge.Trigger("ACTION_VARIANT", pattern.patternId()),
                request.question(),
                request.rawAnswerText(),
                new PersonalKnowledge.StructuredKnowledge(
                        request.structuredKnowledge().newContext(),
                        item.action(),
                        request.structuredKnowledge().rationale(),
                        request.structuredKnowledge().exception()
                ),
                true,
                LocalDate.now()
        ));
        try {
            aiService.post("/ai/index/refresh", indexPayload());
        } catch (Exception ignored) {
            // Knowledge is safely persisted even when the optional index refresh fails.
        }
        return saved;
    }

    @GetMapping("/employees/{employeeId}/knowledge")
    public List<PersonalKnowledge> personalKnowledge(@PathVariable String employeeId) {
        return dataStore.knowledge().stream()
                .filter(item -> item.employeeId().equals(employeeId))
                .toList();
    }

    @GetMapping("/organization/patterns")
    public List<OrganizationPattern> organizationPatterns() {
        return patternService.patterns();
    }

    @GetMapping("/context-candidates")
    public List<Map<String, Object>> contextCandidates() {
        Map<String, List<PersonalKnowledge>> grouped = dataStore.knowledge().stream()
                .filter(PersonalKnowledge::verifiedByUser)
                .filter(item -> item.structuredKnowledge() != null)
                .filter(item -> item.structuredKnowledge().newContext() != null)
                .filter(item -> item.structuredKnowledge().newContext().name() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        item -> item.structuredKnowledge().newContext().name(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()
                ));
        return grouped.entrySet().stream().map(entry -> {
            Map<String, Object> candidate = new LinkedHashMap<>();
            candidate.put("context_key", entry.getKey());
            candidate.put("display_name", entry.getKey().replace('_', ' '));
            candidate.put("mention_count", entry.getValue().size());
            candidate.put("employee_ids", entry.getValue().stream().map(PersonalKnowledge::employeeId).distinct().toList());
            candidate.put("source_knowledge_ids", entry.getValue().stream().map(PersonalKnowledge::knowledgeId).toList());
            candidate.put("status", "CANDIDATE");
            return candidate;
        }).toList();
    }

    @PostMapping("/agent/chat")
    public Map<String, Object> agentChat(@Valid @RequestBody AgentRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>(indexPayload());
        payload.put("query", request.query());
        payload.put("employee_id", request.employeeId());
        return aiService.post("/ai/agent/chat", payload);
    }

    private OrganizationPattern requireInterviewable(CommentCase item) {
        GapResult gap = patternService.gapFor(item);
        if (!gap.requiresInterview()) {
            throw new IllegalArgumentException("Micro-interview is not required for: " + item.caseId());
        }
        return patternService.patternFor(item).orElseThrow();
    }

    private Map<String, Object> indexPayload() {
        return Map.of(
                "cases", dataStore.cases(),
                "patterns", patternService.patterns(),
                "knowledge", dataStore.knowledge()
        );
    }

    public record ExtractRequest(@NotBlank String question, @NotBlank String answer) {
    }

    public record ConfirmRequest(
            @NotBlank String question,
            @JsonAlias("raw_answer_text") @NotBlank String rawAnswerText,
            @JsonAlias("structured_knowledge") @Valid StructuredKnowledgeRequest structuredKnowledge
    ) {
    }

    public record StructuredKnowledgeRequest(
            @JsonAlias("new_context") PersonalKnowledge.NewContext newContext,
            String rationale,
            String exception
    ) {
    }

    public record AgentRequest(@NotBlank String query, @JsonAlias("employee_id") String employeeId) {
    }
}
