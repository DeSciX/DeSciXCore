"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssetsRISC = void 0;
var ListSupportedAssetsRISC = (function () {
    function ListSupportedAssetsRISC() {
    }
    ListSupportedAssetsRISC.getAttributeTypeMap = function () {
        return ListSupportedAssetsRISC.attributeTypeMap;
    };
    ListSupportedAssetsRISC.discriminator = undefined;
    ListSupportedAssetsRISC.attributeTypeMap = [
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
            "type": "ListSupportedAssetsRISC.TypeEnum"
        }
    ];
    return ListSupportedAssetsRISC;
}());
exports.ListSupportedAssetsRISC = ListSupportedAssetsRISC;
(function (ListSupportedAssetsRISC) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Coin"] = 'coin'] = "Coin";
        TypeEnum[TypeEnum["Token"] = 'token'] = "Token";
    })(TypeEnum = ListSupportedAssetsRISC.TypeEnum || (ListSupportedAssetsRISC.TypeEnum = {}));
})(ListSupportedAssetsRISC || (exports.ListSupportedAssetsRISC = ListSupportedAssetsRISC = {}));
//# sourceMappingURL=listSupportedAssetsRISC.js.map