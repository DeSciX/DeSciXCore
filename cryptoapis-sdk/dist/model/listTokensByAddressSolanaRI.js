"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSolanaRI = void 0;
var ListTokensByAddressSolanaRI = (function () {
    function ListTokensByAddressSolanaRI() {
    }
    ListTokensByAddressSolanaRI.getAttributeTypeMap = function () {
        return ListTokensByAddressSolanaRI.attributeTypeMap;
    };
    ListTokensByAddressSolanaRI.discriminator = undefined;
    ListTokensByAddressSolanaRI.attributeTypeMap = [
        {
            "name": "contractAddress",
            "baseName": "contractAddress",
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
            "name": "tokenAddress",
            "baseName": "tokenAddress",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "ListTokensByAddressSolanaRI.TypeEnum"
        },
        {
            "name": "fungibleValues",
            "baseName": "fungibleValues",
            "type": "ListTokensByAddressSolanaRIFungibleValues"
        }
    ];
    return ListTokensByAddressSolanaRI;
}());
exports.ListTokensByAddressSolanaRI = ListTokensByAddressSolanaRI;
(function (ListTokensByAddressSolanaRI) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["NonFungible"] = 'non-fungible'] = "NonFungible";
        TypeEnum[TypeEnum["Fungible"] = 'fungible'] = "Fungible";
    })(TypeEnum = ListTokensByAddressSolanaRI.TypeEnum || (ListTokensByAddressSolanaRI.TypeEnum = {}));
})(ListTokensByAddressSolanaRI || (exports.ListTokensByAddressSolanaRI = ListTokensByAddressSolanaRI = {}));
//# sourceMappingURL=listTokensByAddressSolanaRI.js.map