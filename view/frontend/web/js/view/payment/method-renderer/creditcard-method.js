/**
 * PAYONE Magento 2 Connector is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PAYONE Magento 2 Connector is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with PAYONE Magento 2 Connector. If not, see <http://www.gnu.org/licenses/>.
 *
 * PHP version 5
 *
 * @category  Payone
 * @package   Payone_Magento2_Plugin
 * @author    FATCHIP GmbH <support@fatchip.de>
 * @copyright 2003 - 2016 Payone GmbH
 * @license   <http://www.gnu.org/licenses/> GNU Lesser General Public License
 * @link      http://www.payone.de
 */
define(
    [
        'jquery',
        'Payone_Core/js/view/payment/method-renderer/base',
        'Magento_Ui/js/model/messageList',
        'mage/translate',
        'Payone_Core/js/action/handle-redirect'
    ],
    function ($, Component, messageList, $t, handleRedirectAction) {
        'use strict';
        return Component.extend({
            defaults: {
                template: 'Payone_Core/payment/creditcard',
                firstname: '',
                lastname: '',
                pseudocardpan: ''
            },
            
            initObservable: function () {
                this._super()
                    .observe([
                        'firstname',
                        'lastname',
                        'pseudocardpan'
                    ]);
                return this;
            },
            
            getData: function () {
                return {
                    'method': this.item.method,
                    'additional_data': {
                        'firstname': this.firstname(),
                        'lastname': this.lastname(),
                        'pseudocardpan': document.getElementById(this.getCode() + '_pseudocardpan').value
                    }
                };
            },
            
            handleIframes: function () {
                var fieldconfig = window.checkoutConfig.payment.payone.fieldConfig;
                if (typeof fieldconfig.language != 'undefined') {
                    if (fieldconfig.language == 'de') {
                        fieldconfig.language = Payone.ClientApi.Language.de;
                    } else if (fieldconfig.language == 'en') {
                        fieldconfig.language = Payone.ClientApi.Language.en;
                    }
                }

                window.iframes = new Payone.ClientApi.HostedIFrames(fieldconfig, window.checkoutConfig.payment.payone.hostedRequest);
                window.iframes.setCardType("V");

                var sCardTypeId = this.getCode() + '_credit_card_type';
                if (document.getElementById(sCardTypeId)) {
                    document.getElementById(sCardTypeId).onchange = function () {
                        window.iframes.setCardType(this.value); // on change: set new type of credit card to process
                    };
                }
            },
            showCvc: function () {
                return window.checkoutConfig.payment.payone.checkCvc;
            },
            getInstructions: function () {
                return window.checkoutConfig.payment.instructions[this.item.method];
            },
            getCreditcardTypes: function () {
                return window.checkoutConfig.payment.payone.availableCardTypes;
            },
            getHostedParam: function (sParam) {
                return window.checkoutConfig.payment.payone.hostedParams[sParam];
            },
            getCcMonths: function () {
                return window.checkoutConfig.payment.ccform.months[this.getCode()];
            },
            getCcYears: function () {
                return window.checkoutConfig.payment.ccform.years[this.getCode()];
            },
            getCcMonthsValues: function () {
                return _.map(this.getCcMonths(), function (value, key) {
                    return {
                        'value': key,
                        'month': value
                    }
                });
            },
            getCcYearsValues: function () {
                return _.map(this.getCcYears(), function (value, key) {
                    return {
                        'value': key,
                        'year': value
                    };
                });
            },

            validate: function () {
                if (document.getElementById(this.getCode() + '_credit_card_type').value == '') {
                    this.messageContainer.addErrorMessage({'message': $t('Please choose the creditcard type.')});
                    return false;
                }
                if (this.firstname() == '') {
                    this.messageContainer.addErrorMessage({'message': $t('Please enter the firstname.')});
                    return false;
                }
                if (this.lastname() == '') {
                    this.messageContainer.addErrorMessage({'message': $t('Please enter the lastname.')});
                    return false;
                }
                
                // do some format validation
                if (document.getElementById(this.getCode() + '_pseudocardpan').value == '') {
                    return false;
                } else {
                    return true;
                }
            },
            
            handleCreditcardCheck: function () {
                // PayOne Request if the data is valid
                if (window.iframes.isComplete()) {
                    window.ccjs = this;
                    window.iframes.creditCardCheck('processPayoneResponseCCHosted');// Perform "CreditCardCheck" to create and get a
                    // PseudoCardPan; then call your function "payCallback"
                } else {
                    console.debug("not complete");
                }
            },
            
            processPayoneResponseCCHosted: function (response) {
                if (response.status === "VALID") {
                    if (document.getElementById(this.getCode() + '_pseudocardpan')) {
                        document.getElementById(this.getCode() + '_pseudocardpan').value = response.pseudocardpan;
                    }

                    this.selectPaymentMethod();
                    handleRedirectAction(this.getData(), this.messageContainer);
                } else if (response.status === "INVALID") {
                    this.messageContainer.addErrorMessage({'message': $t(response.errormessage)});
                } else if (response.status === "ERROR") {
                    this.messageContainer.addErrorMessage({'message': $t(response.errormessage)});
                }
            }
        });
    
    }
);

function processPayoneResponseCCHosted(response)
{
    window.ccjs.processPayoneResponseCCHosted(response);
}
