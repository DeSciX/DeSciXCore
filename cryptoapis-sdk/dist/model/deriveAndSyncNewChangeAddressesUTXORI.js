"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewChangeAddressesUTXORI = void 0;
var DeriveAndSyncNewChangeAddressesUTXORI = (function () {
    function DeriveAndSyncNewChangeAddressesUTXORI() {
    }
    DeriveAndSyncNewChangeAddressesUTXORI.getAttributeTypeMap = function () {
        return DeriveAndSyncNewChangeAddressesUTXORI.attributeTypeMap;
    };
    DeriveAndSyncNewChangeAddressesUTXORI.discriminator = undefined;
    DeriveAndSyncNewChangeAddressesUTXORI.attributeTypeMap = [
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
            "type": "DeriveAndSyncNewChangeAddressesUTXORI.DerivationTypeEnum"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "DeriveAndSyncNewChangeAddressesUTXORI.TypeEnum"
        }
    ];
    return DeriveAndSyncNewChangeAddressesUTXORI;
}());
exports.DeriveAndSyncNewChangeAddressesUTXORI = DeriveAndSyncNewChangeAddressesUTXORI;
(function (DeriveAndSyncNewChangeAddressesUTXORI) {
    var DerivationTypeEnum;
    (function (DerivationTypeEnum) {
        DerivationTypeEnum[DerivationTypeEnum["Account"] = 'account'] = "Account";
        DerivationTypeEnum[DerivationTypeEnum["Bip32"] = 'bip32'] = "Bip32";
    })(DerivationTypeEnum = DeriveAndSyncNewChangeAddressesUTXORI.DerivationTypeEnum || (DeriveAndSyncNewChangeAddressesUTXORI.DerivationTypeEnum = {}));
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Change"] = 'change'] = "Change";
    })(TypeEnum = DeriveAndSyncNewChangeAddressesUTXORI.TypeEnum || (DeriveAndSyncNewChangeAddressesUTXORI.TypeEnum = {}));
})(DeriveAndSyncNewChangeAddressesUTXORI || (exports.DeriveAndSyncNewChangeAddressesUTXORI = DeriveAndSyncNewChangeAddressesUTXORI = {}));
//# sourceMappingURL=deriveAndSyncNewChangeAddressesUTXORI.js.map