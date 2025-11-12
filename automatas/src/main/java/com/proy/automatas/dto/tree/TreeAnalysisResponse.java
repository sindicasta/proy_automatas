package com.proy.automatas.dto.tree;

import lombok.Data;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
public class TreeAnalysisResponse {
    private TreeNodeDto syntaxTree;
    private List<FollowposRowDto> followposTable;
    private DfaDto dfa;
    private Map<Integer, String> leafPosToSymbol;
    private Set<Integer> rootFirstpos;
    private int hashLeafPos;
    private int totalPositions;
}