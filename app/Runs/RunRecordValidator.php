<?php

namespace App\Runs;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

final class RunRecordValidator
{
    /** @param array<string,mixed> $record
     * @param  array<string,mixed>  $catalog
     * @return array<string,mixed>
     */
    public function validate(array $record, array $catalog): array
    {
        $kinds = $catalog['enemies'];
        $completion = $catalog['victory']['kind'] === 'duration' ? 'survival' : 'final-boss';
        $rules = [
            'content_version' => 'prohibited', 'content_hash' => 'prohibited', 'preset' => 'prohibited',
            'id' => 'required|uuid', 'outcome' => 'required|in:victory,defeat', 'completionKind' => ['required', Rule::in([$completion, 'defeat'])],
            'elapsed' => 'required|numeric|between:0,86400', 'score' => 'required|integer|between:0,100000000', 'kills' => 'required|integer|between:0,1000000',
            'level' => 'required|integer|between:1,'.$catalog['maxLevel'], 'finishedAt' => 'required|date',
            'abilities' => 'required|array|max:5', 'abilities.*' => ['string', 'distinct', Rule::in(array_keys($catalog['skills']))],
            'byKind' => 'required|array:'.implode(',', array_keys($kinds)),
            'eliteByKind' => 'sometimes|array:'.implode(',', array_keys($kinds)).'|size:'.count($kinds),
            'finalEncounter' => 'required|array:reached,duration,killed', 'finalEncounter.reached' => 'required|boolean', 'finalEncounter.killed' => 'required|boolean', 'finalEncounter.duration' => 'required|numeric|between:0,86400',
            'details' => 'required|array:character,biome,regularKills,eliteKills,bossKills,damage', 'details.character' => 'required|string', 'details.biome' => 'required|string',
            'details.regularKills' => 'required|integer|min:0|max:1000000', 'details.eliteKills' => 'required|integer|min:0|max:1000000', 'details.bossKills' => 'required|integer|min:0|max:1000000',
            'details.damage' => 'present|array|max:5', 'details.damage.*' => 'array:id,damage', 'details.damage.*.id' => 'required|string|max:40|distinct', 'details.damage.*.damage' => 'required|numeric|between:0,1000000000000',
        ];
        foreach (array_keys($kinds) as $kind) {
            $rules['byKind.'.$kind] = 'required|integer|between:0,1000000';
            $rules['eliteByKind.'.$kind] = 'sometimes|integer|between:0,1000000';
        }

        return Validator::make($record, $rules)->validate();
    }
}
