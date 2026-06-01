"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewReceivingAddressesUTXORI = void 0;
var DeriveAndSyncNewReceivingAddressesUTXORI = (function () {
    function DeriveAndSyncNewReceivingAddressesUTXORI() {
    }
    DeriveAndSyncNewReceivingAddressesUTXORI.getAttributeTypeMap = function () {
        return DeriveAndSyncNewReceivingAddressesUTXORI.attributeTypeMap;
    };
    DeriveAndSyncNewReceivingAddressesUTXORI.discriminator = undefined;
    DeriveAndSyncNewReceivingAddressesUTXORI.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewReceivingAddressesUTXORI.DerivationTypeEnum"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "DeriveAndSyncNewReceivingAddressesUTXORI.TypeEnum"
        }
    ];
    return DeriveAndSyncNewReceivingAddressesUTXORI;
}());
exports.DeriveAndSyncNewReceivingAddressesUTXORI = DeriveAndSyncNewReceivingAddressesUTXORI;
(function (DeriveAndSyncNewReceivingAddressesUTXORI) {
    var DerivationTypeEnum;
    (function (DerivationTypeEnum) {
        DerivationTypeEnum[DerivationTypeEnum["Account"] = 'account'] = "Account";
        DerivationTypeEnum[DerivationTypeEnum["Bip32"] = 'bip32'] = "Bip32";
    })(DerivationTypeEnum = DeriveAndSyncNewReceivingAddressesUTXORI.DerivationTypeEnum || (DeriveAndSyncNewReceivingAddressesUTXORI.DerivationTypeEnum = {}));
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Change"] = 'change'] = "Change";
    })(TypeEnum = DeriveAndSyncNewReceivingAddressesUTXORI.TypeEnum || (DeriveAndSyncNewReceivingAddressesUTXORI.TypeEnum = {}));
})(DeriveAndSyncNewReceivingAddressesUTXORI || (exports.DeriveAndSyncNewReceivingAddressesUTXORI = DeriveAndSyncNewReceivingAddressesUTXORI = {}));
//# sourceMappingURL=deriveAndSyncNewReceivingAddressesUTXORI.js.map