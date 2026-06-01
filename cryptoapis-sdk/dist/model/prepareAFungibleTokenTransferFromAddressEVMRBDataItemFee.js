"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee = void 0;
var PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee = (function () {
    function PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee() {
    }
    PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee.getAttributeTypeMap = function () {
        return PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee.attributeTypeMap;
    };
    PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee.discriminator = undefined;
    PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee.attributeTypeMap = [
        {
            "name": "exactAmount",
            "baseName": "exactAmount",
            "type": "string"
        },
        {
            "name": "priority",
            "baseName": "priority",
            "type": "PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee.PriorityEnum"
        }
    ];
    return PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee;
}());
exports.PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee = PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee;
(function (PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee) {
    var PriorityEnum;
    (function (PriorityEnum) {
        PriorityEnum[PriorityEnum["Slow"] = 'slow'] = "Slow";
        PriorityEnum[PriorityEnum["Standard"] = 'standard'] = "Standard";
        PriorityEnum[PriorityEnum["Fast"] = 'fast'] = "Fast";
    })(PriorityEnum = PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee.PriorityEnum || (PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee.PriorityEnum = {}));
})(PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee || (exports.PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee = PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee = {}));
//# sourceMappingURL=prepareAFungibleTokenTransferFromAddressEVMRBDataItemFee.js.map