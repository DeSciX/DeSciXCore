"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetIDRISC = void 0;
var GetAssetDetailsByAssetIDRISC = (function () {
    function GetAssetDetailsByAssetIDRISC() {
    }
    GetAssetDetailsByAssetIDRISC.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetIDRISC.attributeTypeMap;
    };
    GetAssetDetailsByAssetIDRISC.discriminator = undefined;
    GetAssetDetailsByAssetIDRISC.attributeTypeMap = [
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
            "type": "GetAssetDetailsByAssetIDRISC.TypeEnum"
        }
    ];
    return GetAssetDetailsByAssetIDRISC;
}());
exports.GetAssetDetailsByAssetIDRISC = GetAssetDetailsByAssetIDRISC;
(function (GetAssetDetailsByAssetIDRISC) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Coin"] = 'coin'] = "Coin";
        TypeEnum[TypeEnum["Token"] = 'token'] = "Token";
    })(TypeEnum = GetAssetDetailsByAssetIDRISC.TypeEnum || (GetAssetDetailsByAssetIDRISC.TypeEnum = {}));
})(GetAssetDetailsByAssetIDRISC || (exports.GetAssetDetailsByAssetIDRISC = GetAssetDetailsByAssetIDRISC = {}));
//# sourceMappingURL=getAssetDetailsByAssetIDRISC.js.map