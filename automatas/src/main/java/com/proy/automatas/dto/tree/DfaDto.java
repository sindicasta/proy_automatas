package com.proy.automatas.dto.tree;

import lombok.Data;
import java.util.List;

@Data
public class DfaDto {
    private List<DfaStateDto> states;
    private List<DfaTransitionDto> transitions;
    private int startIndex;
}