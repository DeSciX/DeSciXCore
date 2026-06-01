"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee = void 0;
var PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee = (function () {
    function PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee() {
    }
    PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee.getAttributeTypeMap = function () {
        return PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee.attributeTypeMap;
    };
    PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee.discriminator = undefined;
    PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee.attributeTypeMap = [
        {
            "name": "exactAmount",
            "baseName": "exactAmount",
            "type": "string"
        },
        {
            "name": "priority",
            "baseName": "priority",
            "type": "PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee.PriorityEnum"
        }
    ];
    return PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee;
}());
exports.PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee = PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee;
(function (PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee) {
    var PriorityEnum;
    (function (PriorityEnum) {
        PriorityEnum[PriorityEnum["Slow"] = 'slow'] = "Slow";
        PriorityEnum[PriorityEnum["Standard"] = 'standard'] = "Standard";
        PriorityEnum[PriorityEnum["Fast"] = 'fast'] = "Fast";
    })(PriorityEnum = PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee.PriorityEnum || (PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee.PriorityEnum = {}));
})(PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee || (exports.PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee = PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee = {}));
//# sourceMappingURL=prepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee.js.map