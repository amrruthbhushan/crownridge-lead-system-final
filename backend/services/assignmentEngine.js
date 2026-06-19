/**
 * Assignment Engine for Leads
 */
export async function assignLead(lead, temperature, prisma) {
  // Cold leads: Keep unassigned, queue for review
  if (temperature === 'COLD') {
    return {
      assignedToId: null,
      notes: 'Queued for manual review (COLD Lead).',
    };
  }

  // Hot & Warm leads: Assign immediately to Sales Representatives using round-robin
  const salesReps = await prisma.user.findMany({
    where: {
      role: 'SALES_REP',
    },
  });

  if (salesReps.length === 0) {
    return {
      assignedToId: null,
      notes: 'No Sales Representatives available. Queued for manual assignment.',
    };
  }

  // Round-robin selection: Find the representative whose latest assignment is the oldest,
  // or who has never been assigned a lead.
  let selectedRep = null;
  let oldestAssignmentTime = Infinity;

  for (const rep of salesReps) {
    const lastAssignment = await prisma.assignment.findFirst({
      where: {
        assignedToId: rep.id,
      },
      orderBy: {
        assignedDate: 'desc',
      },
    });

    if (!lastAssignment) {
      // Rep has never been assigned a lead - top priority
      selectedRep = rep;
      break;
    }

    const assignmentTime = new Date(lastAssignment.assignedDate).getTime();
    if (assignmentTime < oldestAssignmentTime) {
      oldestAssignmentTime = assignmentTime;
      selectedRep = rep;
    }
  }

  const assignedRep = selectedRep || salesReps[0];
  const typeText = temperature === 'HOT' ? 'HOT Lead immediate routing' : 'WARM Lead round-robin routing';

  return {
    assignedToId: assignedRep.id,
    notes: `Automatically assigned to ${assignedRep.name} (${typeText}).`,
  };
}
