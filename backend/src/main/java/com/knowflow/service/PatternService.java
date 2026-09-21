package com.knowflow.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.knowflow.domain.CommentCase;
import com.knowflow.domain.GapResult;
import com.knowflow.domain.OrganizationPattern;
import com.knowflow.domain.PatternSignature;

@Service
public class PatternService {
    private static final int MIN_PATTERN_SUPPORT = 2;
    private static final int MIN_STABLE_SUPPORT = 3;
    private static final double MIN_STABLE_RATIO = 0.67;

    private final DataStoreService dataStore;

    public PatternService(DataStoreService dataStore) {
        this.dataStore = dataStore;
    }

    public List<OrganizationPattern> patterns() {
        return mine(dataStore.cases());
    }

    public List<OrganizationPattern> mine(List<CommentCase> cases) {
        Map<PatternSignature, List<CommentCase>> grouped = cases.stream()
                .collect(Collectors.groupingBy(
                        PatternSignature::from,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<Map.Entry<PatternSignature, List<CommentCase>>> eligible = grouped.entrySet().stream()
                .filter(entry -> entry.getValue().size() >= MIN_PATTERN_SUPPORT)
                .sorted(Comparator.comparing(entry -> entry.getValue().stream()
                        .map(CommentCase::caseId)
                        .min(String::compareTo)
                        .orElse("")))
                .toList();

        List<OrganizationPattern> result = new ArrayList<>();
        for (int index = 0; index < eligible.size(); index++) {
            Map.Entry<PatternSignature, List<CommentCase>> entry = eligible.get(index);
            List<CommentCase> members = entry.getValue();
            Map<String, Long> actionDistribution = members.stream()
                    .map(CommentCase::action)
                    .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()));

            Map.Entry<String, Long> majority = actionDistribution.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed()
                            .thenComparing(Map.Entry.comparingByKey()))
                    .findFirst()
                    .orElseThrow();
            double ratio = (double) majority.getValue() / members.size();

            result.add(new OrganizationPattern(
                    "PATTERN-%03d".formatted(index + 1),
                    entry.getKey(),
                    members.size(),
                    actionDistribution,
                    majority.getKey(),
                    ratio,
                    members.stream().map(CommentCase::caseId).sorted().toList(),
                    members.stream().map(CommentCase::employeeId).distinct().sorted().toList(),
                    members.size() >= MIN_STABLE_SUPPORT && ratio >= MIN_STABLE_RATIO
            ));
        }
        return List.copyOf(result);
    }

    public Optional<OrganizationPattern> patternFor(CommentCase item) {
        PatternSignature signature = PatternSignature.from(item);
        return patterns().stream().filter(pattern -> pattern.signature().equals(signature)).findFirst();
    }

    public GapResult gapFor(CommentCase item) {
        Optional<OrganizationPattern> match = patternFor(item);
        if (match.isEmpty()) {
            return GapResult.noPattern(item);
        }
        OrganizationPattern pattern = match.get();
        if (pattern.stable() && !pattern.majorityAction().equals(item.action())) {
            return GapResult.actionVariant(item, pattern);
        }
        return GapResult.none(item, pattern);
    }
}

