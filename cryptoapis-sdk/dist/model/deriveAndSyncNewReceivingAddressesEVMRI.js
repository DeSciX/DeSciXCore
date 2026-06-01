"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesEVMRI = void 0;
var DeriveAndSyncNewReceivingAddressesEVMRI = (function () {
    function DeriveAndSyncNewReceivingAddressesEVMRI() {
    }
    DeriveAndSyncNewReceivingAddressesEVMRI.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesEVMRI.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesEVMRI.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesEVMRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "format",
            "baseName": "format",
            "type": "string"
        },
        {
            "name": "index",
            "baseName": "index",
            "type": "number"
        },
        {
            "name": "derivationType",
            "baseName": "derivationType",
            "type": "DeriveAndSyncNewReceivingAddressesEVMRI.DerivationTypeEnum"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "DeriveAndSyncNewReceivingAddressesEVMRI.TypeEnum"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesEVMRI;
}());
exports.DeriveAndSyncNewReceivingAddressesEVMRI = DeriveAndSyncNewReceivingAddressesEVMRI;
(function (DeriveAndSyncNewReceivingAddressesEVMRI) {
    var DerivationTypeEnum;
    (function (DerivationTypeEnum) {
        DerivationTypeEnum[DerivationTypeEnum["Account"] = 'account'] = "Account";
        DerivationTypeEnum[DerivationTypeEnum["Bip32"] = 'bip32'] = "Bip32";
    })(DerivationTypeEnum = DeriveAndSyncNewReceivingAddressesEVMRI.DerivationTypeEnum || (DeriveAndSyncNewReceivingAddressesEVMRI.DerivationTypeEnum = {}));
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Change"] = 'change'] = "Change";
    })(TypeEnum = DeriveAndSyncNewReceivingAddressesEVMRI.TypeEnum || (DeriveAndSyncNewReceivingAddressesEVMRI.TypeEnum = {}));
})(DeriveAndSyncNewReceivingAddressesEVMRI || (exports.DeriveAndSyncNewReceivingAddressesEVMRI = DeriveAndSyncNewReceivingAddressesEVMRI = {}));
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesEVMRI.js.map