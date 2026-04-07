/**
 * korea-law: 체인 실행 엔진
 *
 * 다단계 법률 리서치 워크플로우를 자동 실행합니다.
 * 병렬 그룹 내 스텝은 Promise.allSettled로 동시 실행,
 * 그룹 간에는 순차 실행, 실패 시 부분 결과 반환.
 */

import { NapiChainPlan, NapiChainStep } from '@markdown-media/core';

// Tool dispatch function type
export type ToolDispatchFn = (toolName: string, args: Record<string, any>) => Promise<string>;

// Result of a single step execution
export interface ChainStepResult {
  stepIndex: number;
  toolName: string;
  success: boolean;
  result: string;
  error?: string;
  durationMs: number;
}

// Full chain execution result
export interface ChainExecutionResult {
  chainType: string;
  totalSteps: number;
  successCount: number;
  failureCount: number;
  steps: ChainStepResult[];
  results: string[]; // Ordered results for aggregateChainResults
}

/**
 * Replace {{step_N_result}} placeholders in param values with actual results.
 */
function replacePlaceholders(
  params: Record<string, any>,
  stepResults: (string | null)[],
  stepSuccesses: (boolean | null)[],
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      result[key] = value.replace(/\{\{step_(\d+)_result\}\}/g, (_match, indexStr) => {
        const idx = parseInt(indexStr, 10);
        if (idx < stepResults.length && stepSuccesses[idx] === true && stepResults[idx] !== null) {
          return stepResults[idx]!;
        }
        return `[Step ${idx} failed]`;
      });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = replacePlaceholders(value, stepResults, stepSuccesses);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Execute a chain plan by running steps in executableGroups order.
 * Steps within the same group run in parallel via Promise.allSettled.
 * Individual step failures do NOT stop execution.
 */
export async function executeChainPlan(
  plan: NapiChainPlan,
  dispatch: ToolDispatchFn,
): Promise<ChainExecutionResult> {
  const totalSteps = plan.steps.length;

  if (totalSteps === 0) {
    return {
      chainType: plan.chainType,
      totalSteps: 0,
      successCount: 0,
      failureCount: 0,
      steps: [],
      results: [],
    };
  }

  // Initialize result tracking arrays
  const stepResults: (string | null)[] = new Array(totalSteps).fill(null);
  const stepSuccesses: (boolean | null)[] = new Array(totalSteps).fill(null);
  const stepDetails: ChainStepResult[] = new Array(totalSteps);

  // Execute groups sequentially
  for (const group of plan.executableGroups) {
    // Execute all steps in this group in parallel
    const promises = group.map(async (stepIndex) => {
      const step = plan.steps[stepIndex];
      const startTime = Date.now();

      try {
        // Parse JSON params
        let parsedParams: Record<string, any>;
        try {
          parsedParams = JSON.parse(step.params);
        } catch {
          parsedParams = {};
        }

        // Replace placeholders from prior steps
        const resolvedParams = replacePlaceholders(parsedParams, stepResults, stepSuccesses);

        // Dispatch tool call
        const result = await dispatch(step.toolName, resolvedParams);
        const duration = Date.now() - startTime;

        stepResults[stepIndex] = result;
        stepSuccesses[stepIndex] = true;
        stepDetails[stepIndex] = {
          stepIndex,
          toolName: step.toolName,
          success: true,
          result,
          durationMs: duration,
        };
      } catch (e) {
        const duration = Date.now() - startTime;
        const errorMsg = (e as Error).message || String(e);

        console.error(`[chain-executor] Step ${stepIndex} (${step.toolName}) failed: ${errorMsg}`);

        stepResults[stepIndex] = `[Error: ${errorMsg}]`;
        stepSuccesses[stepIndex] = false;
        stepDetails[stepIndex] = {
          stepIndex,
          toolName: step.toolName,
          success: false,
          result: `[Error: ${errorMsg}]`,
          error: errorMsg,
          durationMs: duration,
        };
      }
    });

    await Promise.allSettled(promises);
  }

  // Build final result
  const successCount = stepSuccesses.filter((s) => s === true).length;
  const failureCount = stepSuccesses.filter((s) => s === false).length;

  return {
    chainType: plan.chainType,
    totalSteps,
    successCount,
    failureCount,
    steps: stepDetails,
    results: stepResults as string[],
  };
}
