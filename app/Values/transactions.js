module.exports = {
  reasons: {
    SUBSCRIPTION: {
      $or: [
        {
          reason: 'SUBSCRIPTION'
        },
        {
          reason: 'SUBSCRIPTION_INVOICE'
        },
        {
          reason: 'SUBSCRIPTION_INTERNAL'
        },
        {
          reason: 'SUBSCRIPTION_FROM_DRIVER_WALLET'
        }
      ]
    },
    COMMISSION: {
      $or: [{ reason: 'SUBSCRIPTION_COMMISSION' }, { reason: 'TRAVEL_COST_COMMISSION' }, { reason: 'PAY_DEBTS_COMMISSION' }]
    },
    TRAVEL_COST: { $or: [{ reason: 'TRAVEL_COST' }] },
    CHARGE_WALLET: { $or: [{ reason: 'CHARGE_WALLET' }, { reason: 'CHARGE_WALLET_INVOICE' }] },
    PAY_DEBTS: { $or: [{ reason: 'PAY_DEBTS' }, { reason: 'PAY_DEBTS_INVOICE' }] }
  },
  ownerTypes: {
    ADMIN: {
      $or: [
        {
          receiverType: 'ADMIN'
        },
        {
          payerType: 'ADMIN'
        }
      ]
    },
    SUPER_AGENT: {
      $or: [
        {
          receiverType: 'SUPER_AGENT'
        },
        {
          payerType: 'SUPER_AGENT'
        }
      ]
    },
    AGENT: {
      $or: [
        {
          receiverType: 'AGENT'
        },
        {
          payerType: 'AGENT'
        }
      ]
    },
    DRIVER: {
      $or: [
        {
          receiverType: 'DRIVER'
        },
        {
          payerType: 'DRIVER'
        }
      ]
    },
    PASSENGER: {
      $or: [
        {
          receiverType: 'PASSENGER'
        },
        {
          payerType: 'PASSENGER'
        }
      ]
    },
    TAX: {
      $or: [
        {
          receiverType: 'TAX'
        },
        {
          payerType: 'TAX'
        }
      ]
    }
  },
  transactionStatuses: {
    SUCCESS: {
      transactionStatus: 'SUCCESS'
    },
    FAILED: {
      transactionStatus: 'FAILED'
    },
    PENDING: {
      transactionStatus: 'PENDING'
    }
  },

  isDeposits: {
    true: {
      isDeposit: true
    },
    false: {
      isDeposit: false
    }
  },

  isForClients: {
    true: {
      isForClient: true
    },
    false: {
      isForClient: false
    }
  },

  isOnlines: {
    true: {
      isOnline: true
    },
    false: {
      isOnline: false
    }
  },

  driverIds: (driver) => {
    return {
      $or: [
        {
          receiverId: driver
        },
        {
          payerId: driver
        }
      ]
    }
  },
  agentIds: (agent) => {
    return {
      agent
    }
  },
  superAgents: (superAgent) => {
    return {
      superAgent
    }
  },
  citys: (city) => {
    return {
      city
    }
  },
  date: ({ startDate, endDate }) => {
    endDate = new Date(endDate)
    return { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate.setDate(endDate.getDate() + 1)) } }
  }
}
