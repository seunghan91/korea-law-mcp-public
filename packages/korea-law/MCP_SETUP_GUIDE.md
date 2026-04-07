# 🔧 korea-law MCP 설정 가이드

> **Claude Desktop, Cursor, Windsurf, Claude Code** 등 다양한 AI 개발 도구에서 korea-law MCP 서버를 설정하는 방법

---

## 📋 목차

- [개요](#-개요)
- [사전 요구사항](#-사전-요구사항)
- [Claude Desktop](#-claude-desktop)
- [Cursor IDE](#-cursor-ide)
- [Windsurf (Codeium)](#-windsurf-codeium)
- [Claude Code (CLI)](#-claude-code-cli)
- [원격 MCP 서버 사용](#-원격-mcp-서버-사용)
- [문제 해결](#-문제-해결)

---

## 🎯 개요

**MCP (Model Context Protocol)**은 AI 모델이 외부 도구와 데이터 소스에 접근할 수 있게 해주는 표준 프로토콜입니다.

korea-law MCP 서버를 설정하면 AI가:
- 법령 조항의 현행 유효성을 검증
- 판례 존재 여부 확인
- 법령 개정 이력 추적
- 계약 기간 중 법령 변경 예측

등의 기능을 사용할 수 있습니다.

---

## ✅ 사전 요구사항

### 1. Node.js 설치 (필수)
```bash
# Node.js 18+ 권장
node --version  # v18.0.0 이상
```

### 2. API 키 발급 (선택)
로컬 DB 없이 실시간 API를 사용하려면 국가법령정보센터 API 키가 필요합니다.

1. https://open.law.go.kr 접속
2. 회원가입 후 **OPEN API 신청**
3. **법령종류 선택** (법률, 대통령령, 판례 등)
4. 승인 대기 (1-2일)

---

## 🖥️ Claude Desktop

Claude Desktop 앱에서 korea-law MCP 서버를 사용하는 방법입니다.

### Step 1: 설정 파일 열기

**macOS:**
```bash
# 메뉴: Claude → Settings → Developer → Edit Config
# 또는 직접 파일 편집:
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```powershell
# 파일 위치:
%APPDATA%\Claude\claude_desktop_config.json
```

### Step 2: MCP 서버 추가

```json
{
  "mcpServers": {
    "korea-law": {
      "command": "npx",
      "args": ["korea-law"],
      "env": {
        "KOREA_LAW_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Step 3: Claude Desktop 재시작

설정 저장 후 Claude Desktop을 **완전히 종료**한 뒤 다시 시작합니다.

### Step 4: 확인

채팅 창 하단에 🔨 (망치) 아이콘이 나타나면 MCP 서버가 연결된 것입니다.
아이콘을 클릭하면 사용 가능한 도구 목록을 확인할 수 있습니다.

---

## 🖱️ Cursor IDE

Cursor에서 korea-law MCP 서버를 사용하는 방법입니다.

### Step 1: MCP 설정 열기

1. **Cursor Settings** (⌘ + , 또는 Ctrl + ,)
2. 왼쪽 사이드바에서 **MCP** 탭 클릭
3. **Add new global MCP server** 클릭

### Step 2: 설정 파일 편집

설정 파일 위치: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "korea-law": {
      "command": "npx",
      "args": ["korea-law"],
      "env": {
        "KOREA_LAW_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Step 3: 새로고침 및 확인

MCP 탭에서 **Refresh** 버튼을 클릭합니다.
서버 상태가 🟢 (녹색)으로 표시되면 연결 성공입니다.

### Step 4: Agent Mode에서 사용

Cursor의 **Composer** (⌘ + I) 또는 **Chat** 에서 법률 검증 질문을 하면 MCP 도구가 자동으로 활성화됩니다.

```
예시: "근로기준법 제23조가 현행법에서 유효한지 확인해줘"
```

---

## 🌊 Windsurf (Codeium)

Windsurf에서 korea-law MCP 서버를 사용하는 방법입니다.

### Step 1: MCP 설정 열기

1. **Windsurf Settings** 또는 **Command Palette** (⌘ + Shift + P)
2. "Open Windsurf Settings Page" 검색
3. **Cascade** 섹션으로 스크롤
4. **Add Server** 또는 **View raw config** 클릭

### Step 2: 설정 파일 편집

설정 파일 위치: `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "korea-law": {
      "command": "npx",
      "args": ["korea-law"],
      "env": {
        "KOREA_LAW_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Step 3: Refresh

설정 저장 후 Windsurf의 MCP 패널에서 **Refresh** 버튼을 클릭합니다.

### Step 4: Cascade에서 사용

Windsurf의 **Cascade** 패널에서 법률 검증 요청을 하면 MCP 도구가 활성화됩니다.

---

## 💻 Claude Code (CLI)

터미널에서 Claude Code CLI를 사용하는 경우입니다.

### Step 1: MCP 서버 추가

```bash
# claude mcp add 명령어 사용
claude mcp add korea-law --command "npx korea-law" --env KOREA_LAW_API_KEY=your-api-key
```

### Step 2: 설정 확인

```bash
# 등록된 MCP 서버 목록 확인
claude mcp list
```

### Step 3: 직접 설정 파일 편집 (대안)

설정 파일 위치: `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "korea-law": {
      "command": "npx",
      "args": ["korea-law"],
      "env": {
        "KOREA_LAW_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

---

## 🌐 원격 MCP 서버 사용

로컬에 Node.js를 설치하지 않고 **원격 MCP 서버**를 사용할 수도 있습니다.

### Hosted 서버 URL

```
https://korea-law-mcp.onrender.com
```

### Claude Desktop에서 원격 서버 사용

```json
{
  "mcpServers": {
    "korea-law-remote": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://korea-law-mcp.onrender.com/sse"
      ]
    }
  }
}
```

### Claude Web (claude.ai)에서 사용

1. **Settings → Integrations** 이동
2. **Add custom integration** 클릭
3. URL: `https://korea-law-mcp.onrender.com/sse`
4. Name: `korea-law`

---

## 🔍 문제 해결

### 서버가 연결되지 않음

1. **Node.js 버전 확인**
   ```bash
   node --version  # v18+ 필요
   ```

2. **npx 캐시 정리**
   ```bash
   npx clear-npx-cache
   ```

3. **패키지 직접 설치**
   ```bash
   npm install -g korea-law
   ```
   그 후 설정에서 `"command": "korea-law"` 사용

### 도구가 표시되지 않음

- Claude Desktop: 완전히 종료 후 재시작 (메뉴바 → Quit)
- Cursor/Windsurf: MCP 패널에서 Refresh 클릭
- 설정 파일 JSON 문법 오류 확인 (쉼표, 따옴표 등)

### API 키 오류

```
Error: API key not authorized for law search
```

→ https://open.law.go.kr 에서 **법령종류**가 체크되어 있는지 확인

### 로그 확인 (Claude Desktop)

**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Windows:**
```powershell
Get-Content $env:APPDATA\Claude\logs\mcp*.log -Wait
```

---

## 📊 지원 도구 목록

korea-law MCP 서버가 제공하는 도구들:

| 도구 | 설명 |
|------|------|
| `audit_statute` | 법령 조항 유효성 검증 |
| `check_enforcement_date` | 법령 시행일/개정일 확인 |
| `verify_case_exists` | 판례 번호 존재 확인 |
| `get_daily_diff` | 오늘 변경된 법령 목록 |
| `audit_contract_timeline` | 계약 기간 중 법령 변경 예측 |
| `search_legal_landscape` | 법령/행정규칙/판례 종합 검색 |
| `search_committee_decisions` | 위원회 결정문 검색 |
| `search_ministry_interpretations` | 부처 유권해석 검색 |

---

## 🔗 관련 링크

- **GitHub**: https://github.com/seunghan91/law
- **npm**: https://www.npmjs.com/package/korea-law
- **국가법령정보센터**: https://www.law.go.kr
- **MCP 프로토콜 문서**: https://modelcontextprotocol.io

---

## 💡 Best Practices

1. **로컬 설치 권장**: 원격 서버보다 로컬 설치가 응답 속도가 빠릅니다.
2. **API 키 보안**: API 키를 Git에 커밋하지 마세요. 환경 변수로 관리하세요.
3. **정기 업데이트**: `npm update korea-law`로 최신 법령 데이터를 유지하세요.
4. **도구 제한**: MCP 호출은 토큰을 소비합니다. 필요한 도구만 활성화하세요.

---

**문의**: iyu974895@gmail.com
