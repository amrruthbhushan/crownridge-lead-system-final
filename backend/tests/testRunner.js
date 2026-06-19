import assert from 'assert';
import { calculateScore } from '../services/scoringEngine.js';
import { assignLead } from '../services/assignmentEngine.js';
import { generateLeadAdvice } from '../services/aiService.js';

// Mock Prisma client for unit testing assignment engine
class MockPrisma {
  constructor(reps = [], assignments = []) {
    this.reps = reps;
    this.assignments = assignments;
  }

  get user() {
    return {
      findMany: async () => this.reps
    };
  }

  get assignment() {
    return {
      findFirst: async ({ where }) => {
        // Find last assignment for rep
        const repAssignments = this.assignments
          .filter(a => a.assignedToId === where.assignedToId)
          .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
        return repAssignments[0] || null;
      }
    };
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('      CRONWRIDGE CRM TEST SUITE INITIATION');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  const test = (name, fn) => {
    try {
      fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(err);
      failed++;
    }
  };

  const asyncTest = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(err);
      failed++;
    }
  };

  // ==========================================
  // 1. LEAD SCORING ENGINE TESTS
  // ==========================================
  test('Scoring Engine - High parameters compute to HOT Lead (100)', () => {
    const mockLead = {
      budget: 'HIGH',       // 30
      projectSize: 'LARGE',  // 30
      urgency: 'HIGH',      // 20
      industryFit: 'EXCELLENT' // 20
    };
    const result = calculateScore(mockLead);
    assert.strictEqual(result.score, 100);
    assert.strictEqual(result.temperature, 'HOT');
  });

  test('Scoring Engine - Medium parameters compute to WARM Lead (65 => HOT)', () => {
    const mockLead = {
      budget: 'MEDIUM',     // 20
      projectSize: 'MEDIUM', // 20
      urgency: 'MEDIUM',     // 10
      industryFit: 'GOOD'    // 15
    };
    const result = calculateScore(mockLead);
    assert.strictEqual(result.score, 65);
    assert.strictEqual(result.temperature, 'HOT');
  });

  test('Scoring Engine - Low parameters compute to COLD Lead (30)', () => {
    const mockLead = {
      budget: 'LOW',        // 10
      projectSize: 'SMALL',  // 10
      urgency: 'LOW',       // 5
      industryFit: 'POOR'   // 5
    };
    const result = calculateScore(mockLead);
    assert.strictEqual(result.score, 30);
    assert.strictEqual(result.temperature, 'COLD');
  });

  // ==========================================
  // 2. LEAD ROUTING ENGINE TESTS
  // ==========================================
  await asyncTest('Assignment Engine - COLD Lead routes to unassigned queue', async () => {
    const mockLead = { id: 'lead-1', name: 'Cold Lead' };
    const mockPrisma = new MockPrisma();
    const result = await assignLead(mockLead, 'COLD', mockPrisma);
    assert.strictEqual(result.assignedToId, null);
    assert.match(result.notes, /manual review/);
  });

  await asyncTest('Assignment Engine - HOT Lead assigns immediately to Sales Rep', async () => {
    const mockLead = { id: 'lead-2', name: 'Hot Lead' };
    const salesReps = [
      { id: 'rep-1', name: 'Sarah Sales', role: 'SALES_REP' },
      { id: 'rep-2', name: 'John Sales', role: 'SALES_REP' }
    ];
    
    // rep-2 was assigned a lead more recently than rep-1 (or rep-1 has never been assigned)
    const assignments = [
      { assignedToId: 'rep-2', assignedDate: '2026-06-19T10:00:00.000Z' }
    ];

    const mockPrisma = new MockPrisma(salesReps, assignments);
    const result = await assignLead(mockLead, 'HOT', mockPrisma);
    
    // Rep-1 has no assignments, so they should be selected (round-robin)
    assert.strictEqual(result.assignedToId, 'rep-1');
  });

  await asyncTest('Assignment Engine - WARM Lead distributes via round-robin oldest timestamp', async () => {
    const mockLead = { id: 'lead-3', name: 'Warm Lead' };
    const salesReps = [
      { id: 'rep-1', name: 'Sarah Sales', role: 'SALES_REP' },
      { id: 'rep-2', name: 'John Sales', role: 'SALES_REP' }
    ];
    
    // Rep-1 was assigned yesterday, Rep-2 was assigned today. Oldest is Rep-1.
    const assignments = [
      { assignedToId: 'rep-1', assignedDate: '2026-06-18T10:00:00.000Z' },
      { assignedToId: 'rep-2', assignedDate: '2026-06-19T10:00:00.000Z' }
    ];

    const mockPrisma = new MockPrisma(salesReps, assignments);
    const result = await assignLead(mockLead, 'WARM', mockPrisma);
    
    assert.strictEqual(result.assignedToId, 'rep-1');
  });

  // ==========================================
  // 3. AI QUALIFICATION ADVISOR TESTS
  // ==========================================
  await asyncTest('AI Advisor - Analyzes lead metrics and outputs risk assessments', async () => {
    const mockLead = {
      name: 'Tester',
      companyName: 'Test Inc',
      industry: 'Software',
      budget: 'LOW',
      projectSize: 'SMALL',
      urgency: 'LOW',
      source: 'LINKEDIN',
      notes: 'Short description',
      status: 'NEW',
      industryFit: 'POOR'
    };
    const scoreRecord = { score: 30, temperature: 'COLD' };
    
    const advice = await generateLeadAdvice(mockLead, scoreRecord);
    
    // Low budget, low urgency, poor fit, short notes should trigger 4 distinct risk blocks
    assert.strictEqual(advice.risks.length, 4);
    assert.match(advice.summary, /Test Inc/);
    assert.match(advice.followUps[0], /LinkedIn/);
  });

  console.log('\n==================================================');
  console.log(`  TESTS COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
