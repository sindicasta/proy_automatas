package com.proy.automatas.dto.tree;

import lombok.Data;
import java.util.List;

@Data
public class DfaStateDto { // <-- Ahora es 'public' en su propio archivo
    private List<Integer> positions;
    private boolean isAccept;

    public DfaStateDto(List<Integer> positions, boolean isAccept) {
        this.positions = positions;
        this.isAccept = isAccept;
    }
}