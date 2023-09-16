import {saveAs} from 'file-saver';
import {useState} from 'react';
import MoveFetcher from "../utils/MoveFetcher";
import {Variant} from "../logic/Lichess";
import PgnUtils from "../utils/PgnUtils";


const MAX_VARIANTS_PER_FILE: number = 100;

function useSavePgn(variants: Variant[], openingName: string) {
    const [isSaving, setIsSaving] = useState(false);

    async function savePgn() {
        setIsSaving(true);

        const moveFetcher = new MoveFetcher("");

        const openingNamePromises: Promise<string>[] = variants.map(variant =>
            moveFetcher.fetchOpeningName(variant.moves.map(moveData => moveData.uci))
        );

        Promise.all(openingNamePromises).then((openingNames) => {
            // Create a map to group variants by their opening name
            const groupedVariants: { [key: string]: Variant[] } = {};
            openingNames.forEach((name, index) => {
                if (!groupedVariants[name]) {
                    groupedVariants[name] = [];
                }
                groupedVariants[name].push(variants[index]);
            });

            // Process each group of variants
            for (const [name, groupedVariantList] of Object.entries(groupedVariants)) {
                const chunkCount = Math.ceil(groupedVariantList.length / MAX_VARIANTS_PER_FILE);

                // Split the groupedVariantList into chunks of max size MAX_VARIANTS_PER_FILE
                for (let i = 0; i < chunkCount; i++) {
                    const chunkedVariants = groupedVariantList.slice(i * MAX_VARIANTS_PER_FILE, (i + 1) * MAX_VARIANTS_PER_FILE);
                    const variantNames = new Map<string, number>();

                    const groupedPgnData = chunkedVariants.map((variant, variantIndex) => {
                        const globalIndex = i * MAX_VARIANTS_PER_FILE + variantIndex;
                        const existingCount = variantNames.get(name) || globalIndex;
                        variantNames.set(name, existingCount + 1);
                        const totalCount = groupedVariantList.length;
                        let variantName = name;
                        variantName += ` #${existingCount + 1}/${totalCount}`;
                        const line = variant.moves.length > 0 ? PgnUtils.writeMoves(variant) : '';
                        const gameHeader =
                            `[Event "${variantName}"]\n` +
                            '[Site "https://lichess.org"]\n' +
                            `[Date "${new Date().toISOString().substring(0, 10)}"]\n` +
                            '[Round "?"]\n' +
                            '[White "?"]\n' +
                            '[Black "?"]\n\n';

                        return `${gameHeader}${line}\n\n`;
                    }).join('');

                    const sanitized = name.replace(/\s*:\s*/, " - ");
                    const fileName = chunkCount > 1 ? `${sanitized} #${i + 1}-${chunkCount}.pgn` : `${sanitized}.pgn`;
                    const blob = new Blob([groupedPgnData], {type: "text/plain;charset=utf-8"});
                    saveAs(blob, fileName);
                }
            }

        }).catch(error => {
            console.error(error);
        });

        setIsSaving(false);
    }

    return {
        isSaving,
        savePgn
    };
}

export default useSavePgn;