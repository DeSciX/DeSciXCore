"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee = void 0;
var PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee = (function () {
    function PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee() {
    }
    PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee.getAttributeTypeMap = function () {
        return PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee.attributeTypeMap;
    };
    PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee.discriminator = undefined;
    PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee.attributeTypeMap = [
        {
            "name": "exactAmount",
            "baseName": "exactAmount",
            "type": "string"
        },
        {
            "name": "priority",
            "baseName": "priority",
            "type": "PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee.PriorityEnum"
        }
    ];
    return PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee;
}());
exports.PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee;
(function (PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee) {
    var PriorityEnum;
    (function (PriorityEnum) {
        PriorityEnum[PriorityEnum["Slow"] = 'slow'] = "Slow";
        PriorityEnum[PriorityEnum["Standard"] = 'standard'] = "Standard";
        PriorityEnum[PriorityEnum["Fast"] = 'fast'] = "Fast";
    })(PriorityEnum = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee.PriorityEnum || (PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee.PriorityEnum = {}));
})(PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee || (exports.PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee = PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee = {}));
//# sourceMappingURL=prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee.js.map