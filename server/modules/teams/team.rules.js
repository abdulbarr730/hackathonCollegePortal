const FEMALE_VALUES = ['female', 'f'];

/* ============================================================================
   CHECK TEAM LOCK STATUS
============================================================================ */
exports.ensureNotSubmitted = (team) => {
  if (team.isSubmitted) {
    const err = new Error('Team is submitted and locked.');
    err.status = 400;
    throw err;
  }
};

/* ============================================================================
   VALIDATE TEAM SIZE LIMITS
============================================================================ */
exports.validateTeamSize = (team, maxMembers) => {
  if (team.members.length >= maxMembers) {
    const err = new Error(`Team is full (Max ${maxMembers}).`);
    err.status = 400;
    throw err;
  }
};

/* ============================================================================
   VALIDATE GENDER REQUIREMENT
============================================================================ */
exports.validateGenderRequirement = (team, incomingUser, rules) => {
  const { minFemaleMembers = 0, maxTeamSize = 6 } = rules;

  if (!minFemaleMembers) return;

  const currentFemales = team.members.filter(m =>
    m.gender && FEMALE_VALUES.includes(m.gender.toLowerCase())
  ).length;

  const incomingIsFemale =
    incomingUser.gender &&
    FEMALE_VALUES.includes(incomingUser.gender.toLowerCase());

  const remainingSlots = maxTeamSize - team.members.length;
  const femalesStillNeeded = incomingIsFemale
    ? minFemaleMembers - (currentFemales + 1)
    : minFemaleMembers - currentFemales;

  if (!incomingIsFemale && (remainingSlots - 1) < femalesStillNeeded) {
    const err = new Error(
      `Diversity Rule: You still need ${femalesStillNeeded} female member(s).`
    );
    err.status = 400;
    throw err;
  }
};

/* ============================================================================
   VALIDATE SUBMISSION DEADLINE
============================================================================ */
exports.validateDeadline = (deadline) => {
  if (!deadline) return;

  const now = new Date();
  const deadlineDate = new Date(deadline);

  if (now > deadlineDate) {
    const err = new Error(
      `Submission closed. Deadline was ${deadlineDate.toLocaleString()}`
    );
    err.status = 400;
    throw err;
  }
};