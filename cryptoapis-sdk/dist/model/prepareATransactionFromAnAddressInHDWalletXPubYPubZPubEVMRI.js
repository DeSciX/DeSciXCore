"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI = void 0;
var PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI = (function () {
    function PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI() {
    }
    PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI.getAttributeTypeMap = function () {
        return PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI.attributeTypeMap;
    };
    PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI.discriminator = undefined;
    PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI.attributeTypeMap = [
        {
            "name": "derivationIndex",
            "baseName": "derivationIndex",
            "type": "number"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRIFee"
        },
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "number"
        },
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
            "name": "sigHash",
            "baseName": "sigHash",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRIValue"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI.TypeEnum"
        }
    ];
    return PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI;
}());
exports.PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI;
(function (PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["LegacyTransaction"] = 'legacy-transaction'] = "LegacyTransaction";
        TypeEnum[TypeEnum["AccessListTransaction"] = 'access-list-transaction'] = "AccessListTransaction";
        TypeEnum[TypeEnum["GasFeeMarketTransaction"] = 'gas-fee-market-transaction'] = "GasFeeMarketTransaction";
    })(TypeEnum = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI.TypeEnum || (PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI.TypeEnum = {}));
})(PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI || (exports.PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI = {}));
//# sourceMappingURL=prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI.js.map