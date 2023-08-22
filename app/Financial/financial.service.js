const FinancialRepository = require("./financial.repository")
const FinancialGroupService = require("../FinancialGroup/financialGroup.service")
const FactorService = require("../Factor/factor.service")
const FactorRepository = require("../Factor/factor.repository")

const TransactionRepository = require("../Transaction/transaction.repository")
const UtilService = require("../Utils/util.service")
const Api = require("../Api")
const ErrorHandler = require("../Handler/ErrorHandler")
const { StatusCodes, Message } = require("../Values")

class FinancialService {
  constructor(financialRepository, utilService) {
    this.financialRepository = financialRepository
    this.utilService = utilService
  }

  async internalMoneyTransfer({
    withdrawalId,
    reason,
    payerId,
    payerType,
    receiverId,
    receiverType,
    isForClient,
    amount,
    description,
    isOnline = false,
    subscribe,
  }) {
    console.log({ receiverType })
    // reason: "SERVICE_SUBSCRIPTION_COMMISSION",
    // payerId: foundedTransaction.payerId,
    // payerType: "PASSENGER",
    // receiverId: foundedCommissionManagerSchoolId,
    // receiverType: "COMMISSION_MANAGER_SCHOOL",
    // amount: foundedTransaction.amount,
    // subscribe: foundedTransaction._id,
    const checkWalletAmount = await this.financialRepository.checkWallet({
      id: payerId,
      amount,
    })
    console.log({ checkWalletAmount })
    if (!checkWalletAmount) {
      throw new ErrorHandler({
        httpCode: 400,
        statusCode: StatusCodes.ERROR_INSUFFICIENT_BALANCE,
      })
    }

    await TransactionRepository.createTransaction({
      reason,
      payerId,
      payerType,
      receiverId,
      receiverType,
      amount,
      description,
      isOnline,
      isForClient,
      isDeposit: false,
      withdrawalId,
      subscribe,
    })
    await this.chargeWallet({ id: payerId, amount: -amount })
    await TransactionRepository.createTransaction({
      reason,
      payerId,
      payerType,
      receiverId,
      receiverType,
      amount,
      description,
      isOnline,
      isForClient,
      isDeposit: true,
      withdrawalId,
      subscribe,
    })
    await this.chargeWallet({ id: receiverId, amount })
  }

  async paySubscriptionSuccess({ foundedTransaction }) {
    const foundedService = await this.financialRepository.findServiceById(foundedTransaction.service)
    const foundedFinancialGroup = foundedService.financialGroupSchool
    // const foundedFinancialGroup = await FinancialGroupService.getFinancialGroupById(foundedService?.schoolFinancialGroup)

    //* pay others commission And  send sms for payer:
    await this.transferSubscriptionShare({ foundedTransaction, foundedService, foundedFinancialGroup })

    //* add subscription days
    await this.financialRepository.addSubscriptionDay({
      serviceId: foundedService._id,
      days: Number(foundedFinancialGroup.subscriptionStudent.cycle) * Number(foundedTransaction.count),
    })
    console.log("jjjjjjjsjadjajsjkdjasjkdhaskjdhjkahsjkdhajksdkahdjs")

    //* unblock Service
    await this.financialRepository.deleteBlockByReasonAndUserType({
      serviceId: String(foundedService._id),
      blockReason: 20011,
    })

    //* change factor status
    await FactorRepository.changeFactorStatus({
      factorsList: foundedTransaction.factorsList,
      paidBy: foundedTransaction.payerId,
      paidDate: Date.now(),
    })
  }

  async transferSubscriptionShare({ foundedTransaction, foundedService, foundedFinancialGroup }) {
    const shares = {
      admin: foundedFinancialGroup.subscriptionStudent.share.admin,
      superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      company: foundedFinancialGroup.subscriptionStudent.share.company,
      driver: foundedFinancialGroup.subscriptionStudent.share.driver,
      tax: foundedFinancialGroup.subscriptionStudent.share.tax,
    }
    const foundedCommissionManagerSchoolId = await this.financialRepository.findCommissionManagerSchoolId()
    console.log({ foundedCommissionManagerSchoolId })
    const foundedBankSchoolId = await this.financialRepository.findBankSchoolId()
    const foundedTaxId = await this.financialRepository.findTaxId()

    switch (foundedTransaction.payerType) {
      case "PASSENGER":
        //* send message to passenger
        // Api.sendMessageChapar({
        //   userId: foundedTransaction.parent,
        //   message: Message.SUBSCRIPTION_PARRENT_SMS
        // })
        //todo

        // COMMISSION_MANAGER_SCHOOL
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedTransaction.payerId,
          payerType: "PASSENGER",
          receiverId: foundedCommissionManagerSchoolId,
          receiverType: "COMMISSION_MANAGER_SCHOOL",
          amount: foundedTransaction.amount,
          subscribe: foundedTransaction._id,
        })

        // BANK_SCHOOL
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedCommissionManagerSchoolId,
          payerType: "COMMISSION_MANAGER_SCHOOL",
          receiverId: foundedBankSchoolId,
          receiverType: "BANK_SCHOOL",
          amount: (foundedTransaction.amount * shares.admin) / 100,
          subscribe: foundedTransaction._id,
        })

        // SUPER_AGENT
        if (foundedTransaction?.superAgent) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.superAgent,
            receiverType: "SUPER_AGENT_SCHOOL",
            amount: (foundedTransaction.amount * shares.superAgent) / 100,
            subscribe: foundedTransaction._id,
          })
        }

        // COMPANY
        if (foundedTransaction?.company) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.company,
            receiverType: "COMPANY",
            amount: (foundedTransaction.amount * shares.company) / 100,
            subscribe: foundedTransaction._id,
          })
        }

        // DRIVER
        if (foundedTransaction?.driver) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.driver,
            receiverType: "DRIVER",
            amount: (foundedTransaction.amount * shares.driver) / 100,
            subscribe: foundedTransaction._id,
          })
        }

        // TAX
        if (foundedTransaction?.driver) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTaxId,
            receiverType: "TAX",
            amount: (foundedTransaction.amount * shares.tax) / 100,
            subscribe: foundedTransaction._id,
          })
        }

        break

      case "DRIVER":
        //* send message to passenger
        Api.sendMessageChapar({
          userId: foundedTransaction.parent,
          message: Message.SUBSCRIPTION_PARRENT_SMS,
        })
        //* send message to Driver
        Api.sendMessageChapar({
          userId: foundedTransaction.parent,
          message: Message.SUBSCRIPTION_DRIVER_SMS,
        })
        // COMMISSION_MANAGER_SCHOOL
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedTransaction.payerId,
          payerType: "DRIVER",
          receiverId: foundedCommissionManagerSchoolId,
          receiverType: "COMMISSION_MANAGER_SCHOOL",
          amount: foundedTransaction.amount - (foundedTransaction.amount * shares.driver) / 100,
          subscribe: foundedTransaction._id,
        })

        // BANK_SCHOOL
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedCommissionManagerSchoolId,
          payerType: "COMMISSION_MANAGER_SCHOOL",
          receiverId: foundedBankSchoolId,
          receiverType: "BANK_SCHOOL",
          amount: (foundedTransaction.amount * shares.admin) / 100,
          subscribe: foundedTransaction._id,
        })

        // SUPER_AGENT
        if (foundedTransaction?.superAgent) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.superAgent,
            receiverType: "SUPER_AGENT_SCHOOL",
            amount: (foundedTransaction.amount * shares.superAgent) / 100,
            subscribe: foundedTransaction._id,
          })
        }

        // COMPANY
        if (foundedTransaction?.company) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.company,
            receiverType: "COMPANY",
            amount: (foundedTransaction.amount * shares.company) / 100,
            subscribe: foundedTransaction._id,
          })
        }

        // TAX
        if (foundedTransaction?.driver) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTaxId,
            receiverType: "TAX",
            amount: (foundedTransaction.amount * shares.tax) / 100,
            subscribe: foundedTransaction._id,
          })
        }
        break

      case "COMPANY":
        //* send message to passenger
        Api.sendMessageChapar({
          userId: foundedTransaction.parent,
          message: Message.SUBSCRIPTION_PARRENT_SMS,
        })
        //* send message to COMPANY
        Api.sendMessageChapar({
          userId: foundedTransaction.company,
          message: Message.SUBSCRIPTION_DRIVER_COMPANY,
        })

        // COMMISSION_MANAGER_SCHOOL
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedTransaction.payerId,
          payerType: "COMPANY",
          receiverId: foundedCommissionManagerSchoolId,
          receiverType: "COMMISSION_MANAGER_SCHOOL",
          amount:
            foundedTransaction.amount -
            (foundedTransaction.amount * shares.driver) / 100 -
            (foundedTransaction.amount * shares.company) / 100,
          subscribe: foundedTransaction._id,
        })

        // BANK_SCHOOL
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedCommissionManagerSchoolId,
          payerType: "COMMISSION_MANAGER_SCHOOL",
          receiverId: foundedBankSchoolId,
          receiverType: "BANK_SCHOOL",
          amount: (foundedTransaction.amount * shares.admin) / 100,
          subscribe: foundedTransaction._id,
        })

        // SUPER_AGENT
        if (foundedTransaction?.superAgent) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.superAgent,
            receiverType: "SUPER_AGENT_SCHOOL",
            amount: (foundedTransaction.amount * shares.superAgent) / 100,
            subscribe: foundedTransaction._id,
          })
        }

        // TAX
        if (foundedTransaction?.driver) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTaxId,
            receiverType: "TAX",
            amount: (foundedTransaction.amount * shares.tax) / 100,
            subscribe: foundedTransaction._id,
          })
        }
        break
    }

    return true
  }

  async findServiceById(serviceId) {
    return await this.financialRepository.findServiceById(serviceId)
  }

  updateHasFactorFlag = async (arg) => await this.financialRepository.updateHasFactorFlag(arg)

  findUserById = async (arg) => await this.financialRepository.findUserById(arg)

  async chargeWallet({ id, amount }) {
    let canWithdrawal = false
    if (amount < 0) canWithdrawal = await this.financialRepository.canWithdrawal({ id, amount })
    if (amount < 0 && !canWithdrawal) return false
    else return await this.financialRepository.chargeWallet({ id, amount })
  }
}
module.exports = new FinancialService(FinancialRepository, UtilService)
