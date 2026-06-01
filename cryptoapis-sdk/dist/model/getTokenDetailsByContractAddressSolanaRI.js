"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenDetailsByContractAddressSolanaRI = void 0;
var GetTokenDetailsByContractAddressSolanaRI = (function () {
    function GetTokenDetailsByContractAddressSolanaRI() {
    }
    GetTokenDetailsByContractAddressSolanaRI.getAttributeTypeMap = function () {
        return GetTokenDetailsByContractAddressSolanaRI.attributeTypeMap;
    };
    GetTokenDetailsByContractAddressSolanaRI.discriminator = undefined;
    GetTokenDetailsByContractAddressSolanaRI.attributeTypeMap = [
        {
            "name": "collection",
            "baseName": "collection",
            "type": "GetTokenDetailsByContractAddressSolanaRICollection"
        },
        {
            "name": "description",
            "baseName": "description",
            "type": "string"
        },
        {
            "name": "image",
            "baseName": "image",
            "type": "string"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "symbol",
            "baseName": "symbol",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "GetTokenDetailsByContractAddressSolanaRI.TypeEnum"
        },
        {
            "name": "fungibleValues",
            "baseName": "fungibleValues",
            "type": "GetTokenDetailsByContractAddressSolanaRIFungibleValues"
        }
    ];
    return GetTokenDetailsByContractAddressSolanaRI;
}());
exports.GetTokenDetailsByContractAddressSolanaRI = GetTokenDetailsByContractAddressSolanaRI;
(function (GetTokenDetailsByContractAddressSolanaRI) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Fungible"] = 'fungible'] = "Fungible";
        TypeEnum[TypeEnum["NonFungible"] = 'non-fungible'] = "NonFungible";
    })(TypeEnum = GetTokenDetailsByContractAddressSolanaRI.TypeEnum || (GetTokenDetailsByContractAddressSolanaRI.TypeEnum = {}));
})(GetTokenDetailsByContractAddressSolanaRI || (exports.GetTokenDetailsByContractAddressSolanaRI = GetTokenDetailsByContractAddressSolanaRI = {}));
//# sourceMappingURL=getTokenDetailsByContractAddressSolanaRI.js.map