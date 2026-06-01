"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVMRBDataItemFee = void 0;
var PrepareTransactionFromAddressEVMRBDataItemFee = (function () {
    function PrepareTransactionFromAddressEVMRBDataItemFee() {
    }
    PrepareTransactionFromAddressEVMRBDataItemFee.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVMRBDataItemFee.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVMRBDataItemFee.discriminator = undefined;
    PrepareTransactionFromAddressEVMRBDataItemFee.attributeTypeMap = [
        {
            "name": "exactAmount",
            "baseName": "exactAmount",
            "type": "string"
        },
        {
            "name": "priority",
            "baseName": "priority",
            "type": "PrepareTransactionFromAddressEVMRBDataItemFee.PriorityEnum"
        },
        {
            "name": "substractFromAmount",
            "baseName": "substractFromAmount",
            "type": "boolean"
        }
    ];
    return PrepareTransactionFromAddressEVMRBDataItemFee;
}());
exports.PrepareTransactionFromAddressEVMRBDataItemFee = PrepareTransactionFromAddressEVMRBDataItemFee;
(function (PrepareTransactionFromAddressEVMRBDataItemFee) {
    var PriorityEnum;
    (function (PriorityEnum) {
        PriorityEnum[PriorityEnum["Slow"] = 'slow'] = "Slow";
        PriorityEnum[PriorityEnum["Standard"] = 'standard'] = "Standard";
        PriorityEnum[PriorityEnum["Fast"] = 'fast'] = "Fast";
    })(PriorityEnum = PrepareTransactionFromAddressEVMRBDataItemFee.PriorityEnum || (PrepareTransactionFromAddressEVMRBDataItemFee.PriorityEnum = {}));
})(PrepareTransactionFromAddressEVMRBDataItemFee || (exports.PrepareTransactionFromAddressEVMRBDataItemFee = PrepareTransactionFromAddressEVMRBDataItemFee = {}));
//# sourceMappingURL=prepareTransactionFromAddressEVMRBDataItemFee.js.map