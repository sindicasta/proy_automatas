package com.proy.automatas.dto.tree;

import lombok.Data;

@Data
public class DfaTransitionDto { // <-- Ahora es 'public' en su propio archivo
    private int from;
    private String symbol;
    private int to;

    public DfaTransitionDto(int from, String symbol, int to) {
        this.from = from;
        this.symbol = symbol;
        this.to = to;
    }
}