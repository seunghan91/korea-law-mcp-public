# Korea Law MCP Server: Architecture Evolution Proposal
## 1. Executive Summary
This document proposes an architectural evolution for the `korea-law` MCP server, inspired by the comprehensive structure of the [ChangooLee/mcp-kr-legislation](https://github.com/ChangooLee/mcp-kr-legislation) repository.

While `ChangooLee` focuses on **Comprehensive Information Retrieval** (130+ tools), `korea-law` focuses on **Legal Verification & Audit**. We aim to absorb the *breadth* of data access from the former to enhance the *depth* of verification in the latter.

## 2. Comparative Analysis

| Feature | ChangooLee/mcp-kr-legislation | Current korea-law | Gap / Opportunity |
| :--- | :--- | :--- | :--- |
| **Primary Goal** | Search & Retrieve (Library) | Verify & Audit (Auditor) | **Unified Intelligence** (Smart Auditor) |
| **Data Scope** | Acts, Admin Rules, Precedents, Committees, Interpretations, Treaties | Acts, Precedents (Limited), Local Ordinances | **Admin Rules & Interpretations** are critical for compliance checks. |
| **Search Logic** | Multi-stage, Keyword Normalization | Exact Match / Simple API | **Semantic Search & Routing** needed. |
| **Tool Granularity** | 130+ specialized tools (Atomic) | ~10 consolidated tools (Scenario-based) | Maintain scenario-based tools but backed by broader data. |
| **Updates** | Real-time API | Daily Sync + Real-time Fallback | Keep Hybrid approach (DB for speed/diff, API for fresh). |

## 3. Proposed Architecture: "The Legal Knowledge Graph"

Instead of just adding more tools, we will restructure the backend to support a **Knowledge Graph** approach, where Laws are linked to their relevant Admin Rules, Precedents, and Interpretations.

### 3.1. Expanded Data Layer (API Client Update)
We need to support the full spectrum of `law.go.kr` API targets:

*   **`law`**: Acts, Presidential Decrees, Ministry Rules (Already supported)
*   **`ordin`**: Local Ordinances (Already supported)
*   **`prec`**: Precedents (Already supported)
*   **`admrul`**: Administrative Rules (훈령, 예규, 고시) **[NEW]**
    *   *Why needed:* Practical compliance often depends on Ministry guidelines (e.g., Labor Ministry Guidelines).
*   **`detc`**: Committee Decisions (위원회 결정문) **[NEW]**
    *   *Why needed:* Personal Information Protection Commission (PIPC) decisions are crucial for IT/Data compliance.
*   **`exp`**: Legal Interpretations (법령해석례) **[NEW]**
    *   *Why needed:* Ministry of Government Legislation interpretations resolve ambiguities.

### 3.2. New Intelligent Tools

#### A. `search_legal_landscape` (The "Omni-Search")
Instead of forcing the user to know *where* to look (Law vs Precedent vs Rule), this tool searches across all sources and presents a structured view.

*   **Input:** "개인정보보호법상 CCTV 설치 기준"
*   **Process:** 
    1.  Search `law` (Personal Information Protection Act)
    2.  Search `admrul` (CCTV Guidelines by PIPC)
    3.  Search `exp` (Interpretations on CCTV)
*   **Output:** Structured response linking the Act to specific Guidelines and Interpretations.

#### B. `verify_compliance_depth` (Deep Audit)
Enhanced version of `audit_statute`.
*   **Logic:** verifies against the Act -> Checks if any *Administrative Rule* modifies the practical application -> Checks if any *Precedent* overturns the administrative interpretation.

#### C. `get_changed_guidelines`
*   Focuses specifically on administrative rules which change more frequently than laws.

## 4. Implementation Roadmap

### Phase 1: API Expansion (Immediate)
- Update `src/api/law-api.ts` to support `admrul`, `detc`, `exp` targets.
- Create Typescript interfaces for these new data types.

### Phase 2: Tool Enhancement
- Create `search_all_sources` tool.
- Integrate "Administrative Rules" into the `audit_statute` logic (e.g., "The Act says X, but Guideline Y details Z").

### Phase 3: Knowledge Linking
- Build logic to auto-discover links (e.g., matching "Referenced Law" fields in Admin Rules to Law IDs).

## 5. User Experience Goal
The user should feel like they are consulting a **Senior Legal Researcher** who doesn't just read the code (Law), but also checks the manual (Admin Rules) and the history (Precedents).
