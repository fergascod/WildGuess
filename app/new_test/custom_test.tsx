import SpeciesSearchScreen, { Taxon } from "@/components/TaxaSelector";
import { useEffect, useState } from "react";

export default function CustomTest() {
    const [speciesList, setSpeciesList] = useState<Taxon[]>([]);
    useEffect(() =>
        console.log(speciesList)
        , [speciesList])
    return <SpeciesSearchScreen onSelect={setSpeciesList} />;
}