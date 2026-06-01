"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbolRI = void 0;
var GetAssetDetailsByAssetSymbolRI = (function () {
    function GetAssetDetailsByAssetSymbolRI() {
    }
    GetAssetDetailsByAssetSymbolRI.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbolRI.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbolRI.discriminator = undefined;
    GetAssetDetailsByAssetSymbolRI.attributeTypeMap = [
        {
            "name": "contracts",
            "baseName": "contracts",
            "type": "Array<GetAssetDetailsByAssetIDRIContractsInner>"
        },
        {
            "name": "latestRate",
            "baseName": "latestRate",
            "type": "ListSupportedAssetsRILatestRate"
        },
        {
            "name": "logo",
            "baseName": "logo",
            "type": "ListSupportedAssetsRILogo"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "originalSymbol",
            "baseName": "originalSymbol",
            "type": "string"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        },
        {
            "name": "slug",
            "baseName": "slug",
            "type": "string"
        },
        {
            "name": "specificData",
            "baseName": "specificData",
            "type": "GetAssetDetailsByAssetSymbolRIS"
        },
        {
            "name": "symbol",
            "baseName": "symbol",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "GetAssetDetailsByAssetSymbolRI.TypeEnum"
        }
    ];
    return GetAssetDetailsByAssetSymbolRI;
}());
exports.GetAssetDetailsByAssetSymbolRI = GetAssetDetailsByAssetSymbolRI;
(function (GetAssetDetailsByAssetSymbolRI) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Fiat"] = 'fiat'] = "Fiat";
        TypeEnum[TypeEnum["Crypto"] = 'crypto'] = "Crypto";
    })(TypeEnum = GetAssetDetailsByAssetSymbolRI.TypeEnum || (GetAssetDetailsByAssetSymbolRI.TypeEnum = {}));
})(GetAssetDetailsByAssetSymbolRI || (exports.GetAssetDetailsByAssetSymbolRI = GetAssetDetailsByAssetSymbolRI = {}));
//# sourceMappingURL=getAssetDetailsByAssetSymbolRI.js.map