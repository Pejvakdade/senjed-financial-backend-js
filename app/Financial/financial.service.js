const moment = require("moment");

const Values = require("../Values");
const UserModel = require("../models/user.model")
const DebtService = require("../Debt/debt.service");
const FactorRepository = require("../Factor/factor.repository");
const WithdrawalService = require("../Withdrawal/withdrawal.service");
const FinancialRepository = require("./financial.repository");
const TransactionRepository = require("../Transaction/transaction.repository");

const {StatusCodes, Message} = require("../Values");
const {ErrorHandler} = require("../Handler")

class FinancialService {

  constructor() {
    this.UserRole = Values.userRoles
    this.UserModel = UserModel;
    this.DebtService = DebtService;
    this.WithdrawalService = WithdrawalService;
    this.FinancialRepository = FinancialRepository;
    this.ErrorHandler = ErrorHandler;
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
                                isForCompanyProfit = false,
                              }) {
    if (Number(amount) > 0) {
      const checkWalletAmount = await this.FinancialRepository.checkWallet({
        id: payerId,
        amount,
      });
      if (!checkWalletAmount) {
        throw new this.ErrorHandler({
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
      });

      await this.chargeWallet({id: payerId, amount: -amount});
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
      });
      await this.chargeWallet({id: receiverId, amount, isForCompanyProfit});
      return true;
    }
    return true;
  }

  async paySubscriptionSuccess({foundedTransaction}) {
    const foundedService = await this.FinancialRepository.findServiceById(foundedTransaction.service);
    const foundedFinancialGroup = foundedService.financialGroupSchool;
    //* pay others commission And  send sms for payer:
    await this.transferSubscriptionShare_2({foundedTransaction, foundedService, foundedFinancialGroup});
    //* add subscription days
    await this.FinancialRepository.addSubscriptionDay({
      serviceId: foundedService._id,
      days: Number(foundedService.cycle) * Number(foundedTransaction.count),
    });
    //* unblock Service
    await this.FinancialRepository.deleteBlockByReasonAndUserType({
      serviceId: String(foundedService._id),
      blockReason: 20011,
    });

    //* change factor status
    await FactorRepository.changeFactorStatus({
      factorsList: foundedTransaction.factorsList,
      paidBy: foundedTransaction.payerId,
      paidDate: Date.now(),
    });
  }

  async transferSubscriptionShare({foundedTransaction, foundedService, foundedFinancialGroup}) {
    const shares = {
      admin: foundedFinancialGroup.subscriptionStudent.share.admin,
      superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
      company: foundedFinancialGroup.subscriptionStudent.share.company,
      driver: foundedFinancialGroup.subscriptionStudent.share.driver,
      tax: foundedFinancialGroup.subscriptionStudent.share.tax,
    };
    const foundedCommissionManagerSchoolId = await this.FinancialRepository.findCommissionManagerSchoolId();
    const foundedBankSchoolId = await this.FinancialRepository.findBankSchoolId();
    const foundedTaxId = await this.FinancialRepository.findTaxId();

    const calculateOnePresent = foundedTransaction.amount / 100;

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
        });

        // BANK_SCHOOL
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedCommissionManagerSchoolId,
          payerType: "COMMISSION_MANAGER_SCHOOL",
          receiverId: foundedBankSchoolId,
          receiverType: "BANK_SCHOOL",
          amount: (foundedTransaction.amount * shares.admin) / 100,
          subscribe: foundedTransaction._id,
        });

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
          });
        }

        // COMPANY

        if (foundedTransaction?.company) {
          this.WithdrawalService.createWithdrawal({
            amount: (foundedTransaction.amount * shares.company) / 100,
            userId: foundedTransaction?.company,
            type: "COMPANY",
            superAgent: foundedTransaction?.superAgent,
            driver: foundedTransaction?.driver,
            company: foundedTransaction?.company,
            city: foundedTransaction?.city,
            phoneNumber: foundedService.company.phoneNumber,
            province: foundedService.company.companyInformation.province,
          });
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.company,
            receiverType: "COMPANY",
            amount: (foundedTransaction.amount * shares.company) / 100,
            subscribe: foundedTransaction._id,
            isForCompanyProfit: true,
          });
        }

        // DRIVER

        if (foundedService.company?.companyInformation?.isDriverWallet === true) {
          if (foundedTransaction?.driver) {
            await this.internalMoneyTransfer({
              reason: "SERVICE_SUBSCRIPTION_COMMISSION",
              payerId: foundedCommissionManagerSchoolId,
              payerType: "COMMISSION_MANAGER_SCHOOL",
              receiverId: foundedTransaction?.driver,
              receiverType: "DRIVER",
              amount: (foundedTransaction.amount * shares.driver) / 100,
              subscribe: foundedTransaction._id,
            });
          }
        } else {
          const foundedCompanyDebt = await this.DebtService.findDebtPriceForCompany(foundedTransaction.company);
          let totalDebt = 0;
          let debtList = [];
          for (const i in foundedCompanyDebt) {
            totalDebt = foundedCompanyDebt[i].amount + totalDebt;
            debtList.push(foundedCompanyDebt[i]._id);
          }
          if (foundedCompanyDebt) {
            if (totalDebt < (foundedTransaction.amount * shares.driver) / 100) {
              for (const i in debtList) {
                await this.DebtService.payDebt(debtList[i]);
              }
              await this.DebtService.createDebt({
                reason: "COMPANY_DEBT_TO_DRIVER",
                receiverId: foundedTransaction?.driver,
                receiverType: "DRIVER",
                superAgent: foundedTransaction?.superAgent,
                driver: foundedTransaction?.driver,
                student: foundedTransaction?.student,
                service: foundedTransaction?.service,
                company: foundedTransaction?.company,
                city: foundedTransaction?.city,
                amount: (foundedTransaction.amount * shares.driver) / 100,
                factorsList: foundedTransaction?.factorsList,
                description: "یدهی شرکت به راننده",
                name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
                driverPhoneNumber: foundedService.driver.phoneNumber,
                studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
              });
              this.WithdrawalService.createWithdrawal({
                amount: (foundedTransaction.amount * shares.driver) / 100 - Number(totalDebt),
                userId: foundedTransaction?.company,
                type: "COMPANY",
                superAgent: foundedTransaction?.superAgent,
                driver: foundedTransaction?.driver,
                company: foundedTransaction?.company,
                city: foundedTransaction?.city,
                phoneNumber: foundedService.company.phoneNumber,
                province: foundedService.company.companyInformation.province,
              });
              await this.FinancialRepository.chargeWallet({
                id: foundedCommissionManagerSchoolId,
                amount: -((foundedTransaction.amount * shares.driver) / 100),
              });
            } else {
              await this.DebtService.createDebt({
                reason: "COMPANY_DEBT_TO_DRIVER",
                receiverId: foundedTransaction?.driver,
                receiverType: "DRIVER",
                superAgent: foundedTransaction?.superAgent,
                driver: foundedTransaction?.driver,
                student: foundedTransaction?.student,
                service: foundedTransaction?.service,
                company: foundedTransaction?.company,
                city: foundedTransaction?.city,
                amount: (foundedTransaction.amount * shares.driver) / 100,
                factorsList: foundedTransaction?.factorsList,
                description: "یدهی شرکت به راننده",
                name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
                driverPhoneNumber: foundedService.driver.phoneNumber,
                studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
              });
              this.WithdrawalService.createWithdrawal({
                amount: (foundedTransaction.amount * shares.driver) / 100,
                userId: foundedTransaction?.company,
                type: "COMPANY",
                superAgent: foundedTransaction?.superAgent,
                driver: foundedTransaction?.driver,
                company: foundedTransaction?.company,
                city: foundedTransaction?.city,
                phoneNumber: foundedService.company.phoneNumber,
                province: foundedService.company.companyInformation.province,
              });
            }
          } else {
            await this.DebtService.createDebt({
              reason: "COMPANY_DEBT_TO_DRIVER",
              receiverId: foundedTransaction?.driver,
              receiverType: "DRIVER",
              superAgent: foundedTransaction?.superAgent,
              driver: foundedTransaction?.driver,
              student: foundedTransaction?.student,
              service: foundedTransaction?.service,
              company: foundedTransaction?.company,
              city: foundedTransaction?.city,
              amount: (foundedTransaction.amount * shares.driver) / 100,
              factorsList: foundedTransaction?.factorsList,
              description: "یدهی شرکت به راننده",
              name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
              driverPhoneNumber: foundedService.driver.phoneNumber,
              studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
            });
            this.WithdrawalService.createWithdrawal({
              amount: (foundedTransaction.amount * shares.driver) / 100,
              userId: foundedTransaction?.company,
              type: "COMPANY",
              superAgent: foundedTransaction?.superAgent,
              driver: foundedTransaction?.driver,
              company: foundedTransaction?.company,
              city: foundedTransaction?.city,
              phoneNumber: foundedService.company.phoneNumber,
              province: foundedService.company.companyInformation.province,
            });
          }
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
          });
        }
        break;
      case "DRIVER":
        // //* send message to passenger
        // Api.sendMessageChapar({
        //   userId: foundedTransaction.parent,
        //   message: Message.SUBSCRIPTION_PARRENT_SMS,
        // })
        // //* send message to Driver
        // Api.sendMessageChapar({
        //   userId: foundedTransaction.parent,
        //   message: Message.SUBSCRIPTION_DRIVER_SMS,
        // })

        await this.FinancialRepository.chargeWallet({
          id: foundedTransaction.payerId,
          amount: -(calculateOnePresent * shares.driver),
        });
        // COMMISSION_MANAGER_SCHOOL

        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedTransaction.payerId,
          payerType: "DRIVER",
          receiverId: foundedCommissionManagerSchoolId,
          receiverType: "COMMISSION_MANAGER_SCHOOL",
          amount: foundedTransaction.amount - calculateOnePresent * shares.driver,
          subscribe: foundedTransaction._id,
        });

        // BANK_SCHOOL
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedCommissionManagerSchoolId,
          payerType: "COMMISSION_MANAGER_SCHOOL",
          receiverId: foundedBankSchoolId,
          receiverType: "BANK_SCHOOL",
          amount: calculateOnePresent * shares.admin,

          subscribe: foundedTransaction._id,
        });

        // SUPER_AGENT
        if (foundedTransaction?.superAgent) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.superAgent,
            receiverType: "SUPER_AGENT_SCHOOL",
            amount: calculateOnePresent * shares.superAgent,

            subscribe: foundedTransaction._id,
          });
        }

        // COMPANY
        if (foundedTransaction?.company) {
          this.WithdrawalService.createWithdrawal({
            amount: calculateOnePresent * shares.company,

            userId: foundedTransaction?.company,
            type: "COMPANY",
            superAgent: foundedTransaction?.superAgent,
            driver: foundedTransaction?.driver,
            company: foundedTransaction?.company,
            city: foundedTransaction?.city,
            phoneNumber: foundedService.company.phoneNumber,
            province: foundedService.company.companyInformation.province,
          });
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.company,
            receiverType: "COMPANY",
            amount: calculateOnePresent * shares.company,

            subscribe: foundedTransaction._id,
            isForCompanyProfit: true,
          });
        }

        // TAX
        if (foundedTransaction?.driver) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTaxId,
            receiverType: "TAX",
            amount: calculateOnePresent * shares.tax,

            subscribe: foundedTransaction._id,
          });
        }
        break;
      case "COMPANY":
        // //* send message to passenger
        // Api.sendMessageChapar({
        //   userId: foundedTransaction.parent,
        //   message: Message.SUBSCRIPTION_PARRENT_SMS,
        // })
        // //* send message to COMPANY
        // Api.sendMessageChapar({
        //   userId: foundedTransaction.company,
        //   message: Message.SUBSCRIPTION_DRIVER_COMPANY,
        // })

        //!check pay offline or online
        if (foundedTransaction?.payerOriginType === "DRIVER" || foundedTransaction?.payerOriginType === "PASSENGER") {
          // foundedTransaction.amount - ((foundedTransaction.amount / 100) * shares.company + (foundedTransaction.amount / 100) * shares.driver)
          const checkWallet = await this.FinancialRepository.checkWallet({
            id: foundedTransaction.payerId,
            amount: foundedTransaction.amount - (calculateOnePresent * shares.company + calculateOnePresent * shares.driver),
          });
          if (checkWallet) {
            this.FinancialRepository.chargeWalletCompany({
              id: foundedTransaction.payerId,
              amount: Number(calculateOnePresent * shares.company),
            });

            if (foundedTransaction.amount - (calculateOnePresent * shares.company + calculateOnePresent * shares.driver) > 0)
              await this.internalMoneyTransfer({
                reason: "SERVICE_SUBSCRIPTION_COMMISSION",
                payerId: foundedTransaction.payerId,
                payerType: "COMPANY",
                receiverId: foundedCommissionManagerSchoolId,
                receiverType: "COMMISSION_MANAGER_SCHOOL",
                amount: foundedTransaction.amount - (calculateOnePresent * shares.company + calculateOnePresent * shares.driver),
                subscribe: foundedTransaction._id,
              });

            // BANK_SCHOOL
            if (calculateOnePresent * shares.admin > 0)
              await this.internalMoneyTransfer({
                reason: "SERVICE_SUBSCRIPTION_COMMISSION",
                payerId: foundedCommissionManagerSchoolId,
                payerType: "COMMISSION_MANAGER_SCHOOL",
                receiverId: foundedBankSchoolId,
                receiverType: "BANK_SCHOOL",
                amount: calculateOnePresent * shares.admin,
                subscribe: foundedTransaction._id,
              });

            // SUPER_AGENT
            if (foundedTransaction?.superAgent) {
              await this.internalMoneyTransfer({
                reason: "SERVICE_SUBSCRIPTION_COMMISSION",
                payerId: foundedCommissionManagerSchoolId,
                payerType: "COMMISSION_MANAGER_SCHOOL",
                receiverId: foundedTransaction?.superAgent,
                receiverType: "SUPER_AGENT_SCHOOL",
                amount: calculateOnePresent * shares.superAgent,
                subscribe: foundedTransaction._id,
              });
            }

            // TAX
            await this.internalMoneyTransfer({
              reason: "SERVICE_SUBSCRIPTION_COMMISSION",
              payerId: foundedCommissionManagerSchoolId,
              payerType: "COMMISSION_MANAGER_SCHOOL",
              receiverId: foundedTaxId,
              receiverType: "TAX",
              amount: calculateOnePresent * shares.tax,
              subscribe: foundedTransaction._id,
            });

            if (foundedTransaction?.payerOriginType === "PASSENGER") {
              await this.DebtService.createDebt({
                reason: "COMPANY_DEBT_TO_DRIVER",
                receiverId: foundedTransaction?.driver,
                receiverType: "DRIVER",
                superAgent: foundedTransaction?.superAgent,
                driver: foundedTransaction?.driver,
                student: foundedTransaction?.student,
                service: foundedTransaction?.service,
                company: foundedTransaction?.company,
                city: foundedTransaction?.city,
                amount: calculateOnePresent * shares.driver,
                factorsList: foundedTransaction?.factorsList,
                description: "یدهی شرکت به راننده",
                name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
                driverPhoneNumber: foundedService.driver.phoneNumber,
                studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
              });
            } else {
              await this.DebtService.createDebt({
                reason: "COMPANY_DEBT_TO_DRIVER",
                status: "SUCCESS",
                receiverId: foundedTransaction?.driver,
                receiverType: "DRIVER",
                superAgent: foundedTransaction?.superAgent,
                driver: foundedTransaction?.driver,
                student: foundedTransaction?.student,
                service: foundedTransaction?.service,
                company: foundedTransaction?.company,
                city: foundedTransaction?.city,
                amount: calculateOnePresent * shares.driver,
                factorsList: foundedTransaction?.factorsList,
                description: "یدهی شرکت به راننده",
                name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
                driverPhoneNumber: foundedService.driver.phoneNumber,
                studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
              });
            }
          } else {
            // this.FinancialRepository.chargeWalletCompany({ id: foundedTransaction.payerId, amount: Number((foundedTransaction.amount * shares.company) / 100) })

            // BANK_SCHOOL
            await this.DebtService.createDebt({
              reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
              receiverId: foundedBankSchoolId,
              receiverType: "BANK_SCHOOL",
              payerId: foundedTransaction.payerId,
              payerType: "COMPANY",
              amount: calculateOnePresent * shares.admin,
              subscribe: foundedTransaction._id,
              description: "یدهی شرکت به اپلیکیشن",
              superAgent: foundedTransaction?.superAgent,
              driver: foundedTransaction?.driver,
              student: foundedTransaction?.student,
              service: foundedTransaction?.service,
              company: foundedTransaction?.company,
              city: foundedTransaction?.city,
              factorsList: foundedTransaction?.factorsList,
              name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
              driverPhoneNumber: foundedService.driver.phoneNumber,
              studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
            });

            // SUPER_AGENT
            await this.DebtService.createDebt({
              reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
              receiverId: foundedTransaction?.superAgent,
              receiverType: "SUPER_AGENT_SCHOOL",
              payerId: foundedTransaction.payerId,
              payerType: "COMPANY",
              amount: calculateOnePresent * shares.superAgent,
              subscribe: foundedTransaction._id,
              description: "یدهی شرکت به اموزش پرورش",
              superAgent: foundedTransaction?.superAgent,
              driver: foundedTransaction?.driver,
              student: foundedTransaction?.student,
              service: foundedTransaction?.service,
              company: foundedTransaction?.company,
              city: foundedTransaction?.city,
              factorsList: foundedTransaction?.factorsList,
              name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
              driverPhoneNumber: foundedService.driver.phoneNumber,
              studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
            });

            // TAX
            await this.DebtService.createDebt({
              reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
              receiverId: foundedTaxId,
              receiverType: "TAX",
              payerId: foundedTransaction.payerId,
              payerType: "COMPANY",
              amount: calculateOnePresent * shares.tax,
              subscribe: foundedTransaction._id,
              description: "یدهی شرکت به مالیات",
              superAgent: foundedTransaction?.superAgent,
              driver: foundedTransaction?.driver,
              student: foundedTransaction?.student,
              service: foundedTransaction?.service,
              company: foundedTransaction?.company,
              city: foundedTransaction?.city,
              factorsList: foundedTransaction?.factorsList,
              name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
              driverPhoneNumber: foundedService.driver.phoneNumber,
              studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
            });

            if (foundedTransaction?.payerOriginType === "PASSENGER") {
              await this.DebtService.createDebt({
                reason: "COMPANY_DEBT_TO_DRIVER",
                receiverId: foundedTransaction?.driver,
                receiverType: "DRIVER",
                superAgent: foundedTransaction?.superAgent,
                driver: foundedTransaction?.driver,
                student: foundedTransaction?.student,
                service: foundedTransaction?.service,
                company: foundedTransaction?.company,
                city: foundedTransaction?.city,
                amount: calculateOnePresent * shares.driver,
                factorsList: foundedTransaction?.factorsList,
                description: "یدهی شرکت به راننده",
                name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
                driverPhoneNumber: foundedService.driver.phoneNumber,
                studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
              });
            } else {
              await this.DebtService.createDebt({
                reason: "COMPANY_DEBT_TO_DRIVER",
                status: "SUCCESS",
                receiverId: foundedTransaction?.driver,
                receiverType: "DRIVER",
                superAgent: foundedTransaction?.superAgent,
                driver: foundedTransaction?.driver,
                student: foundedTransaction?.student,
                service: foundedTransaction?.service,
                company: foundedTransaction?.company,
                city: foundedTransaction?.city,
                amount: calculateOnePresent * shares.driver,
                factorsList: foundedTransaction?.factorsList,
                description: "یدهی شرکت به راننده",
                name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
                driverPhoneNumber: foundedService.driver.phoneNumber,
                studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
              });
            }
          }

          //
        } else {
          await this.FinancialRepository.chargeWallet({
            id: foundedTransaction.payerId,
            amount: -(calculateOnePresent * shares.company + calculateOnePresent * shares.driver),
          });

          // COMMISSION_MANAGER_SCHOOL
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedTransaction.payerId,
            payerType: "COMPANY",
            receiverId: foundedCommissionManagerSchoolId,
            receiverType: "COMMISSION_MANAGER_SCHOOL",
            amount:
              foundedTransaction.amount - (foundedTransaction.amount * shares.driver) / 100 - (foundedTransaction.amount * shares.company) / 100,
            subscribe: foundedTransaction._id,
          });

          // BANK_SCHOOL
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedBankSchoolId,
            receiverType: "BANK_SCHOOL",
            amount: (foundedTransaction.amount * shares.admin) / 100,
            subscribe: foundedTransaction._id,
          });

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
            });
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
            });
          }
        }

        break;
    }

    return true;
  }

  async findServiceById(serviceId, populate) {
    return await this.FinancialRepository.findServiceById(serviceId, populate);
  }

  /**
   * @param {string} serviceId
   * @param {boolean} factorStatus
   * @returns {Promise<any>}
   */
  findServiceByIdAndUpdateHasFactor = async (serviceId, factorStatus) =>
    await this.FinancialRepository.findServiceByIdAndUpdateHasFactor(serviceId, factorStatus);

  async findServiceByDriverId(driverId) {
    return await this.FinancialRepository.findServiceByDriverId(driverId);
  }

  updateHasFactorFlag = async (arg) => await this.FinancialRepository.updateHasFactorFlag(arg);

  findUserById = async (arg) => await this.FinancialRepository.findUserById(arg);

  checkProfitWallet = async (arg) => await this.FinancialRepository.checkProfitWallet(arg);

  // transferToMainBalnceForCompany = async (arg) => await this.FinancialRepository.transferToMainBalnceForCompany(arg)

  /**
   *
   * @param {{id: string, amount: number, isForCompanyProfit?: boolean}} param0
   * @returns {Promise<any>}
   */
  async chargeWallet({id, amount, isForCompanyProfit}) {
    let canWithdrawal = false;
    if (amount < 0) canWithdrawal = await this.FinancialRepository.canWithdrawal({id, amount});
    if (amount < 0 && !canWithdrawal) return false;
    else
      return isForCompanyProfit === true
        ? await this.FinancialRepository.chargeWalletCompany({id, amount})
        : await this.FinancialRepository.chargeWallet({id, amount});
  }

  /**
   *
   * @param {string} _id
   * @param {Date} expire
   * @param {Array<any>} factorList
   * @param {number} cycle
   */
  async findServiceAndUpdateExpaire(_id, expire, factorList, cycle) {

    const updatedExpire = moment(expire).add(factorList.length * cycle, "days");
    await this.FinancialRepository.findServiceAndUpdateExpaire(_id, updatedExpire);
  }

  /**
   * - function for transfer Subscription Share
   * - include company without POZ-Machine
   *
   * @param foundedService {any}
   * @param foundedTransaction {any}
   * @param foundedFinancialGroup {any}
   * @returns {Promise<boolean>}
   */
  async transferSubscriptionShare_2({foundedTransaction, foundedService, foundedFinancialGroup}) {
    /** @type {Promise<any>} */
    const foundedCommissionManagerSchoolId = await this.FinancialRepository.findCommissionManagerSchoolId();
    /** @type {Promise<any>} */
    const foundedBankSchoolId = await this.FinancialRepository.findBankSchoolId();
    /** @type {Promise<any>} */
    const foundedTaxId = await this.FinancialRepository.findTaxId();

    /** @type {any} */
    const calculateOnePresent = foundedTransaction.amount / 100;
    /** @type {any} */
    const shares = foundedFinancialGroup.subscriptionStudent.share

    switch (foundedTransaction.payerType) {
      case "PASSENGER":
        // TODO :: send message to passenger

        /** COMMISSION_MANAGER_SCHOOL */
        await this.internalMoneyTransfer({
          amount: foundedTransaction.amount,
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedTransaction.payerId,
          subscribe: foundedTransaction._id,
          payerType: this.UserRole.PASSENGER,
          receiverId: foundedCommissionManagerSchoolId,
          receiverType: "COMMISSION_MANAGER_SCHOOL",
        });

        /** BANK_SCHOOL */
        await this.internalMoneyTransfer({
          amount: (foundedTransaction.amount * shares.admin) / 100,
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          payerId: foundedCommissionManagerSchoolId,
          payerType: "COMMISSION_MANAGER_SCHOOL",
          subscribe: foundedTransaction._id,
          receiverId: foundedBankSchoolId,
          receiverType: "BANK_SCHOOL",
        });

        /** SUPER_AGENT */
        if (foundedTransaction?.superAgent) {
          await this.internalMoneyTransfer({
            amount: (foundedTransaction.amount * shares.superAgent) / 100,
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            subscribe: foundedTransaction._id,
            receiverId: foundedTransaction?.superAgent,
            receiverType: "SUPER_AGENT_SCHOOL",
          });
        }

        /** COMPANY */
        await this.paymentPassengerFoundedTransactionCompany({
          amount: (foundedTransaction.amount * shares.company) / 100,
          payerId: foundedCommissionManagerSchoolId,
          foundedService,
          foundedTransaction,
        })

        /** DRIVER */
        await this.paymentPassengerFoundedTransactionDriver({
          shares,
          foundedService,
          foundedTransaction,
          foundedCommissionManagerSchoolId,
        })

        /** TAX */
        await this.payTaxInPaymentPassengerFoundedTransaction({
          shares,
          foundedTaxId,
          foundedTransaction,
          foundedCommissionManagerSchoolId
        })

        break;
      case "DRIVER":
        // TODO :: send message to passenger

        /** DRIVER */
        await this.FinancialRepository.chargeWallet({
          id: foundedTransaction.payerId,
          amount: -(calculateOnePresent * shares.driver),
        });

        /** COMMISSION_MANAGER_SCHOOL */
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          amount: foundedTransaction.amount - calculateOnePresent * shares.driver,
          payerId: foundedTransaction.payerId,
          payerType: this.UserRole.DRIVER,
          subscribe: foundedTransaction._id,
          receiverId: foundedCommissionManagerSchoolId,
          receiverType: "COMMISSION_MANAGER_SCHOOL",
        });

        /** BANK_SCHOOL */
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          amount: calculateOnePresent * shares.admin,
          payerId: foundedCommissionManagerSchoolId,
          subscribe: foundedTransaction._id,
          payerType: "COMMISSION_MANAGER_SCHOOL",
          receiverId: foundedBankSchoolId,
          receiverType: "BANK_SCHOOL",
        });

        /** SUPER_AGENT */
        if (foundedTransaction?.superAgent) {
          await this.internalMoneyTransfer({
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            amount: calculateOnePresent * shares.superAgent,
            payerId: foundedCommissionManagerSchoolId,
            subscribe: foundedTransaction._id,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            receiverId: foundedTransaction?.superAgent,
            receiverType: "SUPER_AGENT_SCHOOL",
          });
        }

        /** COMPANY */
        await this.paymentPassengerFoundedTransactionCompany({
          amount: (foundedTransaction.amount * shares.company) / 100,
          payerId: foundedCommissionManagerSchoolId,
          foundedService,
          foundedTransaction,
        })

        /** TAX */
        await this.payTaxInPaymentPassengerFoundedTransaction({
          shares,
          foundedTaxId,
          foundedTransaction,
          foundedCommissionManagerSchoolId
        })

        break;
      case "COMPANY":
        // TODO :: send message to passenger

        if (foundedTransaction?.payerOriginType === this.UserRole.DRIVER || foundedTransaction?.payerOriginType === this.UserRole.PASSENGER) {
          /**  start OffLine payment */

          /** @type {boolean} */
          const checkWallet = await this.FinancialRepository.checkWallet({
            id: foundedTransaction.payerId,
            amount: foundedTransaction.amount - (calculateOnePresent * shares.company + calculateOnePresent * shares.driver),
          });


          /** @type {Promise<any>} */
          const foundedCompany = await this.UserModel.findById(foundedService.company);

          if (checkWallet) {
            /** start checkWallet === True */

            if (foundedCompany.companyInformation?.isAdminPozMachine) {
              /** start company.havePozMachine === TRUE  */
              await this.offLinePaymentCompanyIfHaveWalletAndPozMachine({
                foundedCommissionManagerSchoolId,
                foundedBankSchoolId,
                calculateOnePresent,
                foundedTransaction,
                foundedService,
                foundedTaxId,
                shares,
              })
              /** end company.havePozMachine === TRUE */
            } else {
              /** start company.havePozMachine === FALSE */
              await this.offLinePaymentCompanyIfHaveWalletWithoutPozMachine({
                foundedCommissionManagerSchoolId,
                foundedBankSchoolId,
                calculateOnePresent,
                foundedTransaction,
                foundedService,
                foundedTaxId,
                shares,
              })
              /** end company.havePozMachine === FALSE */
            }

            /** end checkWallet === True */
          } else {
            /** start checkWallet === false */

            if (foundedCompany.companyInformation?.havePozMachine) {
              /** start company.havePozMachine === TRUE  */
              await this.offLinePaymentCompanyWithoutWalletAndWithPozMachine({
                calculateOnePresent,
                foundedBankSchoolId,
                foundedTransaction,
                foundedService,
                foundedTaxId,
                shares,
              })
              /** end company.havePozMachine === TRUE */
            } else {
              /** start company.havePozMachine === FALSE */
              await this.offLinePaymentCompanyWithoutWalletAndWithoutPozMachine({
                calculateOnePresent,
                foundedBankSchoolId,
                foundedTransaction,
                foundedService,
                foundedTaxId,
                shares,
              })
              /** end company.havePozMachine === FALSE */
            }
            /** end checkWallet === false */
          }
          /** end OffLine payment */
        } else {
          /** start OnLine payment */
          await this.FinancialRepository.chargeWallet({
            id: foundedTransaction.payerId,
            amount: -(calculateOnePresent * shares.company + calculateOnePresent * shares.driver),
          });

          /** COMMISSION_MANAGER_SCHOOL */
          await this.internalMoneyTransfer({
            amount:
              foundedTransaction.amount - (foundedTransaction.amount * shares.driver) / 100 - (foundedTransaction.amount * shares.company) / 100,
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedTransaction.payerId,
            payerType: this.UserRole.COMPANY,
            subscribe: foundedTransaction._id,
            receiverId: foundedCommissionManagerSchoolId,
            receiverType: "COMMISSION_MANAGER_SCHOOL",
          });

          /** BANK_SCHOOL */
          await this.internalMoneyTransfer({
            amount: (foundedTransaction.amount * shares.admin) / 100,
            reason: "SERVICE_SUBSCRIPTION_COMMISSION",
            payerId: foundedCommissionManagerSchoolId,
            payerType: "COMMISSION_MANAGER_SCHOOL",
            subscribe: foundedTransaction._id,
            receiverId: foundedBankSchoolId,
            receiverType: "BANK_SCHOOL",
          });

          /** SUPER_AGENT */
          if (foundedTransaction?.superAgent) {
            await this.internalMoneyTransfer({
              amount: (foundedTransaction.amount * shares.superAgent) / 100,
              reason: "SERVICE_SUBSCRIPTION_COMMISSION",
              payerId: foundedCommissionManagerSchoolId,
              payerType: "COMMISSION_MANAGER_SCHOOL",
              subscribe: foundedTransaction._id,
              receiverId: foundedTransaction?.superAgent,
              receiverType: "SUPER_AGENT_SCHOOL",
            });
          }

          /** TAX */
          if (foundedTransaction?.driver) {
            await this.internalMoneyTransfer({
              amount: (foundedTransaction.amount * shares.tax) / 100,
              reason: "SERVICE_SUBSCRIPTION_COMMISSION",
              payerId: foundedCommissionManagerSchoolId,
              payerType: "COMMISSION_MANAGER_SCHOOL",
              subscribe: foundedTransaction._id,
              receiverId: foundedTaxId,
              receiverType: "TAX",
            });
          }
          /** end OnLine payment */
        }

        break;
    }
    return true;
  }

  /**
   * - function for pay OR money transfer "COMPANY" in
   * - transferSubscriptionShareWhitCompanyPozMachine();
   *
   * @param amount {any}
   * @param payerId {any}
   * @param foundedService {any}
   * @param foundedTransaction {any}
   * @returns {Promise<void>}
   */
  async paymentPassengerFoundedTransactionCompany({
                                                    amount,
                                                    payerId,
                                                    foundedService,
                                                    foundedTransaction,
                                                  }) {
    if (foundedTransaction?.company) {
      await this.WithdrawalService.createWithdrawal({
        amount: amount,
        userId: foundedTransaction?.company,
        type: this.UserRole.COMPANY,
        superAgent: foundedTransaction?.superAgent,
        driver: foundedTransaction?.driver,
        company: foundedTransaction?.company,
        city: foundedTransaction?.city,
        phoneNumber: foundedService.company.phoneNumber,
        province: foundedService.company.companyInformation.province,
      });
      await this.internalMoneyTransfer({
        reason: "SERVICE_SUBSCRIPTION_COMMISSION",
        payerId: payerId,
        payerType: "COMMISSION_MANAGER_SCHOOL",
        receiverId: foundedTransaction?.company,
        receiverType: this.UserRole.COMPANY,
        amount: amount,
        subscribe: foundedTransaction._id,
        isForCompanyProfit: true,
      });
    }
  }

  /**
   * - function for money transfer "DRIVER" in
   * - transferSubscriptionShareWhitCompanyPozMachine();
   *
   * @param shares {any}
   * @param foundedService {any}
   * @param foundedTransaction {any}
   * @param foundedCommissionManagerSchoolId {any}
   * @returns {Promise<void>}
   */
  async paymentPassengerFoundedTransactionDriver({
                                                   shares,
                                                   foundedService,
                                                   foundedTransaction,
                                                   foundedCommissionManagerSchoolId,
                                                 }) {
    if (foundedService.company?.companyInformation?.isDriverWallet === true) {
      if (foundedTransaction?.driver) {
        await this.internalMoneyTransfer({
          reason: "SERVICE_SUBSCRIPTION_COMMISSION",
          amount: (foundedTransaction.amount * shares.driver) / 100,
          payerId: foundedCommissionManagerSchoolId,
          subscribe: foundedTransaction._id,
          payerType: "COMMISSION_MANAGER_SCHOOL",
          receiverId: foundedTransaction?.driver,
          receiverType: this.UserRole.DRIVER,
        });
      }
    } else {

      /** @type {Promise<any>} */
      const foundedCompanyDebt = await this.DebtService.findDebtPriceForCompany(foundedTransaction.company);
      /** @type {number} */
      let totalDebt = 0;
      /** @type {any[]} */
      let debtList = [];

      for (const i in foundedCompanyDebt) {
        totalDebt = foundedCompanyDebt[i].amount + totalDebt;
        debtList.push(foundedCompanyDebt[i]._id);
      }
      if (foundedCompanyDebt) {
        if (totalDebt < (foundedTransaction.amount * shares.driver) / 100) {
          for (const i in debtList) {
            await this.DebtService.payDebt(debtList[i]);
          }
          await this.DebtService.createDebt({
            city: foundedTransaction?.city,
            name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
            reason: "COMPANY_DEBT_TO_DRIVER",
            driver: foundedTransaction?.driver,
            amount: (foundedTransaction.amount * shares.driver) / 100,
            student: foundedTransaction?.student,
            service: foundedTransaction?.service,
            company: foundedTransaction?.company,
            superAgent: foundedTransaction?.superAgent,
            receiverId: foundedTransaction?.driver,
            factorsList: foundedTransaction?.factorsList,
            description: "یدهی شرکت به راننده",
            studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
            receiverType: this.UserRole.DRIVER,
            driverPhoneNumber: foundedService.driver.phoneNumber,
          });
          this.WithdrawalService.createWithdrawal({
            city: foundedTransaction?.city,
            type: this.UserRole.COMPANY,
            userId: foundedTransaction?.company,
            driver: foundedTransaction?.driver,
            amount: (foundedTransaction.amount * shares.driver) / 100 - Number(totalDebt),
            company: foundedTransaction?.company,
            province: foundedService.company.companyInformation.province,
            superAgent: foundedTransaction?.superAgent,
            phoneNumber: foundedService.company.phoneNumber,
          });
          await this.FinancialRepository.chargeWallet({
            id: foundedCommissionManagerSchoolId,
            amount: -((foundedTransaction.amount * shares.driver) / 100),
          });
        } else {
          await this.DebtService.createDebt({
            city: foundedTransaction?.city,
            name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
            reason: "COMPANY_DEBT_TO_DRIVER",
            driver: foundedTransaction?.driver,
            amount: (foundedTransaction.amount * shares.driver) / 100,
            student: foundedTransaction?.student,
            service: foundedTransaction?.service,
            company: foundedTransaction?.company,
            receiverId: foundedTransaction?.driver,
            superAgent: foundedTransaction?.superAgent,
            studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
            factorsList: foundedTransaction?.factorsList,
            description: "یدهی شرکت به راننده",
            receiverType: this.UserRole.DRIVER,
            driverPhoneNumber: foundedService.driver.phoneNumber,
          });
          this.WithdrawalService.createWithdrawal({
            city: foundedTransaction?.city,
            type: this.UserRole.COMPANY,
            driver: foundedTransaction?.driver,
            userId: foundedTransaction?.company,
            amount: (foundedTransaction.amount * shares.driver) / 100,
            company: foundedTransaction?.company,
            province: foundedService.company.companyInformation.province,
            superAgent: foundedTransaction?.superAgent,
            phoneNumber: foundedService.company.phoneNumber,
          });
        }
      } else {
        await this.DebtService.createDebt({
          city: foundedTransaction?.city,
          name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
          reason: "COMPANY_DEBT_TO_DRIVER",
          driver: foundedTransaction?.driver,
          amount: (foundedTransaction.amount * shares.driver) / 100,
          student: foundedTransaction?.student,
          service: foundedTransaction?.service,
          company: foundedTransaction?.company,
          receiverId: foundedTransaction?.driver,
          superAgent: foundedTransaction?.superAgent,
          factorsList: foundedTransaction?.factorsList,
          description: "یدهی شرکت به راننده",
          studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
          receiverType: this.UserRole.DRIVER,
          driverPhoneNumber: foundedService.driver.phoneNumber,
        });
        this.WithdrawalService.createWithdrawal({
          type: this.UserRole.COMPANY,
          city: foundedTransaction?.city,
          amount: (foundedTransaction.amount * shares.driver) / 100,
          userId: foundedTransaction?.company,
          driver: foundedTransaction?.driver,
          company: foundedTransaction?.company,
          province: foundedService.company.companyInformation.province,
          superAgent: foundedTransaction?.superAgent,
          phoneNumber: foundedService.company.phoneNumber,
        });
      }
    }
  }

  /**
   * - function for pay text in
   * - transferSubscriptionShareWhitCompanyPozMachine();
   *
   * @param shares {any}
   * @param foundedTaxId {any}
   * @param foundedTransaction {any}
   * @param foundedCommissionManagerSchoolId {any}
   * @returns {Promise<void>}
   */
  async payTaxInPaymentPassengerFoundedTransaction({
                                                     shares,
                                                     foundedTaxId,
                                                     foundedTransaction,
                                                     foundedCommissionManagerSchoolId
                                                   }) {
    if (foundedTransaction?.driver) {
      await this.internalMoneyTransfer({
        reason: "SERVICE_SUBSCRIPTION_COMMISSION",
        amount: (foundedTransaction.amount * shares.tax) / 100,
        payerId: foundedCommissionManagerSchoolId,
        payerType: "COMMISSION_MANAGER_SCHOOL",
        subscribe: foundedTransaction._id,
        receiverId: foundedTaxId,
        receiverType: "TAX",
      });
    }
  }

  /**
   * - function for payment "COMPANY" in case :
   *    - haveWallet === true
   *    - havePozMachine === false
   *
   * @param shares {any}
   * @param foundedTaxId {any}
   * @param foundedService {any}
   * @param foundedTransaction {any}
   * @param calculateOnePresent {any}
   * @param foundedBankSchoolId {any}
   * @param foundedCommissionManagerSchoolId {any}
   * @returns {Promise<void>}
   */
  async offLinePaymentCompanyIfHaveWalletWithoutPozMachine({
                                                             shares,
                                                             foundedTaxId,
                                                             foundedService,
                                                             foundedTransaction,
                                                             calculateOnePresent,
                                                             foundedBankSchoolId,
                                                             foundedCommissionManagerSchoolId,
                                                           }) {
    await this.FinancialRepository.chargeWalletCompany({
      id: foundedTransaction.payerId,
      amount: Number(calculateOnePresent * shares.company),
    });

    /** COMPANY */
    if (foundedTransaction.amount - (calculateOnePresent * shares.company + calculateOnePresent * shares.driver) > 0)
      await this.internalMoneyTransfer({
        reason: "SERVICE_SUBSCRIPTION_COMMISSION",
        amount: foundedTransaction.amount - (calculateOnePresent * shares.company + calculateOnePresent * shares.driver),
        payerId: foundedTransaction.payerId,
        payerType: this.UserRole.COMPANY,
        subscribe: foundedTransaction._id,
        receiverId: foundedCommissionManagerSchoolId,
        receiverType: "COMMISSION_MANAGER_SCHOOL",
      });

    /** BANK_SCHOOL */
    if (calculateOnePresent * shares.admin > 0)
      await this.internalMoneyTransfer({
        reason: "SERVICE_SUBSCRIPTION_COMMISSION",
        amount: calculateOnePresent * shares.admin,
        payerId: foundedCommissionManagerSchoolId,
        payerType: "COMMISSION_MANAGER_SCHOOL",
        receiverId: foundedBankSchoolId,
        receiverType: "BANK_SCHOOL",
        subscribe: foundedTransaction._id,
      });

    /** SUPER_AGENT */
    if (foundedTransaction?.superAgent) {
      await this.internalMoneyTransfer({
        reason: "SERVICE_SUBSCRIPTION_COMMISSION",
        amount: calculateOnePresent * shares.superAgent,
        payerId: foundedCommissionManagerSchoolId,
        payerType: "COMMISSION_MANAGER_SCHOOL",
        subscribe: foundedTransaction._id,
        receiverId: foundedTransaction?.superAgent,
        receiverType: "SUPER_AGENT_SCHOOL",
      });
    }

    /** TAX */
    await this.internalMoneyTransfer({
      reason: "SERVICE_SUBSCRIPTION_COMMISSION",
      amount: calculateOnePresent * shares.tax,
      payerId: foundedCommissionManagerSchoolId,
      payerType: "COMMISSION_MANAGER_SCHOOL",
      subscribe: foundedTransaction._id,
      receiverId: foundedTaxId,
      receiverType: "TAX",
    });

    if (foundedTransaction?.payerOriginType === this.UserRole.PASSENGER) {
      await this.DebtService.createDebt({
        city: foundedTransaction?.city,
        name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
        amount: calculateOnePresent * shares.driver,
        reason: "COMPANY_DEBT_TO_DRIVER",
        driver: foundedTransaction?.driver,
        student: foundedTransaction?.student,
        service: foundedTransaction?.service,
        company: foundedTransaction?.company,
        receiverId: foundedTransaction?.driver,
        superAgent: foundedTransaction?.superAgent,
        factorsList: foundedTransaction?.factorsList,
        description: "یدهی شرکت به راننده",
        studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
        receiverType: this.UserRole.DRIVER,
        driverPhoneNumber: foundedService.driver.phoneNumber,
      });
    } else {
      await this.DebtService.createDebt({
        city: foundedTransaction?.city,
        name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
        status: "SUCCESS",
        reason: "COMPANY_DEBT_TO_DRIVER",
        driver: foundedTransaction?.driver,
        amount: calculateOnePresent * shares.driver,
        student: foundedTransaction?.student,
        service: foundedTransaction?.service,
        company: foundedTransaction?.company,
        receiverId: foundedTransaction?.driver,
        superAgent: foundedTransaction?.superAgent,
        description: "یدهی شرکت به راننده",
        factorsList: foundedTransaction?.factorsList,
        studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
        receiverType: this.UserRole.DRIVER,
        driverPhoneNumber: foundedService.driver.phoneNumber,
      });
    }
  }

  /**
   * - function for payment "COMPANY" in case :
   *    - haveWallet === true
   *    - havePozMachine === true
   *
   * @param shares {any}
   * @param foundedTaxId {any}
   * @param foundedService {any}
   * @param foundedTransaction {any}
   * @param calculateOnePresent {any}
   * @param foundedBankSchoolId {any}
   * @param foundedCommissionManagerSchoolId {any}
   * @returns {Promise<void>}
   */
  async offLinePaymentCompanyIfHaveWalletAndPozMachine({
                                                         shares,
                                                         foundedTaxId,
                                                         foundedService,
                                                         foundedTransaction,
                                                         calculateOnePresent,
                                                         foundedBankSchoolId,
                                                         foundedCommissionManagerSchoolId,
                                                       }) {
    // ! ===============================================================================================================
    // ! ---------------------------------------------------------------------------------------------------------------
    /** COMMISSION_MANAGER */
    await this.internalMoneyTransfer({
      reason: "SERVICE_SUBSCRIPTION_COMMISSION",
      amount: foundedTransaction.amount, // ! All the money
      payerId: foundedTransaction.payerId,
      payerType: this.UserRole.COMPANY,
      subscribe: foundedTransaction._id,
      receiverId: foundedCommissionManagerSchoolId,
      receiverType: "COMMISSION_MANAGER_SCHOOL",
    });

    /** COMPANY - Withdrawal */
    await this.WithdrawalService.createWithdrawal({
      type: this.UserRole.COMPANY,
      city: foundedTransaction?.city,
      amount: (foundedTransaction.amount * (shares.company + shares.driver)) / 100, // ! Company and Driver share
      userId: foundedTransaction?.company,
      driver: foundedTransaction?.driver,
      company: foundedTransaction?.company,
      province: foundedService.company.companyInformation.province,
      superAgent: foundedTransaction?.superAgent,
      phoneNumber: foundedService.company.phoneNumber,
    });

    /** COMPANY - MoneyTransfer */
    await this.internalMoneyTransfer({
      amount: (foundedTransaction.amount * (shares.company + shares.driver)) / 100, // ! Company and Driver share
      reason: "SERVICE_SUBSCRIPTION_COMMISSION",
      payerId: foundedCommissionManagerSchoolId,
      subscribe: foundedTransaction._id,
      payerType: "COMMISSION_MANAGER_SCHOOL",
      receiverId: foundedTransaction?.company,
      receiverType: this.UserRole.COMPANY,
      isForCompanyProfit: true,
    });

    // ! ---------------------------------------------------------------------------------------------------------------
    // ! ===============================================================================================================

    /** BANK_SCHOOL */
    if (calculateOnePresent * shares.admin > 0)
      await this.internalMoneyTransfer({
        reason: "SERVICE_SUBSCRIPTION_COMMISSION",
        amount: calculateOnePresent * shares.admin,
        payerId: foundedCommissionManagerSchoolId,
        payerType: "COMMISSION_MANAGER_SCHOOL",
        subscribe: foundedTransaction._id,
        receiverId: foundedBankSchoolId,
        receiverType: "BANK_SCHOOL",
      });

    /** SUPER_AGENT */
    if (foundedTransaction?.superAgent) {
      await this.internalMoneyTransfer({
        reason: "SERVICE_SUBSCRIPTION_COMMISSION",
        amount: calculateOnePresent * shares.superAgent,
        payerId: foundedCommissionManagerSchoolId,
        payerType: "COMMISSION_MANAGER_SCHOOL",
        subscribe: foundedTransaction._id,
        receiverId: foundedTransaction?.superAgent,
        receiverType: "SUPER_AGENT_SCHOOL",
      });
    }

    /** TAX */
    await this.internalMoneyTransfer({
      reason: "SERVICE_SUBSCRIPTION_COMMISSION",
      amount: calculateOnePresent * shares.tax,
      payerId: foundedCommissionManagerSchoolId,
      payerType: "COMMISSION_MANAGER_SCHOOL",
      subscribe: foundedTransaction._id,
      receiverId: foundedTaxId,
      receiverType: "TAX",
    });

    if (foundedTransaction?.payerOriginType === this.UserRole.PASSENGER) {
      await this.DebtService.createDebt({
        city: foundedTransaction?.city,
        name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
        amount: calculateOnePresent * shares.driver,
        reason: "COMPANY_DEBT_TO_DRIVER",
        driver: foundedTransaction?.driver,
        student: foundedTransaction?.student,
        service: foundedTransaction?.service,
        company: foundedTransaction?.company,
        receiverId: foundedTransaction?.driver,
        superAgent: foundedTransaction?.superAgent,
        factorsList: foundedTransaction?.factorsList,
        description: "یدهی شرکت به راننده",
        studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
        receiverType: this.UserRole.DRIVER,
        driverPhoneNumber: foundedService.driver.phoneNumber,
      });
    } else {
      await this.DebtService.createDebt({
        city: foundedTransaction?.city,
        name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
        status: "SUCCESS",
        reason: "COMPANY_DEBT_TO_DRIVER",
        driver: foundedTransaction?.driver,
        amount: calculateOnePresent * shares.driver,
        student: foundedTransaction?.student,
        service: foundedTransaction?.service,
        company: foundedTransaction?.company,
        receiverId: foundedTransaction?.driver,
        superAgent: foundedTransaction?.superAgent,
        description: "یدهی شرکت به راننده",
        factorsList: foundedTransaction?.factorsList,
        studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
        receiverType: this.UserRole.DRIVER,
        driverPhoneNumber: foundedService.driver.phoneNumber,
      });
    }
  }

  /**
   * - function for payment "COMPANY" in case:
   *    - haveWallet === false
   *    - havePozMachine === false
   *
   * @param shares {any}
   * @param foundedTaxId {any}
   * @param foundedService {any}
   * @param foundedTransaction {any}
   * @param foundedBankSchoolId {any}
   * @param calculateOnePresent {any}
   * @returns {Promise<void>}
   */
  async offLinePaymentCompanyWithoutWalletAndWithoutPozMachine({
                                                                 shares,
                                                                 foundedTaxId,
                                                                 foundedService,
                                                                 foundedTransaction,
                                                                 foundedBankSchoolId,
                                                                 calculateOnePresent,
                                                               }) {
    /** BANK_SCHOOL */
    await this.DebtService.createDebt({
      city: foundedTransaction?.city,
      name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
      driver: foundedTransaction?.driver,
      amount: calculateOnePresent * shares.admin,
      reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
      student: foundedTransaction?.student,
      service: foundedTransaction?.service,
      company: foundedTransaction?.company,
      payerId: foundedTransaction.payerId,
      payerType: this.UserRole.COMPANY,
      subscribe: foundedTransaction._id,
      receiverId: foundedBankSchoolId,
      superAgent: foundedTransaction?.superAgent,
      description: "یدهی شرکت به اپلیکیشن",
      factorsList: foundedTransaction?.factorsList,
      studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
      receiverType: "BANK_SCHOOL",
      driverPhoneNumber: foundedService.driver.phoneNumber,
    });

    // SUPER_AGENT
    await this.DebtService.createDebt({
      city: foundedTransaction?.city,
      name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
      reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
      amount: calculateOnePresent * shares.superAgent,
      driver: foundedTransaction?.driver,
      payerId: foundedTransaction.payerId,
      student: foundedTransaction?.student,
      service: foundedTransaction?.service,
      company: foundedTransaction?.company,
      payerType: this.UserRole.COMPANY,
      subscribe: foundedTransaction._id,
      receiverId: foundedTransaction?.superAgent,
      superAgent: foundedTransaction?.superAgent,
      factorsList: foundedTransaction?.factorsList,
      description: "یدهی شرکت به اموزش پرورش",
      studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
      receiverType: "SUPER_AGENT_SCHOOL",
      driverPhoneNumber: foundedService.driver.phoneNumber,
    });

    // TAX
    await this.DebtService.createDebt({
      city: foundedTransaction?.city,
      name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
      driver: foundedTransaction?.driver,
      amount: calculateOnePresent * shares.tax,
      reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
      payerId: foundedTransaction.payerId,
      student: foundedTransaction?.student,
      service: foundedTransaction?.service,
      company: foundedTransaction?.company,
      payerType: this.UserRole.COMPANY,
      subscribe: foundedTransaction._id,
      receiverId: foundedTaxId,
      superAgent: foundedTransaction?.superAgent,
      description: "یدهی شرکت به مالیات",
      factorsList: foundedTransaction?.factorsList,
      studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
      receiverType: "TAX",
      driverPhoneNumber: foundedService.driver.phoneNumber,
    });

    if (foundedTransaction?.payerOriginType === this.UserRole.PASSENGER) {
      await this.DebtService.createDebt({
        city: foundedTransaction?.city,
        name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
        reason: "COMPANY_DEBT_TO_DRIVER",
        driver: foundedTransaction?.driver,
        amount: calculateOnePresent * shares.driver,
        student: foundedTransaction?.student,
        service: foundedTransaction?.service,
        company: foundedTransaction?.company,
        receiverId: foundedTransaction?.driver,
        superAgent: foundedTransaction?.superAgent,
        factorsList: foundedTransaction?.factorsList,
        description: "یدهی شرکت به راننده",
        studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
        receiverType: this.UserRole.DRIVER,
        driverPhoneNumber: foundedService.driver.phoneNumber,
      });
    } else {
      await this.DebtService.createDebt({
        city: foundedTransaction?.city,
        name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
        reason: "COMPANY_DEBT_TO_DRIVER",
        status: "SUCCESS",
        driver: foundedTransaction?.driver,
        amount: calculateOnePresent * shares.driver,
        student: foundedTransaction?.student,
        service: foundedTransaction?.service,
        company: foundedTransaction?.company,
        receiverId: foundedTransaction?.driver,
        superAgent: foundedTransaction?.superAgent,
        factorsList: foundedTransaction?.factorsList,
        description: "یدهی شرکت به راننده",
        studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
        receiverType: this.UserRole.DRIVER,
        driverPhoneNumber: foundedService.driver.phoneNumber,
      });
    }
  }

  /**
   * - function for Payment "COMPANY" in case :
   *    - haveWallet === false
   *    - havePozMachine === true
   *
   * @param shares
   * @param foundedTaxId
   * @param foundedService
   * @param foundedTransaction
   * @param foundedBankSchoolId
   * @param calculateOnePresent
   * @returns {Promise<void>}
   */
  async offLinePaymentCompanyWithoutWalletAndWithPozMachine({
                                                              shares,
                                                              foundedTaxId,
                                                              foundedService,
                                                              foundedTransaction,
                                                              foundedBankSchoolId,
                                                              calculateOnePresent,
                                                            }) {
    /** BANK_SCHOOL */
    await this.DebtService.createDebt({
      city: foundedTransaction?.city,
      name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
      driver: foundedTransaction?.driver,
      amount: calculateOnePresent * shares.admin,
      reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
      student: foundedTransaction?.student,
      service: foundedTransaction?.service,
      company: foundedTransaction?.company,
      payerId: foundedTransaction.payerId,
      payerType: this.UserRole.COMPANY,
      subscribe: foundedTransaction._id,
      receiverId: foundedBankSchoolId,
      superAgent: foundedTransaction?.superAgent,
      description: "یدهی شرکت به اپلیکیشن",
      factorsList: foundedTransaction?.factorsList,
      studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
      receiverType: "BANK_SCHOOL",
      driverPhoneNumber: foundedService.driver.phoneNumber,
    });

    /** SUPER_AGENT - Withdrawal */
    await this.WithdrawalService.createWithdrawal({
      city: foundedTransaction?.city,
      type: this.UserRole.SUPER_AGENT_SCHOOL,
      amount: calculateOnePresent * shares.superAgent,
      userId: foundedTransaction?.superAgent,
      driver: foundedTransaction?.driver,
      company: foundedTransaction?.company,
      province: foundedService.company.companyInformation.province,
      superAgent: foundedTransaction?.superAgent,
      phoneNumber: foundedService.company.phoneNumber,
    });

    /** TAX - Debt for company */
    await this.DebtService.createDebt({
      city: foundedTransaction?.city,
      name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
      driver: foundedTransaction?.driver,
      amount: calculateOnePresent * shares.tax,
      reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
      payerId: foundedTransaction.payerId,
      student: foundedTransaction?.student,
      service: foundedTransaction?.service,
      company: foundedTransaction?.company,
      payerType: this.UserRole.COMPANY,
      subscribe: foundedTransaction._id,
      receiverId: foundedTaxId,
      superAgent: foundedTransaction?.superAgent,
      description: "یدهی شرکت به مالیات",
      factorsList: foundedTransaction?.factorsList,
      studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
      receiverType: "TAX",
      driverPhoneNumber: foundedService.driver.phoneNumber,
    });

    /** DRIVER - Withdrawal */
    await this.WithdrawalService.createWithdrawal({
      city: foundedTransaction?.city,
      type: this.UserRole.DRIVER,
      amount: calculateOnePresent * shares.driver,
      userId: foundedTransaction?.driver,
      driver: foundedTransaction?.driver,
      company: foundedTransaction?.company,
      province: foundedService.company.companyInformation.province,
      superAgent: foundedTransaction?.superAgent,
      phoneNumber: foundedService.company.phoneNumber,
    });
  }

  /**
   * - function for update Driver.schoolDriverInformation.deposit
   *
   * @memberof FinancialController.payDriverSubscription();
   * @memberof FinancialController.payServiceSubscription();
   * @memberof FinancialController.payDriverSubscriptionByFactorIds();
   *
   * @param {any} _id
   * @param {number} deposit
   * @returns {Promise<void>}
   */
  async updateDepositForDriver(_id, deposit){
    if (deposit >= 0) {
      await this.UserModel.findOneAndUpdate(_id, {"schoolDriverInformation.deposit": 0});
    } else {
      await this.UserModel.findOneAndUpdate(_id, {"schoolDriverInformation.deposit": deposit})
    }
  }

}

module.exports = new FinancialService();
