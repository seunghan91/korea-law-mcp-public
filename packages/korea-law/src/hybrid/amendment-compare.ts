/**
 * korea-law: 개정 대비 비교 요약 서비스
 *
 * 기능:
 * 1. 현행법과 시행 예정 개정안 비교
 * 2. 변경점 자동 요약 생성
 * 3. 선제적 경고 제공
 */

import { getDatabase, findLawByName, findArticle } from '../db/database';

// ============================================
// 타입 정의
// ============================================

export interface AmendmentComparison {
  lawName: string;
  currentVersion: LawVersionInfo;
  upcomingVersion: LawVersionInfo | null;
  changes: ArticleChange[];
  summary: ComparisonSummary;
  warnings: AmendmentWarning[];
}

export interface LawVersionInfo {
  enforcementDate: string;
  promulgationDate: string;
  status: 'CURRENT' | 'UPCOMING' | 'HISTORIC';
  articleCount: number;
}

export interface ArticleChange {
  articleNo: string;
  articleTitle: string | null;
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED' | 'UNCHANGED';
  currentContent: string | null;
  upcomingContent: string | null;
  diffSummary: string | null;
  isCritical: boolean;
  criticalReason: string | null;
}

export interface ComparisonSummary {
  totalArticles: number;
  addedCount: number;
  modifiedCount: number;
  deletedCount: number;
  unchangedCount: number;
  criticalChanges: number;
  effectiveDateDiff: number;  // 시행까지 남은 일수
  keyChanges: string[];       // 주요 변경 요약 (3-5개)
}

export interface AmendmentWarning {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'PENALTY_CHANGE' | 'DEADLINE_CHANGE' | 'DEFINITION_CHANGE' | 'PROCEDURE_CHANGE' | 'AMOUNT_CHANGE';
  articleNo: string;
  message: string;
  recommendation: string;
}

// ============================================
// 개정 비교 서비스
// ============================================

export class AmendmentCompareService {
  private db = getDatabase();

  // 중요 변경 감지 패턴
  private static readonly CRITICAL_PATTERNS = {
    PENALTY_CHANGE: {
      patterns: [/과태료|벌금|징역|금고|처벌|제재/],
      reason: '처벌 조항 변경',
    },
    DEADLINE_CHANGE: {
      patterns: [/\d+일\s*이내|\d+개월\s*이내|기한|기간|시효/],
      reason: '기한/기간 변경',
    },
    AMOUNT_CHANGE: {
      patterns: [/\d+만원|\d+억원|\d+원|금액|비용|수수료/],
      reason: '금액 관련 변경',
    },
    DEFINITION_CHANGE: {
      patterns: [/정의|의미|란\s+무엇|이라\s+함/],
      reason: '용어 정의 변경',
    },
    PROCEDURE_CHANGE: {
      patterns: [/절차|신청|신고|허가|승인|등록/],
      reason: '절차 관련 변경',
    },
  };

  /**
   * 법령의 현행-개정안 비교
   */
  async compare(lawName: string): Promise<AmendmentComparison | null> {
    // 현행 법령 조회
    const currentLaw = findLawByName(lawName);
    if (!currentLaw) {
      return null;
    }

    // 시행 예정 법령 조회
    const upcomingLaw = this.findUpcomingVersion(currentLaw.law_mst_id);

    // 현행 조문 목록
    const currentArticles = this.db.prepare(`
      SELECT * FROM Articles WHERE law_id = ?
      ORDER BY CAST(article_no_normalized AS INTEGER), article_no
    `).all(currentLaw.id!) as Array<{
      id: number;
      article_no: string;
      article_title: string | null;
      content: string;
    }>;

    // 변경 예정 사항 조회
    const upcomingChanges = this.getUpcomingChanges(currentLaw.id!);

    // 조문별 변경 분석
    const changes: ArticleChange[] = [];
    const warnings: AmendmentWarning[] = [];

    for (const article of currentArticles) {
      const change = upcomingChanges.find(
        (c) => c.article_no === article.article_no
      );

      if (change) {
        const isCritical = this.detectCriticalChange(
          article.content,
          change.current_content || ''
        );

        changes.push({
          articleNo: article.article_no,
          articleTitle: article.article_title,
          changeType: change.change_type as 'ADDED' | 'MODIFIED' | 'DELETED',
          currentContent: article.content,
          upcomingContent: change.current_content,
          diffSummary: change.diff_summary,
          isCritical: isCritical.isCritical,
          criticalReason: isCritical.reason,
        });

        // 경고 생성
        if (isCritical.isCritical) {
          warnings.push({
            severity: 'HIGH',
            type: isCritical.type as AmendmentWarning['type'],
            articleNo: article.article_no,
            message: change.warning_message || isCritical.reason || '중요 변경',
            recommendation: this.generateRecommendation(isCritical.type),
          });
        }
      } else {
        changes.push({
          articleNo: article.article_no,
          articleTitle: article.article_title,
          changeType: 'UNCHANGED',
          currentContent: article.content,
          upcomingContent: null,
          diffSummary: null,
          isCritical: false,
          criticalReason: null,
        });
      }
    }

    // 신설 조문 추가
    const addedArticles = upcomingChanges.filter(
      (c) => c.change_type === 'ADDED' &&
        !currentArticles.some((a) => a.article_no === c.article_no)
    );

    for (const added of addedArticles) {
      const isCritical = this.detectCriticalChange('', added.current_content || '');

      changes.push({
        articleNo: added.article_no || '신설',
        articleTitle: null,
        changeType: 'ADDED',
        currentContent: null,
        upcomingContent: added.current_content,
        diffSummary: added.diff_summary,
        isCritical: isCritical.isCritical,
        criticalReason: isCritical.reason,
      });
    }

    // 요약 생성
    const summary = this.generateSummary(changes, upcomingLaw);

    return {
      lawName,
      currentVersion: {
        enforcementDate: currentLaw.enforcement_date,
        promulgationDate: currentLaw.promulgation_date,
        status: 'CURRENT',
        articleCount: currentArticles.length,
      },
      upcomingVersion: upcomingLaw
        ? {
            enforcementDate: upcomingLaw.enforcement_date,
            promulgationDate: upcomingLaw.promulgation_date,
            status: 'UPCOMING',
            articleCount: currentArticles.length + addedArticles.length,
          }
        : null,
      changes,
      summary,
      warnings,
    };
  }

  /**
   * 시행 예정 버전 조회
   */
  private findUpcomingVersion(lawMstId: string): {
    enforcement_date: string;
    promulgation_date: string;
  } | null {
    // Diff_Logs에서 미래 시행 예정 찾기
    const upcoming = this.db.prepare(`
      SELECT DISTINCT d.effective_from as enforcement_date, l.promulgation_date
      FROM Diff_Logs d
      JOIN Laws l ON d.law_id = l.id
      WHERE l.law_mst_id = ?
      AND d.effective_from > DATE('now')
      ORDER BY d.effective_from ASC
      LIMIT 1
    `).get(lawMstId) as {
      enforcement_date: string;
      promulgation_date: string;
    } | undefined;

    return upcoming || null;
  }

  /**
   * 시행 예정 변경 사항 조회
   */
  private getUpcomingChanges(lawId: number): Array<{
    article_no: string;
    change_type: string;
    current_content: string | null;
    diff_summary: string | null;
    warning_message: string | null;
  }> {
    return this.db.prepare(`
      SELECT
        a.article_no,
        d.change_type,
        d.current_content,
        d.diff_summary,
        d.warning_message
      FROM Diff_Logs d
      LEFT JOIN Articles a ON d.article_id = a.id
      WHERE d.law_id = ?
      AND d.effective_from > DATE('now')
      ORDER BY d.effective_from ASC
    `).all(lawId) as Array<{
      article_no: string;
      change_type: string;
      current_content: string | null;
      diff_summary: string | null;
      warning_message: string | null;
    }>;
  }

  /**
   * 중요 변경 감지
   */
  private detectCriticalChange(
    oldContent: string,
    newContent: string
  ): {
    isCritical: boolean;
    type: string | null;
    reason: string | null;
  } {
    for (const [type, config] of Object.entries(AmendmentCompareService.CRITICAL_PATTERNS)) {
      for (const pattern of config.patterns) {
        // 새 내용에서 패턴이 발견되고 이전 내용과 다른 경우
        const newMatch = pattern.test(newContent);
        const oldMatch = pattern.test(oldContent);

        if (newMatch || oldMatch) {
          // 숫자 추출하여 비교
          const oldNumbers = this.extractNumbers(oldContent);
          const newNumbers = this.extractNumbers(newContent);

          if (this.hasSignificantNumberChange(oldNumbers, newNumbers)) {
            return {
              isCritical: true,
              type,
              reason: config.reason,
            };
          }
        }
      }
    }

    // 내용 길이가 크게 변한 경우
    if (oldContent && newContent) {
      const lengthChange = Math.abs(newContent.length - oldContent.length) / oldContent.length;
      if (lengthChange > 0.3) {  // 30% 이상 변경
        return {
          isCritical: true,
          type: 'MAJOR_REVISION',
          reason: '조문 내용 대폭 변경',
        };
      }
    }

    return { isCritical: false, type: null, reason: null };
  }

  /**
   * 텍스트에서 숫자 추출
   */
  private extractNumbers(text: string): number[] {
    const matches = text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [];
    return matches.map((m) => parseFloat(m.replace(/,/g, '')));
  }

  /**
   * 숫자 변화가 유의미한지 확인
   */
  private hasSignificantNumberChange(
    oldNumbers: number[],
    newNumbers: number[]
  ): boolean {
    // 숫자가 있는 경우에만 비교
    if (oldNumbers.length === 0 || newNumbers.length === 0) {
      return false;
    }

    // 같은 위치의 숫자 비교
    const minLen = Math.min(oldNumbers.length, newNumbers.length);
    for (let i = 0; i < minLen; i++) {
      const change = Math.abs(newNumbers[i] - oldNumbers[i]) / (oldNumbers[i] || 1);
      if (change > 0.1) {  // 10% 이상 변경
        return true;
      }
    }

    // 숫자 개수가 다른 경우
    if (oldNumbers.length !== newNumbers.length) {
      return true;
    }

    return false;
  }

  /**
   * 요약 생성
   */
  private generateSummary(
    changes: ArticleChange[],
    upcomingLaw: { enforcement_date: string } | null
  ): ComparisonSummary {
    const addedCount = changes.filter((c) => c.changeType === 'ADDED').length;
    const modifiedCount = changes.filter((c) => c.changeType === 'MODIFIED').length;
    const deletedCount = changes.filter((c) => c.changeType === 'DELETED').length;
    const unchangedCount = changes.filter((c) => c.changeType === 'UNCHANGED').length;
    const criticalChanges = changes.filter((c) => c.isCritical).length;

    // 시행일까지 남은 일수
    let effectiveDateDiff = 0;
    if (upcomingLaw) {
      const today = new Date();
      const effectiveDate = new Date(upcomingLaw.enforcement_date);
      effectiveDateDiff = Math.ceil(
        (effectiveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // 주요 변경 요약
    const keyChanges: string[] = [];
    const criticalItems = changes.filter((c) => c.isCritical).slice(0, 5);
    for (const item of criticalItems) {
      if (item.diffSummary) {
        keyChanges.push(`${item.articleNo}: ${item.diffSummary}`);
      } else if (item.criticalReason) {
        keyChanges.push(`${item.articleNo}: ${item.criticalReason}`);
      }
    }

    return {
      totalArticles: changes.length,
      addedCount,
      modifiedCount,
      deletedCount,
      unchangedCount,
      criticalChanges,
      effectiveDateDiff,
      keyChanges,
    };
  }

  /**
   * 권고사항 생성
   */
  private generateRecommendation(changeType: string | null): string {
    const recommendations: Record<string, string> = {
      PENALTY_CHANGE: '처벌 조항 변경에 따른 컴플라이언스 검토가 필요합니다.',
      DEADLINE_CHANGE: '변경된 기한/기간에 맞춰 업무 프로세스를 조정하세요.',
      AMOUNT_CHANGE: '변경된 금액 기준을 시스템 및 계약서에 반영하세요.',
      DEFINITION_CHANGE: '변경된 정의에 따른 적용 범위 재검토가 필요합니다.',
      PROCEDURE_CHANGE: '변경된 절차에 맞춰 내부 규정을 수정하세요.',
      MAJOR_REVISION: '조문 전체를 다시 검토하시기 바랍니다.',
    };

    return recommendations[changeType || ''] || '해당 조항을 면밀히 검토하세요.';
  }

  /**
   * 비교 결과를 사람이 읽기 쉬운 형식으로 포맷
   */
  formatComparison(comparison: AmendmentComparison): string {
    const lines: string[] = [];

    lines.push(`=== ${comparison.lawName} 개정 비교 ===\n`);

    // 버전 정보
    lines.push('📌 현행법');
    lines.push(`   시행일: ${comparison.currentVersion.enforcementDate}`);
    lines.push(`   조문 수: ${comparison.currentVersion.articleCount}개`);

    if (comparison.upcomingVersion) {
      lines.push('\n📌 개정 예정');
      lines.push(`   시행일: ${comparison.upcomingVersion.enforcementDate}`);
      lines.push(`   D-Day: ${comparison.summary.effectiveDateDiff}일 후`);
    }

    // 요약
    lines.push('\n📊 변경 요약');
    lines.push(`   신설: ${comparison.summary.addedCount}개`);
    lines.push(`   수정: ${comparison.summary.modifiedCount}개`);
    lines.push(`   삭제: ${comparison.summary.deletedCount}개`);
    lines.push(`   중요 변경: ${comparison.summary.criticalChanges}개`);

    // 주요 변경
    if (comparison.summary.keyChanges.length > 0) {
      lines.push('\n⚠️ 주요 변경 사항');
      for (const change of comparison.summary.keyChanges) {
        lines.push(`   • ${change}`);
      }
    }

    // 경고
    if (comparison.warnings.length > 0) {
      lines.push('\n🚨 주의 사항');
      for (const warning of comparison.warnings) {
        lines.push(`   [${warning.severity}] ${warning.articleNo}: ${warning.message}`);
        lines.push(`      → ${warning.recommendation}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 특정 조문의 상세 변경 비교
   */
  async compareArticle(
    lawName: string,
    articleNo: string
  ): Promise<{
    current: string | null;
    upcoming: string | null;
    diff: string | null;
    isCritical: boolean;
    warning: AmendmentWarning | null;
  } | null> {
    const law = findLawByName(lawName);
    if (!law) return null;

    const article = findArticle(law.id!, articleNo);
    if (!article) return null;

    // 변경 예정 조회
    const change = this.db.prepare(`
      SELECT d.current_content, d.diff_summary, d.warning_message
      FROM Diff_Logs d
      WHERE d.article_id = ?
      AND d.effective_from > DATE('now')
      ORDER BY d.effective_from ASC
      LIMIT 1
    `).get(article.id!) as {
      current_content: string | null;
      diff_summary: string | null;
      warning_message: string | null;
    } | undefined;

    if (!change) {
      return {
        current: article.content,
        upcoming: null,
        diff: null,
        isCritical: false,
        warning: null,
      };
    }

    const isCritical = this.detectCriticalChange(
      article.content,
      change.current_content || ''
    );

    return {
      current: article.content,
      upcoming: change.current_content,
      diff: change.diff_summary,
      isCritical: isCritical.isCritical,
      warning: isCritical.isCritical
        ? {
            severity: 'HIGH',
            type: isCritical.type as AmendmentWarning['type'],
            articleNo,
            message: change.warning_message || isCritical.reason || '중요 변경',
            recommendation: this.generateRecommendation(isCritical.type),
          }
        : null,
    };
  }
}

// 싱글톤 인스턴스
export const amendmentCompare = new AmendmentCompareService();
