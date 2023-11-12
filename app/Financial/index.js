const FinancialController = require('./financial.controller')
const FinancialService = require('./financial.service')
const FinancialRepository = require('./financial.repository')
const FinancialModel = require('./financial.model')

module.exports = {
  FinancialController,
  FinancialService,
  FinancialRepository,
  FinancialModel
}


/**
 * async transferSubscriptionShare({foundedTransaction, foundedService, foundedFinancialGroup}) {
 *     const shares = {
 *       admin: foundedFinancialGroup.subscriptionStudent.share.admin,
 *       superAgent: foundedFinancialGroup.subscriptionStudent.share.superAgent,
 *       company: foundedFinancialGroup.subscriptionStudent.share.company,
 *       driver: foundedFinancialGroup.subscriptionStudent.share.driver,
 *       tax: foundedFinancialGroup.subscriptionStudent.share.tax,
 *     };
 *     const foundedCommissionManagerSchoolId = await this.FinancialRepository.findCommissionManagerSchoolId();
 *     const foundedBankSchoolId = await this.FinancialRepository.findBankSchoolId();
 *     const foundedTaxId = await this.FinancialRepository.findTaxId();
 *
 *     const calculateOnePersent = foundedTransaction.amount / 100;
 *
 *     switch (foundedTransaction.payerType) {
 *       case "PASSENGER":
 *         //* send message to passenger
 *         // Api.sendMessageChapar({
 *         //   userId: foundedTransaction.parent,
 *         //   message: Message.SUBSCRIPTION_PARRENT_SMS
 *         // })
 *         //todo
 *
 *         // COMMISSION_MANAGER_SCHOOL
 *         await this.internalMoneyTransfer({
 *           reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *           payerId: foundedTransaction.payerId,
 *           payerType: "PASSENGER",
 *           receiverId: foundedCommissionManagerSchoolId,
 *           receiverType: "COMMISSION_MANAGER_SCHOOL",
 *           amount: foundedTransaction.amount,
 *           subscribe: foundedTransaction._id,
 *         });
 *
 *         // BANK_SCHOOL
 *         await this.internalMoneyTransfer({
 *           reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *           payerId: foundedCommissionManagerSchoolId,
 *           payerType: "COMMISSION_MANAGER_SCHOOL",
 *           receiverId: foundedBankSchoolId,
 *           receiverType: "BANK_SCHOOL",
 *           amount: (foundedTransaction.amount * shares.admin) / 100,
 *           subscribe: foundedTransaction._id,
 *         });
 *
 *         // SUPER_AGENT
 *         if (foundedTransaction?.superAgent) {
 *           await this.internalMoneyTransfer({
 *             reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *             payerId: foundedCommissionManagerSchoolId,
 *             payerType: "COMMISSION_MANAGER_SCHOOL",
 *             receiverId: foundedTransaction?.superAgent,
 *             receiverType: "SUPER_AGENT_SCHOOL",
 *             amount: (foundedTransaction.amount * shares.superAgent) / 100,
 *             subscribe: foundedTransaction._id,
 *           });
 *         }
 *
 *         // COMPANY
 *
 *         if (foundedTransaction?.company) {
 *           this.WithdrawalService.createWithdrawal({
 *             amount: (foundedTransaction.amount * shares.company) / 100,
 *             userId: foundedTransaction?.company,
 *             type: "COMPANY",
 *             superAgent: foundedTransaction?.superAgent,
 *             driver: foundedTransaction?.driver,
 *             company: foundedTransaction?.company,
 *             city: foundedTransaction?.city,
 *             phoneNumber: foundedService.company.phoneNumber,
 *             province: foundedService.company.companyInformation.province,
 *           });
 *           await this.internalMoneyTransfer({
 *             reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *             payerId: foundedCommissionManagerSchoolId,
 *             payerType: "COMMISSION_MANAGER_SCHOOL",
 *             receiverId: foundedTransaction?.company,
 *             receiverType: "COMPANY",
 *             amount: (foundedTransaction.amount * shares.company) / 100,
 *             subscribe: foundedTransaction._id,
 *             isForCompanyProfit: true,
 *           });
 *         }
 *
 *         // DRIVER
 *
 *         if (foundedService.company?.companyInformation?.isDriverWallet === true) {
 *           if (foundedTransaction?.driver) {
 *             await this.internalMoneyTransfer({
 *               reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *               payerId: foundedCommissionManagerSchoolId,
 *               payerType: "COMMISSION_MANAGER_SCHOOL",
 *               receiverId: foundedTransaction?.driver,
 *               receiverType: "DRIVER",
 *               amount: (foundedTransaction.amount * shares.driver) / 100,
 *               subscribe: foundedTransaction._id,
 *             });
 *           }
 *         } else {
 *           const foundedCompanyDebt = await this.DebtService.findDebtPriceForCompany(foundedTransaction.company);
 *           console.log({foundedCompanyDebt});
 *           let totalDebt = 0;
 *           let debtList = [];
 *           for (const i in foundedCompanyDebt) {
 *             totalDebt = foundedCompanyDebt[i].amount + totalDebt;
 *             debtList.push(foundedCompanyDebt[i]._id);
 *           }
 *           if (foundedCompanyDebt) {
 *             if (totalDebt < (foundedTransaction.amount * shares.driver) / 100) {
 *               for (const i in debtList) {
 *                 await this.DebtService.payDebt(debtList[i]);
 *               }
 *               await this.DebtService.createDebt({
 *                 reason: "COMPANY_DEBT_TO_DRIVER",
 *                 receiverId: foundedTransaction?.driver,
 *                 receiverType: "DRIVER",
 *                 superAgent: foundedTransaction?.superAgent,
 *                 driver: foundedTransaction?.driver,
 *                 student: foundedTransaction?.student,
 *                 service: foundedTransaction?.service,
 *                 company: foundedTransaction?.company,
 *                 city: foundedTransaction?.city,
 *                 amount: (foundedTransaction.amount * shares.driver) / 100,
 *                 factorsList: foundedTransaction?.factorsList,
 *                 description: "یدهی شرکت به راننده",
 *                 name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *                 driverPhoneNumber: foundedService.driver.phoneNumber,
 *                 studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *               });
 *               this.WithdrawalService.createWithdrawal({
 *                 amount: (foundedTransaction.amount * shares.driver) / 100 - Number(totalDebt),
 *                 userId: foundedTransaction?.company,
 *                 type: "COMPANY",
 *                 superAgent: foundedTransaction?.superAgent,
 *                 driver: foundedTransaction?.driver,
 *                 company: foundedTransaction?.company,
 *                 city: foundedTransaction?.city,
 *                 phoneNumber: foundedService.company.phoneNumber,
 *                 province: foundedService.company.companyInformation.province,
 *               });
 *               await this.FinancialRepository.chargeWallet({
 *                 id: foundedCommissionManagerSchoolId,
 *                 amount: -((foundedTransaction.amount * shares.driver) / 100),
 *               });
 *             } else {
 *               await this.DebtService.createDebt({
 *                 reason: "COMPANY_DEBT_TO_DRIVER",
 *                 receiverId: foundedTransaction?.driver,
 *                 receiverType: "DRIVER",
 *                 superAgent: foundedTransaction?.superAgent,
 *                 driver: foundedTransaction?.driver,
 *                 student: foundedTransaction?.student,
 *                 service: foundedTransaction?.service,
 *                 company: foundedTransaction?.company,
 *                 city: foundedTransaction?.city,
 *                 amount: (foundedTransaction.amount * shares.driver) / 100,
 *                 factorsList: foundedTransaction?.factorsList,
 *                 description: "یدهی شرکت به راننده",
 *                 name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *                 driverPhoneNumber: foundedService.driver.phoneNumber,
 *                 studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *               });
 *               this.WithdrawalService.createWithdrawal({
 *                 amount: (foundedTransaction.amount * shares.driver) / 100,
 *                 userId: foundedTransaction?.company,
 *                 type: "COMPANY",
 *                 superAgent: foundedTransaction?.superAgent,
 *                 driver: foundedTransaction?.driver,
 *                 company: foundedTransaction?.company,
 *                 city: foundedTransaction?.city,
 *                 phoneNumber: foundedService.company.phoneNumber,
 *                 province: foundedService.company.companyInformation.province,
 *               });
 *             }
 *           } else {
 *             await this.DebtService.createDebt({
 *               reason: "COMPANY_DEBT_TO_DRIVER",
 *               receiverId: foundedTransaction?.driver,
 *               receiverType: "DRIVER",
 *               superAgent: foundedTransaction?.superAgent,
 *               driver: foundedTransaction?.driver,
 *               student: foundedTransaction?.student,
 *               service: foundedTransaction?.service,
 *               company: foundedTransaction?.company,
 *               city: foundedTransaction?.city,
 *               amount: (foundedTransaction.amount * shares.driver) / 100,
 *               factorsList: foundedTransaction?.factorsList,
 *               description: "یدهی شرکت به راننده",
 *               name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *               driverPhoneNumber: foundedService.driver.phoneNumber,
 *               studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *             });
 *             this.WithdrawalService.createWithdrawal({
 *               amount: (foundedTransaction.amount * shares.driver) / 100,
 *               userId: foundedTransaction?.company,
 *               type: "COMPANY",
 *               superAgent: foundedTransaction?.superAgent,
 *               driver: foundedTransaction?.driver,
 *               company: foundedTransaction?.company,
 *               city: foundedTransaction?.city,
 *               phoneNumber: foundedService.company.phoneNumber,
 *               province: foundedService.company.companyInformation.province,
 *             });
 *           }
 *         }
 *
 *         // TAX
 *         if (foundedTransaction?.driver) {
 *           await this.internalMoneyTransfer({
 *             reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *             payerId: foundedCommissionManagerSchoolId,
 *             payerType: "COMMISSION_MANAGER_SCHOOL",
 *             receiverId: foundedTaxId,
 *             receiverType: "TAX",
 *             amount: (foundedTransaction.amount * shares.tax) / 100,
 *             subscribe: foundedTransaction._id,
 *           });
 *         }
 *         break;
 *
 *       case "DRIVER":
 *         // //* send message to passenger
 *         // Api.sendMessageChapar({
 *         //   userId: foundedTransaction.parent,
 *         //   message: Message.SUBSCRIPTION_PARRENT_SMS,
 *         // })
 *         // //* send message to Driver
 *         // Api.sendMessageChapar({
 *         //   userId: foundedTransaction.parent,
 *         //   message: Message.SUBSCRIPTION_DRIVER_SMS,
 *         // })
 *         console.log({beforeChangeAmount: foundedTransaction.amount});
 *
 *         await this.FinancialRepository.chargeWallet({
 *           id: foundedTransaction.payerId,
 *           amount: -(calculateOnePersent * shares.driver),
 *         });
 *         console.log({calculateOnePersent});
 *         // COMMISSION_MANAGER_SCHOOL
 *
 *         console.log({poliKeAzDriverKamMishe: foundedTransaction.amount - (foundedTransaction.amount * shares.driver) / 100});
 *         await this.internalMoneyTransfer({
 *           reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *           payerId: foundedTransaction.payerId,
 *           payerType: "DRIVER",
 *           receiverId: foundedCommissionManagerSchoolId,
 *           receiverType: "COMMISSION_MANAGER_SCHOOL",
 *           amount: foundedTransaction.amount - calculateOnePersent * shares.driver,
 *           subscribe: foundedTransaction._id,
 *         });
 *
 *         // BANK_SCHOOL
 *         await this.internalMoneyTransfer({
 *           reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *           payerId: foundedCommissionManagerSchoolId,
 *           payerType: "COMMISSION_MANAGER_SCHOOL",
 *           receiverId: foundedBankSchoolId,
 *           receiverType: "BANK_SCHOOL",
 *           amount: calculateOnePersent * shares.admin,
 *
 *           subscribe: foundedTransaction._id,
 *         });
 *
 *         // SUPER_AGENT
 *         if (foundedTransaction?.superAgent) {
 *           await this.internalMoneyTransfer({
 *             reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *             payerId: foundedCommissionManagerSchoolId,
 *             payerType: "COMMISSION_MANAGER_SCHOOL",
 *             receiverId: foundedTransaction?.superAgent,
 *             receiverType: "SUPER_AGENT_SCHOOL",
 *             amount: calculateOnePersent * shares.superAgent,
 *
 *             subscribe: foundedTransaction._id,
 *           });
 *         }
 *
 *         // COMPANY
 *         if (foundedTransaction?.company) {
 *           this.WithdrawalService.createWithdrawal({
 *             amount: calculateOnePersent * shares.company,
 *
 *             userId: foundedTransaction?.company,
 *             type: "COMPANY",
 *             superAgent: foundedTransaction?.superAgent,
 *             driver: foundedTransaction?.driver,
 *             company: foundedTransaction?.company,
 *             city: foundedTransaction?.city,
 *             phoneNumber: foundedService.company.phoneNumber,
 *             province: foundedService.company.companyInformation.province,
 *           });
 *           await this.internalMoneyTransfer({
 *             reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *             payerId: foundedCommissionManagerSchoolId,
 *             payerType: "COMMISSION_MANAGER_SCHOOL",
 *             receiverId: foundedTransaction?.company,
 *             receiverType: "COMPANY",
 *             amount: calculateOnePersent * shares.company,
 *
 *             subscribe: foundedTransaction._id,
 *             isForCompanyProfit: true,
 *           });
 *         }
 *
 *         // TAX
 *         if (foundedTransaction?.driver) {
 *           await this.internalMoneyTransfer({
 *             reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *             payerId: foundedCommissionManagerSchoolId,
 *             payerType: "COMMISSION_MANAGER_SCHOOL",
 *             receiverId: foundedTaxId,
 *             receiverType: "TAX",
 *             amount: calculateOnePersent * shares.tax,
 *
 *             subscribe: foundedTransaction._id,
 *           });
 *         }
 *         break;
 *
 *       case "COMPANY":
 *         // //* send message to passenger
 *         // Api.sendMessageChapar({
 *         //   userId: foundedTransaction.parent,
 *         //   message: Message.SUBSCRIPTION_PARRENT_SMS,
 *         // })
 *         // //* send message to COMPANY
 *         // Api.sendMessageChapar({
 *         //   userId: foundedTransaction.company,
 *         //   message: Message.SUBSCRIPTION_DRIVER_COMPANY,
 *         // })
 *
 *         //!check pay offline or online
 *         if (foundedTransaction?.payerOriginType === "DRIVER" || foundedTransaction?.payerOriginType === "PASSENGER") {
 *           // foundedTransaction.amount - ((foundedTransaction.amount / 100) * shares.company + (foundedTransaction.amount / 100) * shares.driver)
 *           const checkWallet = await this.FinancialRepository.checkWallet({
 *             id: foundedTransaction.payerId,
 *             amount: foundedTransaction.amount - (calculateOnePersent * shares.company + calculateOnePersent * shares.driver),
 *           });
 *           if (checkWallet) {
 *             this.FinancialRepository.chargeWalletCompany({
 *               id: foundedTransaction.payerId,
 *               amount: Number(calculateOnePersent * shares.company),
 *             });
 *
 *             if (foundedTransaction.amount - (calculateOnePersent * shares.company + calculateOnePersent * shares.driver) > 0)
 *               await this.internalMoneyTransfer({
 *                 reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *                 payerId: foundedTransaction.payerId,
 *                 payerType: "COMPANY",
 *                 receiverId: foundedCommissionManagerSchoolId,
 *                 receiverType: "COMMISSION_MANAGER_SCHOOL",
 *                 amount: foundedTransaction.amount - (calculateOnePersent * shares.company + calculateOnePersent * shares.driver),
 *                 subscribe: foundedTransaction._id,
 *               });
 *
 *             // BANK_SCHOOL
 *             if (calculateOnePersent * shares.admin > 0)
 *               await this.internalMoneyTransfer({
 *                 reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *                 payerId: foundedCommissionManagerSchoolId,
 *                 payerType: "COMMISSION_MANAGER_SCHOOL",
 *                 receiverId: foundedBankSchoolId,
 *                 receiverType: "BANK_SCHOOL",
 *                 amount: calculateOnePersent * shares.admin,
 *                 subscribe: foundedTransaction._id,
 *               });
 *
 *             // SUPER_AGENT
 *             if (foundedTransaction?.superAgent) {
 *               await this.internalMoneyTransfer({
 *                 reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *                 payerId: foundedCommissionManagerSchoolId,
 *                 payerType: "COMMISSION_MANAGER_SCHOOL",
 *                 receiverId: foundedTransaction?.superAgent,
 *                 receiverType: "SUPER_AGENT_SCHOOL",
 *                 amount: calculateOnePersent * shares.superAgent,
 *                 subscribe: foundedTransaction._id,
 *               });
 *             }
 *
 *             // TAX
 *             await this.internalMoneyTransfer({
 *               reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *               payerId: foundedCommissionManagerSchoolId,
 *               payerType: "COMMISSION_MANAGER_SCHOOL",
 *               receiverId: foundedTaxId,
 *               receiverType: "TAX",
 *               amount: calculateOnePersent * shares.tax,
 *               subscribe: foundedTransaction._id,
 *             });
 *
 *             if (foundedTransaction?.payerOriginType === "PASSENGER") {
 *               await this.DebtService.createDebt({
 *                 reason: "COMPANY_DEBT_TO_DRIVER",
 *                 receiverId: foundedTransaction?.driver,
 *                 receiverType: "DRIVER",
 *                 superAgent: foundedTransaction?.superAgent,
 *                 driver: foundedTransaction?.driver,
 *                 student: foundedTransaction?.student,
 *                 service: foundedTransaction?.service,
 *                 company: foundedTransaction?.company,
 *                 city: foundedTransaction?.city,
 *                 amount: calculateOnePersent * shares.driver,
 *                 factorsList: foundedTransaction?.factorsList,
 *                 description: "یدهی شرکت به راننده",
 *                 name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *                 driverPhoneNumber: foundedService.driver.phoneNumber,
 *                 studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *               });
 *             } else {
 *               await this.DebtService.createDebt({
 *                 reason: "COMPANY_DEBT_TO_DRIVER",
 *                 status: "SUCCESS",
 *                 receiverId: foundedTransaction?.driver,
 *                 receiverType: "DRIVER",
 *                 superAgent: foundedTransaction?.superAgent,
 *                 driver: foundedTransaction?.driver,
 *                 student: foundedTransaction?.student,
 *                 service: foundedTransaction?.service,
 *                 company: foundedTransaction?.company,
 *                 city: foundedTransaction?.city,
 *                 amount: calculateOnePersent * shares.driver,
 *                 factorsList: foundedTransaction?.factorsList,
 *                 description: "یدهی شرکت به راننده",
 *                 name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *                 driverPhoneNumber: foundedService.driver.phoneNumber,
 *                 studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *               });
 *             }
 *           } else {
 *             // this.FinancialRepository.chargeWalletCompany({ id: foundedTransaction.payerId, amount: Number((foundedTransaction.amount * shares.company) / 100) })
 *
 *             // BANK_SCHOOL
 *             await this.DebtService.createDebt({
 *               reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
 *               receiverId: foundedBankSchoolId,
 *               receiverType: "BANK_SCHOOL",
 *               payerId: foundedTransaction.payerId,
 *               payerType: "COMPANY",
 *               amount: calculateOnePersent * shares.admin,
 *               subscribe: foundedTransaction._id,
 *               description: "یدهی شرکت به اپلیکیشن",
 *               superAgent: foundedTransaction?.superAgent,
 *               driver: foundedTransaction?.driver,
 *               student: foundedTransaction?.student,
 *               service: foundedTransaction?.service,
 *               company: foundedTransaction?.company,
 *               city: foundedTransaction?.city,
 *               factorsList: foundedTransaction?.factorsList,
 *               name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *               driverPhoneNumber: foundedService.driver.phoneNumber,
 *               studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *             });
 *
 *             // SUPER_AGENT
 *             await this.DebtService.createDebt({
 *               reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
 *               receiverId: foundedTransaction?.superAgent,
 *               receiverType: "SUPER_AGENT_SCHOOL",
 *               payerId: foundedTransaction.payerId,
 *               payerType: "COMPANY",
 *               amount: calculateOnePersent * shares.superAgent,
 *               subscribe: foundedTransaction._id,
 *               description: "یدهی شرکت به اموزش پرورش",
 *               superAgent: foundedTransaction?.superAgent,
 *               driver: foundedTransaction?.driver,
 *               student: foundedTransaction?.student,
 *               service: foundedTransaction?.service,
 *               company: foundedTransaction?.company,
 *               city: foundedTransaction?.city,
 *               factorsList: foundedTransaction?.factorsList,
 *               name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *               driverPhoneNumber: foundedService.driver.phoneNumber,
 *               studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *             });
 *
 *             // TAX
 *             await this.DebtService.createDebt({
 *               reason: "COMPANY_DEBT_FOR_SERVICE_SUBSCRIPTION_COMMISSION",
 *               receiverId: foundedTaxId,
 *               receiverType: "TAX",
 *               payerId: foundedTransaction.payerId,
 *               payerType: "COMPANY",
 *               amount: calculateOnePersent * shares.tax,
 *               subscribe: foundedTransaction._id,
 *               description: "یدهی شرکت به مالیات",
 *               superAgent: foundedTransaction?.superAgent,
 *               driver: foundedTransaction?.driver,
 *               student: foundedTransaction?.student,
 *               service: foundedTransaction?.service,
 *               company: foundedTransaction?.company,
 *               city: foundedTransaction?.city,
 *               factorsList: foundedTransaction?.factorsList,
 *               name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *               driverPhoneNumber: foundedService.driver.phoneNumber,
 *               studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *             });
 *
 *             if (foundedTransaction?.payerOriginType === "PASSENGER") {
 *               await this.DebtService.createDebt({
 *                 reason: "COMPANY_DEBT_TO_DRIVER",
 *                 receiverId: foundedTransaction?.driver,
 *                 receiverType: "DRIVER",
 *                 superAgent: foundedTransaction?.superAgent,
 *                 driver: foundedTransaction?.driver,
 *                 student: foundedTransaction?.student,
 *                 service: foundedTransaction?.service,
 *                 company: foundedTransaction?.company,
 *                 city: foundedTransaction?.city,
 *                 amount: calculateOnePersent * shares.driver,
 *                 factorsList: foundedTransaction?.factorsList,
 *                 description: "یدهی شرکت به راننده",
 *                 name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *                 driverPhoneNumber: foundedService.driver.phoneNumber,
 *                 studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *               });
 *             } else {
 *               await this.DebtService.createDebt({
 *                 reason: "COMPANY_DEBT_TO_DRIVER",
 *                 status: "SUCCESS",
 *                 receiverId: foundedTransaction?.driver,
 *                 receiverType: "DRIVER",
 *                 superAgent: foundedTransaction?.superAgent,
 *                 driver: foundedTransaction?.driver,
 *                 student: foundedTransaction?.student,
 *                 service: foundedTransaction?.service,
 *                 company: foundedTransaction?.company,
 *                 city: foundedTransaction?.city,
 *                 amount: calculateOnePersent * shares.driver,
 *                 factorsList: foundedTransaction?.factorsList,
 *                 description: "یدهی شرکت به راننده",
 *                 name: `${foundedService?.driver?.firstName} ${foundedService?.driver?.lastName}`,
 *                 driverPhoneNumber: foundedService.driver.phoneNumber,
 *                 studentName: `${foundedService?.student?.firstName} ${foundedService?.student?.lastName}`,
 *               });
 *             }
 *           }
 *
 *           //
 *         } else {
 *           await this.FinancialRepository.chargeWallet({
 *             id: foundedTransaction.payerId,
 *             amount: -(calculateOnePersent * shares.company + calculateOnePersent * shares.driver),
 *           });
 *
 *           // COMMISSION_MANAGER_SCHOOL
 *           await this.internalMoneyTransfer({
 *             reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *             payerId: foundedTransaction.payerId,
 *             payerType: "COMPANY",
 *             receiverId: foundedCommissionManagerSchoolId,
 *             receiverType: "COMMISSION_MANAGER_SCHOOL",
 *             amount:
 *               foundedTransaction.amount - (foundedTransaction.amount * shares.driver) / 100 - (foundedTransaction.amount * shares.company) / 100,
 *             subscribe: foundedTransaction._id,
 *           });
 *
 *           // BANK_SCHOOL
 *           await this.internalMoneyTransfer({
 *             reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *             payerId: foundedCommissionManagerSchoolId,
 *             payerType: "COMMISSION_MANAGER_SCHOOL",
 *             receiverId: foundedBankSchoolId,
 *             receiverType: "BANK_SCHOOL",
 *             amount: (foundedTransaction.amount * shares.admin) / 100,
 *             subscribe: foundedTransaction._id,
 *           });
 *
 *           // SUPER_AGENT
 *           if (foundedTransaction?.superAgent) {
 *             await this.internalMoneyTransfer({
 *               reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *               payerId: foundedCommissionManagerSchoolId,
 *               payerType: "COMMISSION_MANAGER_SCHOOL",
 *               receiverId: foundedTransaction?.superAgent,
 *               receiverType: "SUPER_AGENT_SCHOOL",
 *               amount: (foundedTransaction.amount * shares.superAgent) / 100,
 *               subscribe: foundedTransaction._id,
 *             });
 *           }
 *
 *           // TAX
 *           if (foundedTransaction?.driver) {
 *             await this.internalMoneyTransfer({
 *               reason: "SERVICE_SUBSCRIPTION_COMMISSION",
 *               payerId: foundedCommissionManagerSchoolId,
 *               payerType: "COMMISSION_MANAGER_SCHOOL",
 *               receiverId: foundedTaxId,
 *               receiverType: "TAX",
 *               amount: (foundedTransaction.amount * shares.tax) / 100,
 *               subscribe: foundedTransaction._id,
 *             });
 *           }
 *         }
 *
 *         break;
 *     }
 *
 *     return true;
 *   }
 */
