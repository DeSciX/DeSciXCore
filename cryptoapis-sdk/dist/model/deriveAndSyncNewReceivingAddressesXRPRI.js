"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesXRPRI = void 0;
var DeriveAndSyncNewReceivingAddressesXRPRI = (function () {
    function DeriveAndSyncNewReceivingAddressesXRPRI() {
    }
    DeriveAndSyncNewReceivingAddressesXRPRI.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesXRPRI.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesXRPRI.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesXRPRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "derivationType",
            "baseName": "derivationType",
            "type": "DeriveAndSyncNewReceivingAddressesXRPRI.DerivationTypeEnum"
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
            "name": "type",
            "baseName": "type",
            "type": "DeriveAndSyncNewReceivingAddressesXRPRI.TypeEnum"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesXRPRI;
}());
exports.DeriveAndSyncNewReceivingAddressesXRPRI = DeriveAndSyncNewReceivingAddressesXRPRI;
(function (DeriveAndSyncNewReceivingAddressesXRPRI) {
    var DerivationTypeEnum;
    (function (DerivationTypeEnum) {
        DerivationTypeEnum[DerivationTypeEnum["Account"] = 'account'] = "Account";
        DerivationTypeEnum[DerivationTypeEnum["Bip32"] = 'bip32'] = "Bip32";
    })(DerivationTypeEnum = DeriveAndSyncNewReceivingAddressesXRPRI.DerivationTypeEnum || (DeriveAndSyncNewReceivingAddressesXRPRI.DerivationTypeEnum = {}));
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Change"] = 'change'] = "Change";
    })(TypeEnum = DeriveAndSyncNewReceivingAddressesXRPRI.TypeEnum || (DeriveAndSyncNewReceivingAddressesXRPRI.TypeEnum = {}));
})(DeriveAndSyncNewReceivingAddressesXRPRI || (exports.DeriveAndSyncNewReceivingAddressesXRPRI = DeriveAndSyncNewReceivingAddressesXRPRI = {}));
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesXRPRI.js.map