
        
        function calculateRelative() {
    const relative =
        Number(document.getElementById("relative").value);

    const finalVolume =
        Number(document.getElementById("finalVolume").value);

    const unit =
        document.getElementById("volumeUnit").value;

    const result =
        document.getElementById("relativeResult");

    if (
        !Number.isFinite(relative) || !Number.isFinite(finalVolume) ||
        relative <= 0 ||
        relative > 1 ||
        finalVolume <= 0
    ) {
        result.innerHTML =
            "相対濃度は0より大きく1以下、最終液量は0より大きい値を入力してください。";
        return;
    }

    const dilution = 1 / relative;
    const stockVolume = finalVolume * relative;
    const solventVolume = finalVolume - stockVolume;

    result.innerHTML = `
        ${dilution}倍希釈です<br>
        原液：${stockVolume} ${unit}<br>
        溶媒：${solventVolume} ${unit}
    `;
}

    function convertConcentrationToM(value, unit) {
    const factors = {
        M: 1,
        mM: 0.001,
        uM: 0.000001
    };

    return value * factors[unit];
}

function convertVolumeToL(value, unit) {
    const factors = {
        L: 1,
        mL: 0.001,
        uL: 0.000001
    };

    return value * factors[unit];
}

function calculateNormal() {
    const stockValue =
        Number(document.getElementById("stock").value);

    const targetValue =
        Number(document.getElementById("target").value);

    const finalVolumeValue =
        Number(document.getElementById("finalVolumeNormal").value);

    const stockUnit =
        document.getElementById("stockUnit").value;

    const targetUnit =
        document.getElementById("targetUnit").value;

    const finalVolumeUnit =
        document.getElementById("finalVolumeUnit").value;

    const result =
        document.getElementById("normalResult");

    if (
        ![stockValue, targetValue, finalVolumeValue].every(Number.isFinite) ||
        stockValue <= 0 ||
        targetValue <= 0 ||
        finalVolumeValue <= 0
    ) {
        result.innerHTML =
            "すべての項目に0より大きい値を入力してください。";
        return;
    }

    const stockM =
        convertConcentrationToM(stockValue, stockUnit);

    const targetM =
        convertConcentrationToM(targetValue, targetUnit);

    const finalVolumeL =
        convertVolumeToL(finalVolumeValue, finalVolumeUnit);

    if (targetM > stockM) {
        result.innerHTML =
            "目的濃度が原液濃度を上回っています。希釈では作れません。";
        return;
    }

    const dilutionFactor = stockM / targetM;

    const stockVolumeL =
        (targetM * finalVolumeL) / stockM;

    const solventVolumeL =
        finalVolumeL - stockVolumeL;

    const outputFactor = {
        L: 1,
        mL: 1000,
        uL: 1000000
    };

    const stockVolume =
        stockVolumeL * outputFactor[finalVolumeUnit];

    const solventVolume =
        solventVolumeL * outputFactor[finalVolumeUnit];

    const displayUnit =
        finalVolumeUnit === "uL" ? "µL" : finalVolumeUnit;

   let stockVolumeInMicroLiter;

if (finalVolumeUnit === "L") {
    stockVolumeInMicroLiter = stockVolume * 1000000;
} else if (finalVolumeUnit === "mL") {
    stockVolumeInMicroLiter = stockVolume * 1000;
} else {
    stockVolumeInMicroLiter = stockVolume;
}

let warningClass = "result-ok";
let warningMessage = "";

if (stockVolumeInMicroLiter < 2) {
    warningClass = "result-danger";
    warningMessage =
        "🔴 2 µL未満です。使用するピペットの対応範囲を確認してください。段階希釈を検討してください。";
} else if (stockVolumeInMicroLiter < 20) {
    warningClass = "result-warning";
    warningMessage =
        "🟡 少量操作です。ピペッティング誤差に注意してください。";
} else {
    warningClass = "result-ok";
    warningMessage =
        "🟢 使用するピペットの対応範囲を確認してください。";
}

result.className = `result ${warningClass}`;

result.innerHTML = `
    <strong>希釈倍率</strong><br>
    ${formatNumber(dilutionFactor)}倍<br><br>

    <strong>必要な原液量</strong><br>
    ${formatNumber(stockVolume)} ${displayUnit}<br><br>

    <strong>必要な溶媒量</strong><br>
    ${formatNumber(solventVolume)} ${displayUnit}<br><br>

    <strong>ピペット量判定</strong><br>
    ${warningMessage}
`;
}

function formatNumber(value) {
    return Number(value.toFixed(6)).toString();
}
function calculateSerialDilution() {
    const steps =
        Number(document.getElementById("serialSteps").value);

    const factor =
        Number(document.getElementById("serialFactor").value);

    const intermediateUse =
        Number(document.getElementById("intermediateUse").value);

    const finalRequired =
        Number(document.getElementById("finalRequired").value);

    const extraVolume =
        Number(document.getElementById("extraVolume").value);

    const volumeUnit =
        document.getElementById("serialVolumeUnit").value;

    const result =
        document.getElementById("serialResult");

    if (
        ![steps, factor, intermediateUse, finalRequired, extraVolume].every(Number.isFinite) ||
        steps > 100 ||
        !Number.isInteger(steps) ||
        steps < 1 ||
        factor <= 1 ||
        intermediateUse < 0 ||
        finalRequired <= 0 ||
        extraVolume < 0
    ) {
        result.className = "result result-danger";

        result.innerHTML =
            "段階数は1以上の整数、希釈倍率は1より大きい値を入力してください。液量は0以上、最終必要量は0より大きい値にしてください。";

        return;
    }

    const stages = [];

    let requiredTotalVolume =
        finalRequired + extraVolume;

    for (let stage = steps; stage >= 1; stage--) {
        const previousSolutionVolume =
            requiredTotalVolume / factor;

        const solventVolume =
            requiredTotalVolume - previousSolutionVolume;

        stages.unshift({
            stage,
            totalVolume: requiredTotalVolume,
            previousSolutionVolume,
            solventVolume
        });

        if (stage > 1) {
            requiredTotalVolume =
                intermediateUse +
                previousSolutionVolume +
                extraVolume;
        }
    }

    const displayUnit =
        volumeUnit === "uL" ? "µL" : "mL";

    const stageHtml = stages.map((stageData) => {
        const sourceName =
            stageData.stage === 1
                ? "原液"
                : `第${stageData.stage - 1}段階液`;

        const warning =
            createSerialPipetteWarning(
                stageData.previousSolutionVolume,
                volumeUnit
            );

        return `
            <div class="stage-card">
                <h3>第${stageData.stage}段階</h3>

                <p>
                    <strong>作製総量</strong><br>
                    ${formatNumber(stageData.totalVolume)} ${displayUnit}
                </p>

                <p>
                    <strong>${sourceName}</strong><br>
                    ${formatNumber(stageData.previousSolutionVolume)} ${displayUnit}
                </p>

                <p>
                    <strong>溶媒</strong><br>
                    ${formatNumber(stageData.solventVolume)} ${displayUnit}
                </p>

                ${warning}
            </div>
        `;
    }).join("");

    result.className = "result result-ok";

    result.innerHTML = `
        <strong>段階希釈計画</strong><br>
        ${factor}倍希釈を${steps}段階行います。<br><br>
        ${stageHtml}
    `;
}
function createSerialPipetteWarning(volume, unit) {
    const volumeInMicroLiter =
        unit === "mL" ? volume * 1000 : volume;

    if (volumeInMicroLiter < 2) {
        return `
            <p class="inline-warning danger-text">
                🔴 2 µL未満です。使用するピペットの対応範囲を確認してください。段階希釈条件の見直しを検討してください。
            </p>
        `;
    }

    if (volumeInMicroLiter < 20) {
        return `
            <p class="inline-warning warning-text">
                🟡 少量操作です。ピペッティング誤差に注意してください。
            </p>
        `;
    }

    return "";
}