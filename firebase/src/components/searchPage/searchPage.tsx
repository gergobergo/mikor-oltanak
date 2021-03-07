import styled from "styled-components/macro";
import {
    Button, CircularProgress, Grid, Paper, TextField, Typography,
} from "@material-ui/core";
import * as React from "react";
import { getGlobalServices } from "../../services/services";
import { checkTaj, createTajHash, sanitiseTaj } from "../../utils/tajUtils";
import { SurgeryList } from "./surgeryList";

type ISearchState = {
    type: "pending";
} | {
    type: "failed";
    error: string;
} | {
    type: "success";
    surgeryIds: string[];
};

export function SearchPage() {
    const [taj, setTaj] = React.useState<string>("");
    const sanitisedTaj = sanitiseTaj(taj);
    const isTajCorrect = checkTaj(sanitisedTaj);
    const tajHelperText = taj === "" || isTajCorrect ? undefined : "A tajszámnak 9 számjegyet kell tartalmaznia";

    const [searchState, setSearchState] = React.useState<ISearchState>();
    const isSearching = searchState?.type === "pending";

    const handleTajChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setTaj(event.target.value);
    }, [setTaj]);

    const handleSearchClick = React.useCallback(() => {
        const search = async () => {
            setSearchState({ type: "pending" });
            const tajHash = createTajHash(taj);
            try {
                const result = await getGlobalServices()?.functionsService.findPatient({
                    tajHash,
                });
                setSearchState({ type: "success", surgeryIds: result?.surgeryIds ?? [] });
            } catch (e) {
                const errorMessage = e?.message ?? "Nem sikerült a keresés - kérjük próbálkozzon újra!";
                setSearchState({ type: "failed", error: errorMessage });
                console.error(e);
            }
        };
        search();
    }, [taj, setSearchState]);

    return (
        <Grid container spacing={5} direction="column" alignItems="center">
            <Grid item xs={12} md={6}>
                <Typography variant="h2" gutterBottom>Mikor oltanak?</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="body1" paragraph>
                    Azt tapasztaltuk, hogy páciensként sokszor nem világos számunkra, hogy rajta
                    vagyunk-e már a háziorvosunk/rendelőnk oltási listáján. Orvosként pedig az amúgyis
                    emberfeletti teher mellett sokszor az aggódó, telefonon érdeklődő páciensekkel
                    kell tölteni az időt.
                </Typography>
                <Typography variant="body1" paragraph>
                    Ez az oldal ezt hivatott segíteni.
                </Typography>
                <Typography variant="body1" paragraph>
                    <strong>Páciensként</strong>
                    {" "}
                    megtalálhatja, hogy szerepel-e a háziorvosának/rendelőjének oltási listáján,
                    ha háziorvosa/rendelője ezen a honlapon már regisztrált.
                </Typography>
                <Typography variant="body1" paragraph>
                    <strong>Háziorvosként/rendelőként</strong>
                    {" "}
                    pedig feltöltheti az oltásra várók listáját,
                    hogy a páciensek itt ellenőrizhessék telefonálás helyett,
                    hogy szerepelnek-e az aktuális oltási listán.
                </Typography>
            </Grid>
            <Grid item xs={12} md={6} container direction="column" alignItems="stretch">
                <TextField
                    label="Tajszám"
                    variant="outlined"
                    helperText={tajHelperText}
                    value={taj}
                    onChange={handleTajChange}
                    disabled={isSearching}
                />
            </Grid>
            <Grid item xs={12} md={6} container direction="column" alignItems="stretch">
                <Button
                    disabled={!isTajCorrect || isSearching}
                    variant="contained"
                    color="primary"
                    onClick={handleSearchClick}
                    fullWidth
                    size="large"
                >
                    Keresés
                </Button>
            </Grid>
            <Grid item xs={12} md={6} container direction="column" alignItems="stretch">
                {searchState?.type === "pending" && (
                    <CentredDiv>
                        <CircularProgress />
                    </CentredDiv>
                )}
                {searchState?.type === "failed" && (
                    <FailureResultPaper elevation={1}>
                        <Typography variant="body1">
                            <strong>Hiba a kereséskor!</strong>
                            {" "}
                            {searchState.error}
                        </Typography>
                    </FailureResultPaper>
                )}
                {searchState?.type === "success" && (
                    searchState.surgeryIds.length === 0 ? (
                        <FailureResultPaper elevation={1}>
                            <Typography variant="body1">
                                Ön még nem szerepel oltási listán.
                            </Typography>
                        </FailureResultPaper>
                    ) : (
                        <SuccessResultPaper elevation={1}>
                            <Typography variant="body1">
                                Ön a következő háziorvos/rendelő oltási listáján szerepel:
                            </Typography>
                            <SurgeryList surgeryIds={searchState.surgeryIds} />
                        </SuccessResultPaper>
                    )
                )}
            </Grid>
            <Grid item xs={12} md={6} container direction="column" alignItems="stretch">
                <Typography variant="body2" paragraph>
                    <strong>Fontos!</strong>
                    {" "}
                    Ez az oldal csak akkor tud segíteni,
                    ha háziorvosa/rendelője feltöltötte az aktuális oltási listáját.
                </Typography>
                <Typography variant="body2" paragraph>
                    Továbbá az oldal nem tárol semmilyen személyes adatot.
                    A keresett tajszámot sosem juttatjuk el a szerverekhez, hanem ezeknek egy kriptográfiailag
                    hashelt, visszafejthetetlen verzióját küldjük el.
                </Typography>
                <Typography variant="body2" paragraph>
                    A rendszer védelme érdekében naponta maximum 10 keresést végezhet el.
                </Typography>
            </Grid>
            <Grid item xs={12} md={6} container direction="column" alignItems="stretch">
                <Typography variant="h5">Az oldalon az alábbi háziorvosok/rendelők regisztráltak</Typography>
                <SurgeryList />
            </Grid>
        </Grid>
    );
}

const ResultPaper = styled(Paper)`
    margin: 1rem;
    padding: 1rem;
`;

const SuccessResultPaper = styled(ResultPaper)`
    background-color: #e8ffde;
`;

const FailureResultPaper = styled(ResultPaper)`
    background-color: #ffe4e0;
`;

const CentredDiv = styled.div`
    text-align: center;
`;
