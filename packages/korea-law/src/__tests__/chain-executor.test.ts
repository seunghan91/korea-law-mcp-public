import { executeChainPlan, ToolDispatchFn, ChainExecutionResult } from '../mcp/chain-executor';
import { NapiChainPlan, NapiChainStep } from '@markdown-media/core';

describe('chain-executor', () => {
  let mockDispatch: jest.MockedFunction<ToolDispatchFn>;

  beforeEach(() => {
    mockDispatch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function makePlan(
    steps: NapiChainStep[],
    groups: number[][],
    chainType = 'FullResearch',
  ): NapiChainPlan {
    return {
      chainType,
      description: 'Test plan',
      steps,
      executableGroups: groups,
    };
  }

  function makeStep(
    toolName: string,
    params: Record<string, any>,
    dependsOn: number[] = [],
    parallelGroup?: number,
  ): NapiChainStep {
    return {
      toolName,
      params: JSON.stringify(params),
      dependsOn,
      parallelGroup,
    };
  }

  it('Test 1: runs steps in executableGroups order (group 0 first, then group 1)', async () => {
    const callOrder: string[] = [];
    mockDispatch.mockImplementation(async (name) => {
      callOrder.push(name);
      return `result_${name}`;
    });

    const steps = [
      makeStep('search_law', { query: 'test' }, [], 0),
      makeStep('search_precedents', { query: 'test' }, [], 0),
      makeStep('aggregate', { query: 'test' }, [0, 1], 1),
    ];
    const plan = makePlan(steps, [[0, 1], [2]]);

    const result = await executeChainPlan(plan, mockDispatch);

    // Group 0 steps should be called before group 1 steps
    const aggIndex = callOrder.indexOf('aggregate');
    const lawIndex = callOrder.indexOf('search_law');
    const precIndex = callOrder.indexOf('search_precedents');
    expect(lawIndex).toBeLessThan(aggIndex);
    expect(precIndex).toBeLessThan(aggIndex);
    expect(result.totalSteps).toBe(3);
  });

  it('Test 2: steps within the same parallel group run concurrently (Promise.allSettled)', async () => {
    const startTimes: number[] = [];
    mockDispatch.mockImplementation(async (name) => {
      startTimes.push(Date.now());
      await new Promise((r) => setTimeout(r, 10));
      return `result_${name}`;
    });

    const steps = [
      makeStep('tool_a', { q: '1' }, [], 0),
      makeStep('tool_b', { q: '2' }, [], 0),
      makeStep('tool_c', { q: '3' }, [], 0),
    ];
    const plan = makePlan(steps, [[0, 1, 2]]);

    await executeChainPlan(plan, mockDispatch);

    // All 3 should start nearly simultaneously (within 5ms of each other)
    expect(mockDispatch).toHaveBeenCalledTimes(3);
    // The difference between first and last start should be small (concurrent)
    const spread = Math.max(...startTimes) - Math.min(...startTimes);
    expect(spread).toBeLessThan(50); // generous allowance for CI
  });

  it('Test 3: step params (JSON string) are parsed and passed to dispatch', async () => {
    mockDispatch.mockResolvedValue('ok');

    const steps = [makeStep('search_law', { query: 'personal data', limit: 10 })];
    const plan = makePlan(steps, [[0]]);

    await executeChainPlan(plan, mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith('search_law', { query: 'personal data', limit: 10 });
  });

  it('Test 4: when a step fails, execution continues and partial results are collected', async () => {
    mockDispatch.mockImplementation(async (name) => {
      if (name === 'tool_fail') throw new Error('API timeout');
      return `result_${name}`;
    });

    const steps = [
      makeStep('tool_ok', { q: '1' }, [], 0),
      makeStep('tool_fail', { q: '2' }, [], 0),
      makeStep('tool_ok2', { q: '3' }, [0], 1),
    ];
    const plan = makePlan(steps, [[0, 1], [2]]);

    const result = await executeChainPlan(plan, mockDispatch);

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(1);
    expect(result.totalSteps).toBe(3);
    // tool_ok2 should still have run
    expect(result.steps[2].success).toBe(true);
  });

  it('Test 5: failed step result contains error, successful step result contains output', async () => {
    mockDispatch.mockImplementation(async (name) => {
      if (name === 'bad_tool') throw new Error('Connection refused');
      return 'good result';
    });

    const steps = [
      makeStep('good_tool', { q: '1' }),
      makeStep('bad_tool', { q: '2' }),
    ];
    const plan = makePlan(steps, [[0, 1]]);

    const result = await executeChainPlan(plan, mockDispatch);

    expect(result.steps[0].success).toBe(true);
    expect(result.steps[0].result).toBe('good result');
    expect(result.steps[0].error).toBeUndefined();

    expect(result.steps[1].success).toBe(false);
    expect(result.steps[1].error).toBe('Connection refused');
  });

  it('Test 6: dependsOn steps receive prior results via {{step_N_result}} placeholder', async () => {
    mockDispatch.mockImplementation(async (_name, args) => {
      return `processed: ${JSON.stringify(args)}`;
    });

    const steps = [
      makeStep('step_a', { query: 'initial' }, [], 0),
      makeStep('step_b', { context: '{{step_0_result}}', query: 'follow' }, [0], 1),
    ];
    const plan = makePlan(steps, [[0], [1]]);

    // step_a returns its result, step_b should have it injected
    mockDispatch
      .mockResolvedValueOnce('law article text')
      .mockResolvedValueOnce('final result');

    const result = await executeChainPlan(plan, mockDispatch);

    // Second call should have the placeholder replaced with step 0's result
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    const secondCallArgs = mockDispatch.mock.calls[1][1];
    expect(secondCallArgs.context).toBe('law article text');
    expect(secondCallArgs.query).toBe('follow');
  });

  it('Test 7: empty plan (0 steps) returns empty results array', async () => {
    const plan = makePlan([], []);

    const result = await executeChainPlan(plan, mockDispatch);

    expect(result.totalSteps).toBe(0);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
    expect(result.steps).toEqual([]);
    expect(result.results).toEqual([]);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('Test 8: all results are returned as string array matching step order', async () => {
    mockDispatch
      .mockResolvedValueOnce('result_0')
      .mockResolvedValueOnce('result_1')
      .mockResolvedValueOnce('result_2');

    const steps = [
      makeStep('tool_a', { q: '1' }, [], 0),
      makeStep('tool_b', { q: '2' }, [], 0),
      makeStep('tool_c', { q: '3' }, [0, 1], 1),
    ];
    const plan = makePlan(steps, [[0, 1], [2]]);

    const result = await executeChainPlan(plan, mockDispatch);

    expect(result.results).toHaveLength(3);
    expect(result.results[0]).toBe('result_0');
    expect(result.results[1]).toBe('result_1');
    expect(result.results[2]).toBe('result_2');
  });

  it('Test 6b: failed step placeholder replaced with error marker', async () => {
    mockDispatch.mockImplementation(async (name) => {
      if (name === 'fail_step') throw new Error('boom');
      return 'ok';
    });

    const steps = [
      makeStep('fail_step', { q: '1' }, [], 0),
      makeStep('next_step', { prev: '{{step_0_result}}' }, [0], 1),
    ];
    const plan = makePlan(steps, [[0], [1]]);

    const result = await executeChainPlan(plan, mockDispatch);

    // next_step should receive the failed placeholder
    const secondCallArgs = mockDispatch.mock.calls[1][1];
    expect(secondCallArgs.prev).toBe('[Step 0 failed]');
  });
});
