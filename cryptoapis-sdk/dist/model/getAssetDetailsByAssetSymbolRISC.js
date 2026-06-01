"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbolRISC = void 0;
var GetAssetDetailsByAssetSymbolRISC = (function () {
    function GetAssetDetailsByAssetSymbolRISC() {
    }
    GetAssetDetailsByAssetSymbolRISC.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbolRISC.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbolRISC.discriminator = undefined;
    GetAssetDetailsByAssetSymbolRISC.attributeTypeMap = [
        {
            "name": "_1hourPriceChangeInPercentage",
            "baseName": "1HourPriceChangeInPercentage",
            "type": "string"
        },
        {
            "name": "_1weekPriceChangeInPercentage",
            "baseName": "1WeekPriceChangeInPercentage",
            "type": "string"
        },
        {
            "name": "_24hoursPriceChangeInPercentage",
            "baseName": "24HoursPriceChangeInPercentage",
            "type": "string"
        },
        {
            "name": "_24hoursTradingVolume",
            "baseName": "24HoursTradingVolume",
            "type": "string"
        },
        {
            "name": "circulatingSupply",
            "baseName": "circulatingSupply",
            "type": "string"
        },
        {
            "name": "marketCapInUSD",
            "baseName": "marketCapInUSD",
            "type": "string"
        },
        {
            "name": "maxSupply",
            "baseName": "maxSupply",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "GetAssetDetailsByAssetSymbolRISC.TypeEnum"
        }
    ];
    return GetAssetDetailsByAssetSymbolRISC;
}());
exports.GetAssetDetailsByAssetSymbolRISC = GetAssetDetailsByAssetSymbolRISC;
(function (GetAssetDetailsByAssetSymbolRISC) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Coin"] = 'coin'] = "Coin";
        TypeEnum[TypeEnum["Token"] = 'token'] = "Token";
    })(TypeEnum = GetAssetDetailsByAssetSymbolRISC.TypeEnum || (GetAssetDetailsByAssetSymbolRISC.TypeEnum = {}));
})(GetAssetDetailsByAssetSymbolRISC || (exports.GetAssetDetailsByAssetSymbolRISC = GetAssetDetailsByAssetSymbolRISC = {}));
//# sourceMappingURL=getAssetDetailsByAssetSymbolRISC.js.map