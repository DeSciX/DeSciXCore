"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashSolanaRIFee = void 0;
var GetTransactionDetailsByTransactionHashSolanaRIFee = (function () {
    function GetTransactionDetailsByTransactionHashSolanaRIFee() {
    }
    GetTransactionDetailsByTransactionHashSolanaRIFee.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashSolanaRIFee.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashSolanaRIFee.discriminator = undefined;
    GetTransactionDetailsByTransactionHashSolanaRIFee.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "GetTransactionDetailsByTransactionHashSolanaRIFee.UnitEnum"
        }
    ];
    return GetTransactionDetailsByTransactionHashSolanaRIFee;
}());
exports.GetTransactionDetailsByTransactionHashSolanaRIFee = GetTransactionDetailsByTransactionHashSolanaRIFee;
(function (GetTransactionDetailsByTransactionHashSolanaRIFee) {
    var UnitEnum;
    (function (UnitEnum) {
        UnitEnum[UnitEnum["Sol"] = 'SOL'] = "Sol";
    })(UnitEnum = GetTransactionDetailsByTransactionHashSolanaRIFee.UnitEnum || (GetTransactionDetailsByTransactionHashSolanaRIFee.UnitEnum = {}));
})(GetTransactionDetailsByTransactionHashSolanaRIFee || (exports.GetTransactionDetailsByTransactionHashSolanaRIFee = GetTransactionDetailsByTransactionHashSolanaRIFee = {}));
//# sourceMappingURL=getTransactionDetailsByTransactionHashSolanaRIFee.js.map