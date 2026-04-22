const FREE_CREDIT_DELAY_HOURS = Number(
  process.env.FREE_CREDIT_DELAY_HOURS || 24,
);
const FREE_CREDIT_AMOUNT = Number(process.env.FREE_CREDIT_AMOUNT || 2);
const FREE_CREDIT_VALIDITY_DAYS = Number(
  process.env.FREE_CREDIT_VALIDITY_DAYS || 365,
);

const activatePendingFreeCredits = async (user) => {
  if (
    !user?.subscription ||
    user.subscription.isValid ||
    !user.subscription.activationDate
  ) {
    return false;
  }

  const now = new Date();
  const activationDate = new Date(user.subscription.activationDate);
  if (now < activationDate) {
    return false;
  }

  const startDate = activationDate;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + FREE_CREDIT_VALIDITY_DAYS);

  user.subscription = {
    ...user.subscription,
    startDate,
    endDate,
    isValid: true,
    votingCredits: FREE_CREDIT_AMOUNT,
    usedVotingCredits: 0,
  };

  await user.save();
  return true;
};

module.exports = {
  activatePendingFreeCredits,
  FREE_CREDIT_DELAY_HOURS,
  FREE_CREDIT_AMOUNT,
  FREE_CREDIT_VALIDITY_DAYS,
};
