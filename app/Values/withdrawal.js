module.exports = {
  statusC: {
    PENDING: {
      status: "PENDING",
    },
    ACCEPTED: {
      status: "ACCEPTED",
    },
    REJECTED: {
      status: "REJECTED",
    },
  },

  userIdC: (userId) => {
    console.log({ 2: { userId } })

    return {
      userId,
    }
  },

  agentC: (agent) => {
    return {
      agent,
    }
  },

  superAgentC: (superAgent) => {
    return {
      superAgent,
    }
  },

  cityC: (city) => {
    return {
      city,
    }
  },

  userTypeC: (userType) => {
    return {
      userType,
    }
  },

  trackingCodeC: (Code) => {
    const trackingCode = {
      $regex: Code,
    }
    return { trackingCode }
  },

  date: ({ startDate, endDate }) => {
    if (startDate && endDate) {
      endDate = new Date(endDate)
      return { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate.setDate(endDate.getDate() + 1)) } }
    }
    if (startDate && !endDate) {
      return { createdAt: { $gte: new Date(startDate) } }
    }
    if (!startDate && endDate) {
      endDate = new Date(endDate)
      return { createdAt: { $lt: new Date(endDate.setDate(endDate.getDate() + 1)) } }
    }
  },
}
