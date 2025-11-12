package com.proy.automatas.dto.tree;

import lombok.Data;
import java.util.Set;

@Data 
public class TreeNodeDto {
    private String type;
    private String sym;
    private Integer pos;
    
    private boolean nullable;
    private Set<Integer> firstpos;
    private Set<Integer> lastpos;

    private TreeNodeDto left;
    private TreeNodeDto right;

    public TreeNodeDto(String type, String sym, Integer pos) {
        this.type = type;
        this.sym = sym;
        this.pos = pos;
    }
    
    public TreeNodeDto(String type, TreeNodeDto left, TreeNodeDto right) {
        this.type = type;
        this.left = left;
        this.right = right;
    }
}