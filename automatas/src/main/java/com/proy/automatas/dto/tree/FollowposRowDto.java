package com.proy.automatas.dto.tree;

import lombok.Data;
import java.util.List;

@Data
public class FollowposRowDto {
    private int nodePosition;
    private String symbol;
    private List<Integer> followpos;

    public FollowposRowDto(int nodePosition, String symbol, List<Integer> followpos) {
        this.nodePosition = nodePosition;
        this.symbol = symbol;
        this.followpos = followpos;
    }
}