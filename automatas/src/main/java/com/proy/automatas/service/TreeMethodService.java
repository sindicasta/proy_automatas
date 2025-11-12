package com.proy.automatas.service;

// --- ¡ESTE ES EL BLOQUE QUE FALTABA! ---
// Importar todas las clases DTO que creamos
import com.proy.automatas.dto.tree.*;
// Importar la anotación de Servicio de Spring
import org.springframework.stereotype.Service;

// Importar todas las colecciones de Java que usamos
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.Stack;
// --- FIN DEL BLOQUE DE IMPORTS ---

@Service
public class TreeMethodService {

    // Wrapper para el contador de posiciones (para pasarlo por referencia)
    static class PositionCounter {
        int count = 0;
    }

    // Mapa de precedencia de operadores
    private static final Map<Character, Integer> PREC = Map.of(
            '*', 3,
            '.', 2,
            '+', 1
    );

    /**
     * MÉTODO PRINCIPAL: Orquesta todo el análisis.
     */
    public TreeAnalysisResponse analyzeRegex(String regex) {
        // 1. Limpiar y añadir concatenación explícita
        String cleaned = regex.replaceAll("\\s+", "");
        String withConcat = addConcat(cleaned);
        
        // 2. Convertir a Postfijo
        String postfixExpr = toPostfix(withConcat);

        // 3. Construir árbol inicial
        TreeNodeDto exprTree = buildTreeFromPostfix(postfixExpr);

        // 4. Aumentar el árbol con el nodo '#'
        TreeNodeDto hashLeaf = new TreeNodeDto("leaf", "#", null);
        TreeNodeDto root = new TreeNodeDto("concat", exprTree, hashLeaf);

        // 5. Calcular nullable, firstpos, lastpos y asignar posiciones
        PositionCounter counter = new PositionCounter();
        assignPositionsAndCalc(root, counter);
        int totalPos = counter.count;

        // 6. Recolectar símbolos de las hojas
        Map<Integer, String> leafPosToSymbol = new HashMap<>();
        collectLeafPos(root, leafPosToSymbol);

        // 7. Encontrar la posición del '#'
        int hashLeafPos = -1;
        for (Map.Entry<Integer, String> entry : leafPosToSymbol.entrySet()) {
            if ("#".equals(entry.getValue())) {
                hashLeafPos = entry.getKey();
                break;
            }
        }
        if (hashLeafPos == -1) throw new RuntimeException("No se encontró el nodo #");

        // 8. Calcular Followpos
        Map<Integer, Set<Integer>> followpos = new HashMap<>();
        for (int i = 1; i <= totalPos; i++) followpos.put(i, new HashSet<>());
        computeFollowpos(root, followpos);

        // 9. Construir la tabla de Followpos (para el DTO)
        List<FollowposRowDto> followposTable = new ArrayList<>();
        for (int i = 1; i <= totalPos; i++) {
            List<Integer> sortedFollowpos = new ArrayList<>(followpos.get(i));
            Collections.sort(sortedFollowpos);
            followposTable.add(new FollowposRowDto(i, leafPosToSymbol.get(i), sortedFollowpos));
        }

        // 10. Construir el AFD
        DfaDto dfa = buildDFA(root, followpos, leafPosToSymbol, hashLeafPos);

        // 11. Empaquetar y devolver la respuesta completa
        TreeAnalysisResponse response = new TreeAnalysisResponse();
        response.setSyntaxTree(root);
        response.setFollowposTable(followposTable);
        response.setDfa(dfa);
        response.setLeafPosToSymbol(leafPosToSymbol);
        response.setRootFirstpos(root.getFirstpos());
        response.setHashLeafPos(hashLeafPos);
        response.setTotalPositions(totalPos);
        
        return response;
    }


    // --- TRADUCCIÓN DE TUS FUNCIONES JS ---

    private boolean isLetter(char ch) {
        return Character.isLetterOrDigit(ch);
    }

    private String addConcat(String exp) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < exp.length(); i++) {
            char c = exp.charAt(i);
            out.append(c);
            if (i + 1 < exp.length()) {
                char d = exp.charAt(i + 1);
                boolean cIs = isLetter(c) || c == ')' || c == '*' || c == '#';
                boolean dIs = isLetter(d) || d == '(' || d == '#';
                if (cIs && dIs) {
                    out.append('.');
                }
            }
        }
        return out.toString();
    }

    private String toPostfix(String exp) {
        StringBuilder out = new StringBuilder();
        Stack<Character> ops = new Stack<>();
        for (int i = 0; i < exp.length(); i++) {
            char c = exp.charAt(i);
            if (isLetter(c) || c == '#') {
                out.append(c);
            } else if (c == '(') {
                ops.push(c);
            } else if (c == ')') {
                while (!ops.isEmpty() && ops.peek() != '(') {
                    out.append(ops.pop());
                }
                ops.pop(); // Saca el '('
            } else {
                while (!ops.isEmpty()) {
                    char top = ops.peek();
                    if (top == '(') break;
                    if ((PREC.getOrDefault(top, 0) > PREC.getOrDefault(c, 0)) ||
                        (PREC.getOrDefault(top, 0) == PREC.getOrDefault(c, 0) && c != '*')) {
                        out.append(ops.pop());
                    } else {
                        break;
                    }
                }
                ops.push(c);
            }
        }
        while (!ops.isEmpty()) {
            out.append(ops.pop());
        }
        return out.toString();
    }

    private TreeNodeDto buildTreeFromPostfix(String pfix) {
        Stack<TreeNodeDto> stack = new Stack<>();
        for (char tok : pfix.toCharArray()) {
            if (isLetter(tok) || tok == '#') {
                stack.push(new TreeNodeDto("leaf", String.valueOf(tok), null));
            } else if (tok == '*') {
                TreeNodeDto c = stack.pop();
                stack.push(new TreeNodeDto("star", c, null));
            } else if (tok == '.' || tok == '+') {
                TreeNodeDto r = stack.pop();
                TreeNodeDto l = stack.pop();
                stack.push(new TreeNodeDto(tok == '.' ? "concat" : "or", l, r));
            } else {
                throw new RuntimeException("Token desconocido en postfijo: " + tok);
            }
        }
        if (stack.size() != 1) throw new RuntimeException("Expresión postfijo inválida.");
        return stack.pop();
    }

    private void assignPositionsAndCalc(TreeNodeDto node, PositionCounter posCounter) {
        if (node == null) return;
        
        if ("leaf".equals(node.getType())) {
            posCounter.count++;
            node.setPos(posCounter.count);
            node.setNullable(false);
            node.setFirstpos(new HashSet<>(Set.of(node.getPos())));
            node.setLastpos(new HashSet<>(Set.of(node.getPos())));
            return;
        }

        assignPositionsAndCalc(node.getLeft(), posCounter);
        assignPositionsAndCalc(node.getRight(), posCounter);

        switch (node.getType()) {
            case "star":
                node.setNullable(true);
                node.setFirstpos(new HashSet<>(node.getLeft().getFirstpos()));
                node.setLastpos(new HashSet<>(node.getLeft().getLastpos()));
                break;
            case "or":
                node.setNullable(node.getLeft().isNullable() || node.getRight().isNullable());
                Set<Integer> firstOr = new HashSet<>(node.getLeft().getFirstpos());
                firstOr.addAll(node.getRight().getFirstpos());
                node.setFirstpos(firstOr);
                Set<Integer> lastOr = new HashSet<>(node.getLeft().getLastpos());
                lastOr.addAll(node.getRight().getLastpos());
                node.setLastpos(lastOr);
                break;
            case "concat":
                node.setNullable(node.getLeft().isNullable() && node.getRight().isNullable());
                // Firstpos
                Set<Integer> firstConcat = new HashSet<>(node.getLeft().getFirstpos());
                if (node.getLeft().isNullable()) {
                    firstConcat.addAll(node.getRight().getFirstpos());
                }
                node.setFirstpos(firstConcat);
                // Lastpos
                Set<Integer> lastConcat = new HashSet<>(node.getRight().getLastpos());
                if (node.getRight().isNullable()) {
                    lastConcat.addAll(node.getLeft().getLastpos());
                }
                node.setLastpos(lastConcat);
                break;
        }
    }

    private void collectLeafPos(TreeNodeDto n, Map<Integer, String> map) {
        if (n == null) return;
        if ("leaf".equals(n.getType())) {
            map.put(n.getPos(), n.getSym());
        } else {
            collectLeafPos(n.getLeft(), map);
            collectLeafPos(n.getRight(), map);
        }
    }

    private void computeFollowpos(TreeNodeDto node, Map<Integer, Set<Integer>> followpos) {
        if (node == null) return;

        if ("concat".equals(node.getType())) {
            for (int i : node.getLeft().getLastpos()) {
                followpos.get(i).addAll(node.getRight().getFirstpos());
            }
        }

        if ("star".equals(node.getType())) {
            for (int i : node.getLeft().getLastpos()) {
                followpos.get(i).addAll(node.getLeft().getFirstpos());
            }
        }

        computeFollowpos(node.getLeft(), followpos);
        computeFollowpos(node.getRight(), followpos);
    }

    private DfaDto buildDFA(TreeNodeDto root, Map<Integer, Set<Integer>> followpos, Map<Integer, String> leafPosToSymbol, int hashLeafPos) {
        
        List<DfaStateDto> states = new ArrayList<>();
        Queue<Integer> unmarked = new LinkedList<>();
        List<DfaTransitionDto> transitions = new ArrayList<>();

        // Estado inicial
        List<Integer> startSet = new ArrayList<>(root.getFirstpos());
        Collections.sort(startSet);
        
        states.add(new DfaStateDto(startSet, startSet.contains(hashLeafPos)));
        unmarked.add(0); // Añade el índice 0

        while (!unmarked.isEmpty()) {
            int idx = unmarked.poll(); // Índice del estado a procesar
            DfaStateDto st = states.get(idx);

            // Helper: symbolsInState
            Map<String, Set<Integer>> symMap = new HashMap<>();
            for (int p : st.getPositions()) {
                String s = leafPosToSymbol.get(p);
                if (s.equals("#")) continue;
                
                symMap.putIfAbsent(s, new HashSet<>());
                Set<Integer> f = followpos.get(p);
                if (f != null) {
                    symMap.get(s).addAll(f);
                }
            }
            // Fin Helper

            for (Map.Entry<String, Set<Integer>> entry : symMap.entrySet()) {
                String sym = entry.getKey();
                List<Integer> arr = new ArrayList<>(entry.getValue());
                Collections.sort(arr); // ¡Crítico para la comparación!

                // Helper: findStateIndexBySet
                int tindex = -1;
                for (int i = 0; i < states.size(); i++) {
                    if (states.get(i).getPositions().equals(arr)) {
                        tindex = i;
                        break;
                    }
                }
                // Fin Helper

                if (tindex == -1) {
                    // Nuevo estado
                    states.add(new DfaStateDto(arr, arr.contains(hashLeafPos)));
                    tindex = states.size() - 1;
                    unmarked.add(tindex);
                }
                
                transitions.add(new DfaTransitionDto(idx, sym, tindex));
            }
        }

        DfaDto dfa = new DfaDto();
        dfa.setStates(states);
        dfa.setTransitions(transitions);
        dfa.setStartIndex(0);
        return dfa;
    }
}