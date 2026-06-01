"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVMRI = void 0;
var PrepareTransactionFromAddressEVMRI = (function () {
    function PrepareTransactionFromAddressEVMRI() {
    }
    PrepareTransactionFromAddressEVMRI.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVMRI.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVMRI.discriminator = undefined;
    PrepareTransactionFromAddressEVMRI.attributeTypeMap = [
        {
            "name": "inputData",
            "baseName": "inputData",
            "type": "string"
        },
        {
            "name": "nonce",
            "baseName": "nonce",
            "type": "number"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        },
        {
            "name": "sighash",
            "baseName": "sighash",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "PrepareTransactionFromAddressEVMRIValue"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "PrepareTransactionFromAddressEVMRIFee"
        },
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "PrepareTransactionFromAddressEVMRI.TypeEnum"
        }
    ];
    return PrepareTransactionFromAddressEVMRI;
}());
exports.PrepareTransactionFromAddressEVMRI = PrepareTransactionFromAddressEVMRI;
(function (PrepareTransactionFromAddressEVMRI) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["LegacyTransaction"] = 'legacy-transaction'] = "LegacyTransaction";
        TypeEnum[TypeEnum["AccessListTransaction"] = 'access-list-transaction'] = "AccessListTransaction";
        TypeEnum[TypeEnum["GasFeeMarketTransaction"] = 'gas-fee-market-transaction'] = "GasFeeMarketTransaction";
    })(TypeEnum = PrepareTransactionFromAddressEVMRI.TypeEnum || (PrepareTransactionFromAddressEVMRI.TypeEnum = {}));
})(PrepareTransactionFromAddressEVMRI || (exports.PrepareTransactionFromAddressEVMRI = PrepareTransactionFromAddressEVMRI = {}));
//# sourceMappingURL=prepareTransactionFromAddressEVMRI.js.map